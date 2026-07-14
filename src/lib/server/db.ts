import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from 'astro:env/server';
import { PrismaClient } from '@/generated/prisma/client';

// Singleton: en dev el HMR de Vite recrearía el cliente en cada cambio y
// agotaría el pool de conexiones de Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (import.meta.env.DEV) globalForPrisma.prisma = prisma;
