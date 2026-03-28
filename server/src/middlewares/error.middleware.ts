import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

const isProd = process.env.NODE_ENV === 'production';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error('Request error', error, { path: _req.path, method: _req.method });

  const status = (err as { status?: number }).status ?? 500;
  const message = status === 500 && isProd ? 'Internal server error' : error.message;

  res.status(status).json({ message });
}
