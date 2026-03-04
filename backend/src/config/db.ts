import { Pool } from 'pg';

// Neon.tech and other cloud PG providers require SSL in production
const isProduction = process.env.NODE_ENV === 'production';

// Strip channel_binding param — node-postgres doesn't support it
const connectionString = (process.env.DATABASE_URL ?? '').replace(/[?&]channel_binding=[^&]*/g, '').replace(/\?$/, '');

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) ?? null;
}
