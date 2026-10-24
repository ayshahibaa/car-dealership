import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/auth/authSchemas.js';

describe('registerSchema', () => {
  it('accepts a valid email and a password of at least 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'jerry@example.com', password: 'longenough' });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email', password: 'longenough' });

    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'jerry@example.com', password: 'short' });

    expect(result.success).toBe(false);
  });

  it('rejects a missing password', () => {
    const result = registerSchema.safeParse({ email: 'jerry@example.com' });

    expect(result.success).toBe(false);
  });

  it('lowercases the email so "Jerry@Example.com" and "jerry@example.com" are the same account', () => {
    const result = registerSchema.safeParse({ email: 'Jerry@Example.com', password: 'longenough' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('jerry@example.com');
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty email and password (no length rule on login)', () => {
    const result = loginSchema.safeParse({ email: 'jerry@example.com', password: 'x' });

    expect(result.success).toBe(true);
  });

  it('rejects a missing email', () => {
    const result = loginSchema.safeParse({ password: 'x' });

    expect(result.success).toBe(false);
  });
});
