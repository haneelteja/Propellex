import { Pool } from 'pg';

// Neon.tech and other cloud PG providers require SSL in production
const isProduction = process.env.NODE_ENV === 'production';

// Strip unsupported params and force sslmode=require for Neon
const rawUrl = process.env.DATABASE_URL ?? '';
const cleanUrl = rawUrl
  .replace(/[?&]channel_binding=[^&]*/g, '')
  .replace(/[?&]sslmode=[^&]*/g, '')
  .replace(/\?$/, '');
const connectionString = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'sslmode=no-verify';

export const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
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
