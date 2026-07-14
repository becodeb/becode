import { createHash, randomBytes } from 'node:crypto';
import type { User } from '@/generated/prisma/client';
import { prisma } from '@/lib/server/db';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Crea un token de recuperación y devuelve su valor en claro (para el link). */
export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  return token;
}

/** Valida un token vigente y no usado; devuelve el usuario o null. */
export async function consumeResetToken(token: string): Promise<User | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.user;
}
