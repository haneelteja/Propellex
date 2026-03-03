import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/asyncHandler';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getPool, sql } from '../config/db';
import { withCache, cacheDelete, cacheDeletePattern, CACHE_TTL } from '../services/cache';
import type {
  Order,
  OrderWithItems,
  CreateOrderDto,
  UpdateOrderDto,
  OrderListParams,
} from '../models/order';

export const ordersRouter = Router();

// GET /api/orders — keyset-paginated list with Redis cache
ordersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit = '50', after_id, customer_id, status } = req.query as OrderListParams & Record<string, string>;
    const pageLimit = Math.min(parseInt(String(limit), 10), 100);

    const cacheKey = `orders:list:${customer_id ?? 'all'}:${status ?? 'all'}:${after_id ?? 'start'}:${pageLimit}`;

    const orders = await withCache<Order[]>(cacheKey, CACHE_TTL.ORDERS_LIST, async () => {
      const pool = await getPool();
      const request = pool
        .request()
        .input('limit', sql.Int, pageLimit);

      const conditions: string[] = [];

      if (after_id) {
        request.input('afterId', sql.UniqueIdentifier, after_id);
        conditions.push('o.id > @afterId');
      }
      if (customer_id) {
        request.input('customerId', sql.UniqueIdentifier, customer_id);
        conditions.push('o.customer_id = @customerId');
      }
      if (status) {
        request.input('status', sql.NVarChar(50), status);
        conditions.push('o.status = @status');
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await request.query(`
        SELECT TOP (@limit)
          o.id, o.customer_id, o.status, o.total_amount,
          o.shipping_address, o.notes, o.created_at, o.updated_at
        FROM dbo.Orders o
        ${whereClause}
        ORDER BY o.created_at DESC
      `);

      return result.recordset as Order[];
    });

    res.json({ data: orders, count: orders.length });
  }),
);

// GET /api/orders/:id — single order with line items
ordersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `orders:detail:${id}`;

    const order = await withCache<OrderWithItems | null>(cacheKey, CACHE_TTL.ORDER_DETAIL, async () => {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          SELECT
            o.id, o.customer_id, o.status, o.total_amount,
            o.shipping_address, o.notes, o.created_at, o.updated_at,
            c.first_name + ' ' + c.last_name AS customer_name,
            c.email AS customer_email
          FROM dbo.Orders o
          JOIN dbo.Customers c ON c.id = o.customer_id
          WHERE o.id = @id
        `);

      if (!result.recordset[0]) return null;

      const itemsResult = await pool
        .request()
        .input('orderId', sql.UniqueIdentifier, id)
        .query(`
          SELECT oi.id, oi.order_id, oi.product_id, p.name AS product_name,
                 oi.quantity, oi.unit_price,
                 oi.quantity * oi.unit_price AS line_total
          FROM dbo.OrderItems oi
          JOIN dbo.Products p ON p.id = oi.product_id
          WHERE oi.order_id = @orderId
        `);

      return { ...result.recordset[0], items: itemsResult.recordset } as OrderWithItems;
    });

    if (!order) throw new NotFoundError('Order');
    res.json(order);
  }),
);

// POST /api/orders — create order (write-through invalidation)
ordersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as CreateOrderDto;

    if (!body.customer_id) throw new ValidationError('customer_id is required');
    if (!body.items?.length) throw new ValidationError('items must not be empty');
    if (!body.shipping_address) throw new ValidationError('shipping_address is required');

    const pool = await getPool();
    const transaction = new sql.Transaction(await getPool());

    try {
      await transaction.begin();
      const orderId = uuidv4();

      // Calculate total from product prices
      const productIds = body.items.map((i) => i.product_id).join(',');
      const pricesResult = await new sql.Request(transaction)
        .input('ids', sql.NVarChar(sql.MAX), productIds)
        .query(`
          SELECT id, price, stock_quantity FROM dbo.Products
          WHERE id IN (SELECT value FROM STRING_SPLIT(@ids, ','))
        `);

      const priceMap = new Map<string, { price: number; stock: number }>(
        pricesResult.recordset.map((p: { id: string; price: number; stock_quantity: number }) => [
          p.id,
          { price: p.price, stock: p.stock_quantity },
        ]),
      );

      let totalAmount = 0;
      for (const item of body.items) {
        const product = priceMap.get(item.product_id);
        if (!product) throw new ValidationError(`Product ${item.product_id} not found`);
        if (product.stock < item.quantity)
          throw new ValidationError(`Insufficient stock for product ${item.product_id}`);
        totalAmount += product.price * item.quantity;
      }

      await new sql.Request(transaction)
        .input('id', sql.UniqueIdentifier, orderId)
        .input('customerId', sql.UniqueIdentifier, body.customer_id)
        .input('totalAmount', sql.Decimal(10, 2), totalAmount)
        .input('shippingAddress', sql.NVarChar(500), body.shipping_address)
        .input('notes', sql.NVarChar(1000), body.notes ?? null)
        .query(`
          INSERT INTO dbo.Orders (id, customer_id, status, total_amount, shipping_address, notes, created_at, updated_at)
          VALUES (@id, @customerId, 'pending', @totalAmount, @shippingAddress, @notes, GETUTCDATE(), GETUTCDATE())
        `);

      for (const item of body.items) {
        const product = priceMap.get(item.product_id)!;
        await new sql.Request(transaction)
          .input('id', sql.UniqueIdentifier, uuidv4())
          .input('orderId', sql.UniqueIdentifier, orderId)
          .input('productId', sql.UniqueIdentifier, item.product_id)
          .input('quantity', sql.Int, item.quantity)
          .input('unitPrice', sql.Decimal(10, 2), product.price)
          .query(`
            INSERT INTO dbo.OrderItems (id, order_id, product_id, quantity, unit_price)
            VALUES (@id, @orderId, @productId, @quantity, @unitPrice)
          `);

        // Decrement stock
        await new sql.Request(transaction)
          .input('qty', sql.Int, item.quantity)
          .input('productId', sql.UniqueIdentifier, item.product_id)
          .query(`UPDATE dbo.Products SET stock_quantity = stock_quantity - @qty WHERE id = @productId`);
      }

      await transaction.commit();

      // Invalidate related caches
      await Promise.all([
        cacheDeletePattern('orders:list:*'),
        cacheDelete(`orders:detail:${orderId}`),
        cacheDeletePattern('products:list:*'), // stock changed
        pool.request()
          .input('customerId', sql.UniqueIdentifier, body.customer_id)
          .query(`
            UPDATE dbo.Customers
            SET total_orders = total_orders + 1, total_spent = total_spent + ${totalAmount}
            WHERE id = @customerId
          `),
      ]);

      res.status(201).json({ id: orderId, total_amount: totalAmount, status: 'pending' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }),
);

// PATCH /api/orders/:id — update status
ordersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body as UpdateOrderDto;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (body.status && !validStatuses.includes(body.status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('status', sql.NVarChar(50), body.status ?? null)
      .input('shippingAddress', sql.NVarChar(500), body.shipping_address ?? null)
      .input('notes', sql.NVarChar(1000), body.notes ?? null)
      .query(`
        UPDATE dbo.Orders
        SET
          status = COALESCE(@status, status),
          shipping_address = COALESCE(@shippingAddress, shipping_address),
          notes = COALESCE(@notes, notes),
          updated_at = GETUTCDATE()
        OUTPUT inserted.*
        WHERE id = @id
      `);

    if (!result.recordset[0]) throw new NotFoundError('Order');

    await Promise.all([
      cacheDelete(`orders:detail:${id}`),
      cacheDeletePattern('orders:list:*'),
    ]);

    res.json(result.recordset[0]);
  }),
);
