import { defineConfig } from 'prisma/config';

// La CLI de Prisma 7 no carga .env automáticamente.
try {
  process.loadEnvFile('.env');
} catch {
  // Sin .env local: las variables vienen del entorno (CI / producción).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
