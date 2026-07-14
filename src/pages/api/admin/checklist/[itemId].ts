import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json } from '@/lib/server/http';

export const prerender = false;

/** Alterna un ítem del checklist (hecho / pendiente). */
export const POST: APIRoute = async (context) => {
  const itemId = context.params.itemId ?? '';
  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) return errorJson('Ítem no encontrado.', 404);

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { doneAt: item.doneAt ? null : new Date() },
  });

  return json({ ok: true });
};
