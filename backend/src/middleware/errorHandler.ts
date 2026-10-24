import type { NextFunction, Request, Response } from 'express';

/** Thrown by route handlers/services for any expected failure (validation, 404, auth, etc.). */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Mounted after every route: turns a 404 into the same JSON error shape as everything else. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });
}

/**
 * The single place every error — ApiError or unexpected — becomes a response.
 * Must be registered last, and must keep the 4-argument signature so Express
 * recognises it as an error handler.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
