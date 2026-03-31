/**
 * Database Client
 * Backend Lead Agent - Phase 1
 *
 * Prisma client singleton for database access throughout the application.
 * Prevents multiple instances in development with hot reloading.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Standard PostgreSQL connection (Prisma 5.x traditional configuration)
const prismaInstance = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
