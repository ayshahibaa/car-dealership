import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireAdmin, requireAuth } from '../src/middleware/auth.js';
import { signAccessToken } from '../src/auth/jwt.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';

/**
 * Both middlewares only ever need a JWT — no database — so they're tested
 * against a minimal throwaway app rather than the real one, the same way a
 * unit test would isolate any other piece of middleware.
 */
function buildTestApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ userId: req.user?.userId });
  });
  app.get('/admin-only', requireAuth, requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('requireAuth', () => {
  it('rejects a request with no Authorization header', async () => {
    const response = await request(buildTestApp()).get('/protected');

    expect(response.status).toBe(401);
  });

  it('rejects a malformed Authorization header', async () => {
    const response = await request(buildTestApp()).get('/protected').set('Authorization', 'not-a-bearer-token');

    expect(response.status).toBe(401);
  });

  it('rejects an invalid/expired token', async () => {
    const response = await request(buildTestApp()).get('/protected').set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });

  it('allows a request with a valid token and attaches the decoded user', async () => {
    const token = signAccessToken({ userId: 'user-1', email: 'jerry@example.com', role: 'USER' });

    const response = await request(buildTestApp()).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-1' });
  });
});

describe('requireAdmin', () => {
  it('rejects a valid USER token with 403', async () => {
    const token = signAccessToken({ userId: 'user-1', email: 'jerry@example.com', role: 'USER' });

    const response = await request(buildTestApp()).get('/admin-only').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('allows a valid ADMIN token', async () => {
    const token = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

    const response = await request(buildTestApp()).get('/admin-only').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
