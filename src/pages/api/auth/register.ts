import type { APIRoute } from 'astro';
import { createSession } from '@/lib/server/auth/session';
import { hashPassword } from '@/lib/server/auth/password';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';
import { registerSchema } from '@/lib/server/validation';

export const prerender = false;

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});

export const POST: APIRoute = async (context) => {
  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson('Demasiados intentos. Probá de nuevo más tarde.', 429);
  }

  const parsed = registerSchema.safeParse(await readJson(context.request));
  if (!parsed.success) {
    return errorJson('Revisá los datos ingresados.', 400);
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return errorJson('Ya existe una cuenta con ese email.', 409);
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'CLIENT',
      company: { create: { name: data.company } },
    },
  });

  await createSession(user.id, context.cookies);
  return json({ ok: true }, 201);
};
