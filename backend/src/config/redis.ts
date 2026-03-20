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

/** Connect to Redis and wait until it is truly ready (survives Upstash cold-start drops).
 *  Upstash free-tier pauses databases on inactivity; the first TCP connection is accepted
 *  then immediately closed while Upstash wakes up. We wait for the 'ready' event (fires
 *  after ioredis reconnects and the connection is stable) with a 15s timeout. */
export async function connectRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      redis.off('ready', onReady);
      reject(new Error('Redis connection timed out after 15s'));
    }, 15_000);

    const onReady = () => {
      clearTimeout(timeout);
      resolve();
    };

    redis.once('ready', onReady);
    // Trigger the connection attempt; errors are handled by retryStrategy + the ready event
    redis.connect().catch(() => {
      // Initial connect may throw on Upstash cold-start — retryStrategy reconnects automatically
    });
  });
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}

/** Ping Redis every `intervalMs` ms to prevent Upstash from archiving the DB due to inactivity.
 *  Upstash free-tier databases are archived after extended idle periods.
 *  Call once at server startup, after connectRedis() succeeds. */
export function startRedisKeepAlive(intervalMs = 4 * 60_000) {
  const ping = async () => {
    try {
      await redis.ping();
      // silent success — do not spam logs
    } catch (err) {
      console.warn('[Redis] Keep-alive ping failed:', (err as Error).message);
    }
  };
  setInterval(ping, intervalMs);
  console.info(`[Redis] Keep-alive ping scheduled every ${intervalMs / 1000}s`);
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
