import DataLoader from 'dataloader';
import { getPool, sql } from '../config/db';
import type { Customer } from '../models/customer';
import type { Product } from '../models/product';

/**
 * Batches individual customer ID lookups into a single
 * WHERE id IN (...) query — prevents N+1 patterns.
 */
export const customerLoader = new DataLoader<string, Customer | null>(
  async (ids: readonly string[]) => {
    const pool = await getPool();
    const idList = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(',');
    const result = await pool
      .request()
      .query(
        `SELECT id, first_name, last_name, email, phone, created_at
         FROM dbo.Customers
         WHERE id IN (${idList})`,
      );

    const byId = new Map<string, Customer>(result.recordset.map((c: Customer) => [c.id, c]));
    return ids.map((id) => byId.get(id) ?? null);
  },
  { maxBatchSize: 100, cache: true },
);

/**
 * Batches individual product ID lookups into a single query.
 */
export const productLoader = new DataLoader<string, Product | null>(
  async (ids: readonly string[]) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ids', sql.NVarChar(sql.MAX), ids.join(','))
      .query(
        `SELECT id, name, sku, price, stock_quantity, category, created_at
         FROM dbo.Products
         WHERE id IN (SELECT value FROM STRING_SPLIT(@ids, ','))`,
      );

    const byId = new Map<string, Product>(result.recordset.map((p: Product) => [p.id, p]));
    return ids.map((id) => byId.get(id) ?? null);
  },
  { maxBatchSize: 100, cache: true },
);
