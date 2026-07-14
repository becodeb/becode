import type { APIRoute } from 'astro';
import { consumeResetToken } from '@/lib/server/auth/reset-tokens';
import { hashPassword } from '@/lib/server/auth/password';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';
import { resetPasswordSchema } from '@/lib/server/validation';

export const prerender = false;

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});

export const POST: APIRoute = async (context) => {
  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson('Demasiados intentos. Probá de nuevo más tarde.', 429);
  }

  const parsed = resetPasswordSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Datos inválidos.', 400);

  const user = await consumeResetToken(parsed.data.token);
  if (!user) {
    return errorJson('El link expiró o ya fue usado. Pedí uno nuevo.', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    // Cierra todas las sesiones abiertas por seguridad.
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return json({ ok: true });
};
