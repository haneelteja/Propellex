import type { Request, Response, NextFunction } from 'express';
import { logger } from './requestLogger';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// Must have 4 parameters for Express to recognize as error middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  logger.error(
    {
      err,
      reqId: req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      statusCode,
    },
    err.message,
  );

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      code,
    },
  });
}
