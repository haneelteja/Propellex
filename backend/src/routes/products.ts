import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/asyncHandler';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getPool, sql } from '../config/db';
import { withCache, cacheDelete, cacheDeletePattern, CACHE_TTL } from '../services/cache';
import type { Product, CreateProductDto, UpdateProductDto, ProductListParams } from '../models/product';

export const productsRouter = Router();

// GET /api/products
productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit = '50', after_id, category, search, in_stock } = req.query as ProductListParams & Record<string, string>;
    const pageLimit = Math.min(parseInt(String(limit), 10), 100);

    const cacheKey = `products:list:${category ?? 'all'}:${search ?? ''}:${in_stock ?? 'all'}:${after_id ?? 'start'}:${pageLimit}`;

    const products = await withCache<Product[]>(cacheKey, CACHE_TTL.PRODUCTS_LIST, async () => {
      const pool = await getPool();
      const request = pool.request().input('limit', sql.Int, pageLimit);
      const conditions: string[] = ['p.is_active = 1'];

      if (after_id) {
        request.input('afterId', sql.UniqueIdentifier, after_id);
        conditions.push('p.id > @afterId');
      }
      if (category) {
        request.input('category', sql.NVarChar(100), category);
        conditions.push('p.category = @category');
      }
      if (search) {
        request.input('search', sql.NVarChar(255), `%${search}%`);
        conditions.push('(p.name LIKE @search OR p.sku LIKE @search)');
      }
      if (in_stock === 'true') {
        conditions.push('p.stock_quantity > 0');
      }

      const result = await request.query(`
        SELECT TOP (@limit)
          p.id, p.name, p.sku, p.description, p.price,
          p.stock_quantity, p.category, p.is_active, p.created_at, p.updated_at
        FROM dbo.Products p
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.created_at DESC
      `);

      return result.recordset as Product[];
    });

    res.json({ data: products, count: products.length });
  }),
);

// GET /api/products/:id
productsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `products:detail:${id}`;

    const product = await withCache<Product | null>(cacheKey, CACHE_TTL.PRODUCT_DETAIL, async () => {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          SELECT id, name, sku, description, price, stock_quantity, category, is_active, created_at, updated_at
          FROM dbo.Products
          WHERE id = @id
        `);
      return (result.recordset[0] as Product) ?? null;
    });

    if (!product) throw new NotFoundError('Product');
    res.json(product);
  }),
);

// POST /api/products
productsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as CreateProductDto;
    if (!body.name) throw new ValidationError('name is required');
    if (!body.sku) throw new ValidationError('sku is required');
    if (body.price == null || body.price < 0) throw new ValidationError('price must be >= 0');

    const id = uuidv4();
    const pool = await getPool();

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar(255), body.name)
      .input('sku', sql.NVarChar(100), body.sku)
      .input('description', sql.NVarChar(sql.MAX), body.description ?? null)
      .input('price', sql.Decimal(10, 2), body.price)
      .input('stockQuantity', sql.Int, body.stock_quantity ?? 0)
      .input('category', sql.NVarChar(100), body.category ?? 'Uncategorized')
      .query(`
        INSERT INTO dbo.Products (id, name, sku, description, price, stock_quantity, category, is_active, created_at, updated_at)
        VALUES (@id, @name, @sku, @description, @price, @stockQuantity, @category, 1, GETUTCDATE(), GETUTCDATE())
      `);

    await cacheDeletePattern('products:list:*');
    res.status(201).json({ id });
  }),
);

// PATCH /api/products/:id
productsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body as UpdateProductDto;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar(255), body.name ?? null)
      .input('description', sql.NVarChar(sql.MAX), body.description ?? null)
      .input('price', sql.Decimal(10, 2), body.price ?? null)
      .input('stockQuantity', sql.Int, body.stock_quantity ?? null)
      .input('category', sql.NVarChar(100), body.category ?? null)
      .input('isActive', sql.Bit, body.is_active ?? null)
      .query(`
        UPDATE dbo.Products
        SET
          name = COALESCE(@name, name),
          description = COALESCE(@description, description),
          price = COALESCE(@price, price),
          stock_quantity = COALESCE(@stockQuantity, stock_quantity),
          category = COALESCE(@category, category),
          is_active = COALESCE(@isActive, is_active),
          updated_at = GETUTCDATE()
        OUTPUT inserted.*
        WHERE id = @id
      `);

    if (!result.recordset[0]) throw new NotFoundError('Product');

    await Promise.all([
      cacheDelete(`products:detail:${id}`),
      cacheDeletePattern('products:list:*'),
    ]);

    res.json(result.recordset[0]);
  }),
);
