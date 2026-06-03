import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - Error ${statusCode}: ${err.message}`);

  if (!isProduction) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
