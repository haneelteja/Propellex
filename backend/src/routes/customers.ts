import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/asyncHandler';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getPool, sql } from '../config/db';
import { withCache, cacheDelete, cacheDeletePattern, CACHE_TTL } from '../services/cache';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerListParams } from '../models/customer';

export const customersRouter = Router();

// GET /api/customers
customersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit = '50', after_id, search } = req.query as CustomerListParams & Record<string, string>;
    const pageLimit = Math.min(parseInt(String(limit), 10), 100);

    const cacheKey = `customers:list:${search ?? ''}:${after_id ?? 'start'}:${pageLimit}`;

    const customers = await withCache<Customer[]>(cacheKey, CACHE_TTL.CUSTOMERS_LIST, async () => {
      const pool = await getPool();
      const request = pool.request().input('limit', sql.Int, pageLimit);
      const conditions: string[] = [];

      if (after_id) {
        request.input('afterId', sql.UniqueIdentifier, after_id);
        conditions.push('c.id > @afterId');
      }
      if (search) {
        request.input('search', sql.NVarChar(255), `%${search}%`);
        conditions.push(
          "(c.first_name LIKE @search OR c.last_name LIKE @search OR c.email LIKE @search)",
        );
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await request.query(`
        SELECT TOP (@limit)
          c.id, c.first_name, c.last_name, c.email, c.phone,
          c.shipping_address, c.total_orders, c.total_spent, c.created_at, c.updated_at
        FROM dbo.Customers c
        ${whereClause}
        ORDER BY c.created_at DESC
      `);

      return result.recordset as Customer[];
    });

    res.json({ data: customers, count: customers.length });
  }),
);

// GET /api/customers/:id — customer + recent orders
customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `customers:detail:${id}`;

    const customer = await withCache<(Customer & { recent_orders: unknown[] }) | null>(
      cacheKey,
      CACHE_TTL.CUSTOMER_DETAIL,
      async () => {
        const pool = await getPool();
        const result = await pool
          .request()
          .input('id', sql.UniqueIdentifier, id)
          .query(`
            SELECT id, first_name, last_name, email, phone,
                   shipping_address, total_orders, total_spent, created_at, updated_at
            FROM dbo.Customers
            WHERE id = @id
          `);

        if (!result.recordset[0]) return null;

        const ordersResult = await pool
          .request()
          .input('customerId', sql.UniqueIdentifier, id)
          .query(`
            SELECT TOP 10 id, status, total_amount, created_at
            FROM dbo.Orders
            WHERE customer_id = @customerId
            ORDER BY created_at DESC
          `);

        return { ...result.recordset[0], recent_orders: ordersResult.recordset };
      },
    );

    if (!customer) throw new NotFoundError('Customer');
    res.json(customer);
  }),
);

// POST /api/customers
customersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as CreateCustomerDto;
    if (!body.first_name) throw new ValidationError('first_name is required');
    if (!body.last_name) throw new ValidationError('last_name is required');
    if (!body.email) throw new ValidationError('email is required');

    const id = uuidv4();
    const pool = await getPool();

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('firstName', sql.NVarChar(100), body.first_name)
      .input('lastName', sql.NVarChar(100), body.last_name)
      .input('email', sql.NVarChar(255), body.email)
      .input('phone', sql.NVarChar(50), body.phone ?? null)
      .input('shippingAddress', sql.NVarChar(500), body.shipping_address ?? null)
      .query(`
        INSERT INTO dbo.Customers
          (id, first_name, last_name, email, phone, shipping_address, total_orders, total_spent, created_at, updated_at)
        VALUES
          (@id, @firstName, @lastName, @email, @phone, @shippingAddress, 0, 0, GETUTCDATE(), GETUTCDATE())
      `);

    await cacheDeletePattern('customers:list:*');
    res.status(201).json({ id });
  }),
);

// PATCH /api/customers/:id
customersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body as UpdateCustomerDto;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('firstName', sql.NVarChar(100), body.first_name ?? null)
      .input('lastName', sql.NVarChar(100), body.last_name ?? null)
      .input('phone', sql.NVarChar(50), body.phone ?? null)
      .input('shippingAddress', sql.NVarChar(500), body.shipping_address ?? null)
      .query(`
        UPDATE dbo.Customers
        SET
          first_name = COALESCE(@firstName, first_name),
          last_name = COALESCE(@lastName, last_name),
          phone = COALESCE(@phone, phone),
          shipping_address = COALESCE(@shippingAddress, shipping_address),
          updated_at = GETUTCDATE()
        OUTPUT inserted.*
        WHERE id = @id
      `);

    if (!result.recordset[0]) throw new NotFoundError('Customer');

    await Promise.all([
      cacheDelete(`customers:detail:${id}`),
      cacheDeletePattern('customers:list:*'),
    ]);

    res.json(result.recordset[0]);
  }),
);
