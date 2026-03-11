import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  retryStrategy: (times) => {
    if (times > 5) return null; // give up after 5 attempts — avoids infinite log spam
    return Math.min(times * 1_000, 5_000);
  },
  maxRetriesPerRequest: null, // let ioredis retry commands on reconnect instead of failing instantly
  lazyConnect: true,
  enableOfflineQueue: true,   // queue commands during brief disconnects (Upstash drops idle connections)
  reconnectOnError: (err) => {
    // Reconnect on connection-level errors, not on auth or command errors
    return err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT');
  },
});

// Only log first connect and genuine errors (not routine reconnects)
let _connected = false;
redis.on('connect', () => {
  if (!_connected) { console.info('[Redis] Connected'); _connected = true; }
});
redis.on('reconnecting', () => { _connected = false; });
redis.on('error', (err: Error) => {
  // Suppress noisy "max retries" messages — only log distinct errors
  if (!err.message.includes('maxRetriesPerRequest')) {
    console.error('[Redis] Error:', err.message);
  }
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}

/** Increment a daily usage counter. Returns the new count. */
export async function incrementDailyUsage(
  userId: string,
  action: string,
): Promise<number> {
  const key = `usage:${userId}:${action}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86_400);
  return count;
}

export async function getDailyUsage(userId: string, action: string): Promise<number> {
  const key = `usage:${userId}:${action}:${new Date().toISOString().slice(0, 10)}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}
