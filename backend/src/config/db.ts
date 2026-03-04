import { Pool } from 'pg';

// Parse DATABASE_URL into explicit fields so URL query params don't interfere with SSL
function buildPoolConfig() {
  const raw = process.env.DATABASE_URL ?? '';
  try {
    const u = new URL(raw);
    console.info('[DB] Connecting to', u.hostname, 'db:', u.pathname.slice(1));
    return {
      host: u.hostname,
      port: parseInt(u.port || '5432', 10),
      database: u.pathname.slice(1),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 30_000,
    };
  } catch {
    console.warn('[DB] Could not parse DATABASE_URL, using raw connection string');
    return { connectionString: raw, ssl: { rejectUnauthorized: false }, max: 5 };
  }
}

export const pool = new Pool(buildPoolConfig());

pool.on('connect', () => console.info('[DB] Client connected'));
pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
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
