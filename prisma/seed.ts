// Seed inicial: usuario OWNER y etiquetas base del CRM.
// Ejecutar con `npm run db:seed` (usa OWNER_EMAIL / OWNER_PASSWORD del entorno).

import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_TAGS = [
  { name: 'VIP', color: '#d3311d' },
  { name: 'Urgente', color: '#ea580c' },
  { name: 'Lead', color: '#2563eb' },
  { name: 'Startup', color: '#7c3aed' },
  { name: 'Empresa', color: '#0f766e' },
  { name: 'Cliente recurrente', color: '#16a34a' },
  { name: 'Mantenimiento', color: '#64748b' },
];

async function main() {
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      create: tag,
      update: {},
    });
  }
  console.log(`Etiquetas base: ${DEFAULT_TAGS.length} listas.`);

  const email = (process.env.OWNER_EMAIL ?? 'hola@becode.com.ar').toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`El owner ${email} ya existe; no se modifica.`);
    return;
  }

  const password =
    process.env.OWNER_PASSWORD ?? randomBytes(9).toString('base64url');
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      firstName: 'Equipo',
      lastName: 'becode',
      role: 'OWNER',
    },
  });

  console.log(`Owner creado: ${email}`);
  if (!process.env.OWNER_PASSWORD) {
    console.log(`Contraseña generada (cambiala en producción): ${password}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
