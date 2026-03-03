import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    if (times > 10) return null; // stop retrying after 10 attempts
    return Math.min(times * 100, 3_000); // exponential backoff, max 3s
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.info('[Redis] Connected');
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Error:', err.message);
});

redis.on('reconnecting', (delay: number) => {
  console.warn(`[Redis] Reconnecting in ${delay}ms`);
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
  console.info('[Redis] Connection closed');
}
