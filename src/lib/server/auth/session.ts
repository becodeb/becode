import { createHash, randomBytes } from 'node:crypto';
import type { AstroCookies } from 'astro';
import type { User } from '@/generated/prisma/client';
import { prisma } from '@/lib/server/db';

export const SESSION_COOKIE = 'becode_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const RENEW_THRESHOLD_MS = SESSION_TTL_MS / 2;

// En la cookie viaja un token aleatorio; en la DB solo se guarda su hash,
// así un dump de la base no permite secuestrar sesiones.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: string,
  cookies: AstroCookies,
): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    expires: expiresAt,
  });
}

export async function getSessionUser(
  cookies: AstroCookies,
): Promise<User | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Renovación deslizante: extiende la sesión cuando pasó la mitad del TTL.
  if (session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt },
    });
    cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      path: '/',
      expires: expiresAt,
    });
  }

  return session.user;
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .delete({ where: { id: hashToken(token) } })
      .catch(() => {});
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
