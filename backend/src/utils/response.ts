import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: ApiResponse['pagination'],
): void {
  res.json({ success: true, data, pagination });
}

export function fail(res: Response, message: string, status = 400): void {
  res.status(status).json({ success: false, error: message });
}

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const asyncHandler =
  (fn: Function) =>
  (req: unknown, res: unknown, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
