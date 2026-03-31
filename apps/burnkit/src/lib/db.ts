import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      statement_timeout: 15000,
    });

  pool.on('error', (err) => {
    console.warn('pg pool: idle client error (will reconnect):', err.message);
  });

  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({
    adapter,
    log: ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  return prisma;
}

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Lazy proxy: defers client creation until first property access at runtime,
// so importing this module during build doesn't require DATABASE_URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrismaClient() as any)[prop];
  },
});

export default prisma;

