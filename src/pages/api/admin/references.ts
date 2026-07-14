import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { referenceSchema } from '@/lib/server/validation';

export const prerender = false;

/** Agrega una referencia visual a la biblioteca de conocimiento. */
export const POST: APIRoute = async (context) => {
  const parsed = referenceSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Datos inválidos.', 400);

  const reference = await prisma.referenceItem.create({
    data: { ...parsed.data, notes: parsed.data.notes ?? null },
  });
  return json({ ok: true, referenceId: reference.id }, 201);
};

export const DELETE: APIRoute = async (context) => {
  const body = (await readJson(context.request)) as { id?: string } | null;
  if (!body?.id) return errorJson('Falta el id.', 400);

  await prisma.referenceItem.delete({ where: { id: body.id } }).catch(() => {});
  return json({ ok: true });
};
