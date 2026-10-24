import { ApiError } from '../middleware/errorHandler.js';
import { signAccessToken } from './jwt.js';
import { hashPassword, verifyPassword } from './password.js';
import type { LoginInput, RegisterInput } from './authSchemas.js';
import type { UserRepository } from './userRepository.js';

export interface PublicUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

function toPublicUser(user: { id: string; email: string; role: 'USER' | 'ADMIN' }): PublicUser {
  return { id: user.id, email: user.email, role: user.role };
}

export async function registerUser(repo: UserRepository, input: RegisterInput): Promise<AuthResult> {
  const existing = await repo.findByEmail(input.email);
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const created = await repo.create({ email: input.email, passwordHash });

  const user = toPublicUser(created);
  const token = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  return { user, token };
}

export async function loginUser(repo: UserRepository, input: LoginInput): Promise<AuthResult> {
  const found = await repo.findByEmail(input.email);
  // Same error for "no such account" and "wrong password" — never let a caller
  // learn which part was incorrect.
  if (!found || !(await verifyPassword(input.password, found.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = toPublicUser(found);
  const token = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  return { user, token };
}
