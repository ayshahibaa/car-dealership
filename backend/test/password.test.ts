import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth/password.js';

/**
 * Pure bcrypt wrapper — no DB, no network, so this runs anywhere (including
 * this sandbox) and is the foundation register/login build on next.
 */
describe('password hashing', () => {
  it('produces a hash that is not the plain password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies the correct password against its own hash', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against the hash', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const hashA = await hashPassword('same password');
    const hashB = await hashPassword('same password');

    expect(hashA).not.toBe(hashB);
  });
});
