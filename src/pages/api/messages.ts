import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';
import { messageSchema } from '@/lib/server/validation';

export const prerender = false;

const limiter = createRateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 30 });

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return errorJson('No autenticado.', 401);

  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson('Demasiados mensajes seguidos. Esperá un momento.', 429);
  }

  const parsed = messageSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Mensaje inválido.', 400);

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, clientId: true },
  });

  if (!project || (user.role !== 'OWNER' && project.clientId !== user.id)) {
    return errorJson('Proyecto no encontrado.', 404);
  }

  const message = await prisma.message.create({
    data: {
      projectId: project.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  return json({ ok: true, messageId: message.id }, 201);
};
