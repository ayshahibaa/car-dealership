import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import { ApiError } from './errorHandler.js';

/** Requires a valid `Authorization: Bearer <token>` header; attaches the decoded user to req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const [scheme, token] = header?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    next(new ApiError(401, 'Authentication required'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/** Must run after requireAuth. Rejects anyone whose token role isn't ADMIN. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    next(new ApiError(403, 'Admin access required'));
    return;
  }
  next();
}
