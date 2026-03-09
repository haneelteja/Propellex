import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response';
import { queryOne } from '../config/db';

export interface JwtPayload {
  userId: string;
  email: string;
  subscriptionTier: 'free' | 'premium';
  role: 'client' | 'admin' | 'manager';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    fail(res, 'Authentication required', 401);
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as JwtPayload;
    req.user = payload;
    next();
  } catch {
    fail(res, 'Invalid or expired token', 401);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(
        header.slice(7),
        process.env.JWT_SECRET ?? 'dev-secret',
      ) as JwtPayload;
    } catch {
      // token invalid — treat as unauthenticated
    }
  }
  next();
}

/** requireRole — checks role from DB (not JWT) so promotions take effect immediately
 *  without requiring the user to log out and back in. */
export function requireRole(...roles: Array<'client' | 'admin' | 'manager'>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { fail(res, 'Authentication required', 401); return; }

    // Always fetch the live role from DB — the JWT role may be stale if
    // the user was promoted/demoted since they last logged in.
    try {
      const row = await queryOne<{ role: string }>(
        'SELECT role FROM users WHERE id = $1 AND is_active = true',
        [req.user.userId],
      );
      if (!row) { fail(res, 'User not found', 401); return; }

      // Patch req.user so downstream handlers see the current role
      req.user = { ...req.user, role: row.role as JwtPayload['role'] };
    } catch {
      // DB unreachable — fall back to JWT role
    }

    if (!roles.includes(req.user.role)) {
      fail(res, 'Access denied', 403); return;
    }
    next();
  };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET ?? 'dev-secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}
