import { prisma } from '../db/prismaClient.js';
import type { UserRepository } from './userRepository.js';

export const prismaUserRepository: UserRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  async create({ email, passwordHash }) {
    return prisma.user.create({ data: { email, passwordHash } });
  },
};
