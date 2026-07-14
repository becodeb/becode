import type { APIRoute } from 'astro';
import { createResetToken } from '@/lib/server/auth/reset-tokens';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';
import { recoverSchema } from '@/lib/server/validation';

export const prerender = false;

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });

export const POST: APIRoute = async (context) => {
  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson('Demasiados intentos. Probá de nuevo más tarde.', 429);
  }

  const parsed = recoverSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Email inválido.', 400);

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (user) {
    const token = await createResetToken(user.id);
    const link = new URL(`/recuperar?token=${token}`, context.url.origin).href;
    // TODO: enviar por email cuando haya SMTP configurado. Por ahora el link
    // queda en el log del servidor para gestionarlo manualmente.
    console.log(`[recuperación] Link para ${user.email}: ${link}`);
  }

  // Respuesta idéntica exista o no la cuenta, para no filtrar emails.
  return json({ ok: true });
};
