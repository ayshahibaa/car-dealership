import { PrismaClient } from '@prisma/client';

/**
 * One PrismaClient for the whole process. Express route modules and the
 * seed script import this instead of constructing their own — multiple
 * clients each open their own connection pool, which exhausts Postgres
 * connections fast on a serverless platform like Vercel.
 */
export const prisma = new PrismaClient();
