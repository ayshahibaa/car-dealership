import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAuthRouter } from '../src/routes/auth.router.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { hashPassword } from '../src/auth/password.js';
import type { StoredUser, UserRepository } from '../src/auth/userRepository.js';

/**
 * The router is built with an injected UserRepository, so this exercises the
 * real HTTP layer (status codes, request parsing, response shapes) end to
 * end without a database — the same fake used in authService.test.ts.
 */
function buildApp(seed: StoredUser[] = []) {
  const users = [...seed];
  const repo: UserRepository = {
    async findByEmail(email) {
      return users.find((u) => u.email === email) ?? null;
    },
    async create({ email, passwordHash }) {
      const user: StoredUser = { id: `user-${users.length + 1}`, email, passwordHash, role: 'USER' };
      users.push(user);
      return user;
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter(repo));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('POST /api/auth/register', () => {
  it('returns 201 with a user and token for valid input', async () => {
    const response = await request(buildApp()).post('/api/auth/register').send({ email: 'jerry@example.com', password: 'longenough' });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('jerry@example.com');
    expect(typeof response.body.token).toBe('string');
  });

  it('returns 400 for an invalid email', async () => {
    const response = await request(buildApp()).post('/api/auth/register').send({ email: 'not-an-email', password: 'longenough' });

    expect(response.status).toBe(400);
  });

  it('returns 400 for a too-short password', async () => {
    const response = await request(buildApp()).post('/api/auth/register').send({ email: 'jerry@example.com', password: 'short' });

    expect(response.status).toBe(400);
  });

  it('returns 409 for a duplicate email', async () => {
    const hash = await hashPassword('whatever12');
    const app = buildApp([{ id: 'user-1', email: 'jerry@example.com', passwordHash: hash, role: 'USER' }]);

    const response = await request(app).post('/api/auth/register').send({ email: 'jerry@example.com', password: 'longenough' });

    expect(response.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with a user and token for correct credentials', async () => {
    const hash = await hashPassword('correct-password');
    const app = buildApp([{ id: 'user-1', email: 'jerry@example.com', passwordHash: hash, role: 'USER' }]);

    const response = await request(app).post('/api/auth/login').send({ email: 'jerry@example.com', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('jerry@example.com');
    expect(typeof response.body.token).toBe('string');
  });

  it('returns 401 for a wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const app = buildApp([{ id: 'user-1', email: 'jerry@example.com', passwordHash: hash, role: 'USER' }]);

    const response = await request(app).post('/api/auth/login').send({ email: 'jerry@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  it('returns 401 for an unknown email', async () => {
    const response = await request(buildApp()).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever' });

    expect(response.status).toBe(401);
  });

  it('returns 400 when the email field is missing', async () => {
    const response = await request(buildApp()).post('/api/auth/login').send({ password: 'whatever' });

    expect(response.status).toBe(400);
  });
});
