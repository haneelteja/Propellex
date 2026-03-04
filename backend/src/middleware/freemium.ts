import type { Request, Response, NextFunction } from 'express';
import { getDailyUsage, incrementDailyUsage } from '../config/redis';
import { fail } from '../utils/response';

const FREE_LIMITS: Record<string, number> = {
  search: 5,
  save: 3,
  chat: 5,
};

/**
 * Returns middleware that checks + increments a freemium daily counter.
 * Premium users bypass all limits.
 */
export function freemiumGate(action: 'search' | 'save' | 'chat') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { next(); return; }

    // Premium users have no limits
    if (req.user.subscriptionTier === 'premium') { next(); return; }

    const limit = FREE_LIMITS[action];

    // If Redis is unavailable, fail-open (allow the action)
    let current = 0;
    try {
      current = await getDailyUsage(req.user.userId, action);
    } catch {
      next(); return;
    }

    if (current >= limit) {
      fail(
        res,
        `Free tier limit reached: ${limit} ${action}s per day. Upgrade to Premium for unlimited access.`,
        429,
      );
      return;
    }

    try { await incrementDailyUsage(req.user.userId, action); } catch { /* Redis down — ignore */ }
    next();
  };
}
