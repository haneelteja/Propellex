import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 100, 3_000),
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => console.info('[Redis] Connected'));
redis.on('error', (err: Error) => console.error('[Redis] Error:', err.message));

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
  if (count === 1) await redis.expire(key, 86_400); // expire at end of day
  return count;
}

export async function getDailyUsage(userId: string, action: string): Promise<number> {
  const key = `usage:${userId}:${action}:${new Date().toISOString().slice(0, 10)}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}
