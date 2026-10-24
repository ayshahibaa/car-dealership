import { prisma } from '../db/prismaClient.js';
import type { UserRepository } from './userRepository.js';

/**
 * The real UserRepository, backed by Postgres via Prisma. Everything that
 * matters about *how* register/login behave lives in authService.ts and is
 * tested against a fake repository — this file is intentionally a thin,
 * low-risk pass-through.
 */
export const prismaUserRepository: UserRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  async create({ email, passwordHash }) {
    return prisma.user.create({ data: { email, passwordHash } });
  },
};
