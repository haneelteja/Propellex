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

// Neon free tier suspends after ~5 min of inactivity.
// These error codes indicate a cold-start wake — we retry with backoff.
const WAKE_ERROR_CODES = new Set([
  'ECONNREFUSED',   // compute not yet accepting connections
  'ETIMEDOUT',      // TCP timeout while Neon boots
  'ECONNRESET',     // connection dropped mid-wake
  'EPIPE',          // broken pipe on wake
]);
const WAKE_PG_CODES = new Set([
  '57P03',  // cannot_connect_now — Neon is starting
  '08006',  // connection_failure
  '08001',  // sqlclient_unable_to_establish_sqlconnection
]);

function isWakeError(err: unknown): boolean {
  const e = err as Error & { code?: string; errors?: Array<Error & { code?: string }> };
  if (e.name === 'AggregateError') return true;
  if (e.code && (WAKE_ERROR_CODES.has(e.code) || WAKE_PG_CODES.has(e.code))) return true;
  // AggregateError wraps sub-errors on dns multi-lookup
  if (e.errors?.some((sub) => sub.code && WAKE_ERROR_CODES.has(sub.code))) return true;
  return false;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isWakeError(err) && attempts > 1) {
      const delay = attempts === 3 ? 4_000 : 8_000; // 4s first retry, 8s second
      console.warn(`[DB] Wake error — Neon may be starting up. Retrying in ${delay / 1000}s (${attempts - 1} left)...`);
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, attempts - 1);
    }
    throw err;
  }
}

/** Ping the DB every `intervalMs` ms to prevent Neon from auto-suspending.
 *  Call once at server startup. */
export function startDbKeepAlive(intervalMs = 4 * 60_000) {
  const ping = async () => {
    try {
      await pool.query('SELECT 1');
      // silent success — do not spam logs
    } catch (err) {
      console.warn('[DB] Keep-alive ping failed:', (err as Error).message);
    }
  };
  setInterval(ping, intervalMs);
  console.info(`[DB] Keep-alive ping scheduled every ${intervalMs / 1000}s`);
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await withRetry(() => pool.query(text, params));
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await withRetry(() => pool.query(text, params));
  return (result.rows[0] as T) ?? null;
}
