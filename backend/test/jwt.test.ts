import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../src/auth/jwt.js';

describe('JWT access tokens', () => {
  it('round-trips the payload it was signed with', () => {
    const token = signAccessToken({ userId: 'user-1', email: 'jerry@example.com', role: 'USER' });

    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe('user-1');
    expect(decoded.email).toBe('jerry@example.com');
    expect(decoded.role).toBe('USER');
  });

  it('throws for a token signed with a different secret', () => {
    const foreignToken = signAccessToken({ userId: 'x', email: 'x@example.com', role: 'USER' }, { secret: 'a-different-secret' });

    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });

  it('throws for a malformed token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow();
  });

  it('throws for an already-expired token', () => {
    const expired = signAccessToken({ userId: 'user-1', email: 'jerry@example.com', role: 'USER' }, { expiresIn: '-1s' });

    expect(() => verifyAccessToken(expired)).toThrow();
  });
});
