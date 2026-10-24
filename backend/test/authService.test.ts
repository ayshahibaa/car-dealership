import { describe, expect, it } from 'vitest';
import { loginUser, registerUser } from '../src/auth/authService.js';
import { verifyAccessToken } from '../src/auth/jwt.js';
import { hashPassword } from '../src/auth/password.js';
import type { StoredUser, UserRepository } from '../src/auth/userRepository.js';

/**
 * authService depends only on the narrow UserRepository interface, so it's
 * fully testable with a plain in-memory fake — no database, no Prisma Client,
 * no network. This is where register/login's actual business rules (not
 * found, wrong password, duplicate email, token contents) get real coverage
 * even though this sandbox can't run the Prisma-backed version live.
 */
function createFakeRepo(seed: StoredUser[] = []): UserRepository {
  const users = [...seed];
  return {
    async findByEmail(email) {
      return users.find((u) => u.email === email) ?? null;
    },
    async create({ email, passwordHash }) {
      const user: StoredUser = { id: `user-${users.length + 1}`, email, passwordHash, role: 'USER' };
      users.push(user);
      return user;
    },
  };
}

describe('registerUser', () => {
  it('creates a new user with a hashed password and returns a token', async () => {
    const repo = createFakeRepo();

    const result = await registerUser(repo, { email: 'jerry@example.com', password: 'longenough' });

    expect(result.user.email).toBe('jerry@example.com');
    expect(result.user.role).toBe('USER');
    const decoded = verifyAccessToken(result.token);
    expect(decoded.email).toBe('jerry@example.com');
  });

  it('never returns the password hash to the caller', async () => {
    const repo = createFakeRepo();

    const result = await registerUser(repo, { email: 'jerry@example.com', password: 'longenough' });

    expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('rejects registering an email that already exists', async () => {
    const existingHash = await hashPassword('whatever');
    const repo = createFakeRepo([{ id: 'user-1', email: 'jerry@example.com', passwordHash: existingHash, role: 'USER' }]);

    await expect(registerUser(repo, { email: 'jerry@example.com', password: 'longenough' })).rejects.toMatchObject({ status: 409 });
  });
});

describe('loginUser', () => {
  it('logs in with the correct password and returns a token', async () => {
    const hash = await hashPassword('correct-password');
    const repo = createFakeRepo([{ id: 'user-1', email: 'jerry@example.com', passwordHash: hash, role: 'USER' }]);

    const result = await loginUser(repo, { email: 'jerry@example.com', password: 'correct-password' });

    expect(result.user.email).toBe('jerry@example.com');
    const decoded = verifyAccessToken(result.token);
    expect(decoded.userId).toBe('user-1');
  });

  it('rejects an unknown email with a 401 (not a 404 — never reveal which part was wrong)', async () => {
    const repo = createFakeRepo();

    await expect(loginUser(repo, { email: 'nobody@example.com', password: 'whatever' })).rejects.toMatchObject({ status: 401 });
  });

  it('rejects the wrong password with a 401', async () => {
    const hash = await hashPassword('correct-password');
    const repo = createFakeRepo([{ id: 'user-1', email: 'jerry@example.com', passwordHash: hash, role: 'USER' }]);

    await expect(loginUser(repo, { email: 'jerry@example.com', password: 'wrong-password' })).rejects.toMatchObject({ status: 401 });
  });

  it('includes the real role (ADMIN) in the issued token', async () => {
    const hash = await hashPassword('admin-password');
    const repo = createFakeRepo([{ id: 'admin-1', email: 'admin@example.com', passwordHash: hash, role: 'ADMIN' }]);

    const result = await loginUser(repo, { email: 'admin@example.com', password: 'admin-password' });

    const decoded = verifyAccessToken(result.token);
    expect(decoded.role).toBe('ADMIN');
  });
});
