import { PrismaClient } from '@prisma/client';

/**
 * One PrismaClient for the whole process, constructed lazily on first real
 * use rather than at import time. Two reasons that matters:
 *  - Modules that merely *wire up* a repository (app.ts, for route mounting)
 *    must not pay the cost — or the risk — of constructing a database client
 *    they may never query in a given request (health check, 404).
 *  - In a sandbox/CI environment without a generated client yet, importing
 *    this file for type-checking or testing unrelated routes must not throw.
 */
let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

export default prisma;
