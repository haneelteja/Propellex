import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';
import type { Request } from 'express';

export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  // Key per authenticated user ID, fall back to IP
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { id: string } }).user;
    return user?.id ?? (req.ip ?? 'unknown');
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as Promise<unknown>,
  }),
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many requests. Please slow down.',
        code: 'RATE_LIMITED',
      },
    });
  },
});
