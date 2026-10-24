import { Router } from 'express';

/**
 * GET /api/health — unauthenticated liveness check. Deployment platforms
 * (Vercel) and uptime monitors hit this; it must never touch the database,
 * so it stays healthy even if Postgres is briefly unreachable.
 */
export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
