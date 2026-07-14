import type { APIRoute } from 'astro';
import { createSession } from '@/lib/server/auth/session';
import { verifyPassword } from '@/lib/server/auth/password';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';
import { loginSchema } from '@/lib/server/validation';

export const prerender = false;

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
});

export const POST: APIRoute = async (context) => {
  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson('Demasiados intentos. Probá de nuevo más tarde.', 429);
  }

  const parsed = loginSchema.safeParse(await readJson(context.request));
  if (!parsed.success) {
    return errorJson('Email o contraseña inválidos.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Se verifica siempre contra un hash para no filtrar si el email existe
  // por diferencia de tiempos.
  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ??
      '$2a$12$C6UzMDM.H6dfI/f/IKcEeO3xkgmVn8lJqbnKN1XoYxkgqUJyyRy0e',
  );

  if (!user || !valid) {
    return errorJson('Email o contraseña incorrectos.', 401);
  }

  await createSession(user.id, context.cookies);
  return json({ ok: true, role: user.role });
};
