import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  console.error(`[Error] ${req.method} ${req.url} → ${status}: ${err.message}`, err.stack ?? err);
  const agg = err as Error & { errors?: Error[]; code?: string };
  if (agg.errors?.length) {
    agg.errors.forEach((sub, i) => console.error(`[Error]   sub[${i}]:`, sub.message));
  }

  res.status(status).json({ success: false, error: message });
}
