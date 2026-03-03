import { redis } from '../config/redis';
import { logger } from '../middleware/requestLogger';
import { register, Gauge } from 'prom-client';

// Track cache hit rate for Prometheus
const cacheHits = new Gauge({
  name: 'redis_cache_hits_total',
  help: 'Total Redis cache hits',
  registers: [register],
});
const cacheMisses = new Gauge({
  name: 'redis_cache_misses_total',
  help: 'Total Redis cache misses',
  registers: [register],
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (raw !== null) {
      cacheHits.inc();
      return JSON.parse(raw) as T;
    }
    cacheMisses.inc();
    return null;
  } catch (err) {
    logger.warn({ err, key }, 'Redis GET failed — falling through to DB');
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'Redis SET failed — continuing without cache');
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, 'Redis DEL failed');
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn({ err, pattern }, 'Redis pattern DEL failed');
  }
}

/**
 * Lazy-load cache wrapper:
 * 1. Try to read from Redis
 * 2. On miss, execute fetchFn
 * 3. Populate cache with result
 * 4. Return result
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

export const CACHE_TTL = {
  ORDERS_LIST: 120,      // 2 minutes
  ORDER_DETAIL: 300,     // 5 minutes
  PRODUCTS_LIST: 300,    // 5 minutes
  PRODUCT_DETAIL: 600,   // 10 minutes
  CUSTOMERS_LIST: 180,   // 3 minutes
  CUSTOMER_DETAIL: 300,  // 5 minutes
  DASHBOARD_STATS: 60,   // 1 minute
} as const;
