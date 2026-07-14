import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { templateSchema } from '@/lib/server/validation';

export const prerender = false;

/** Guarda un prompt exitoso como plantilla reutilizable. */
export const POST: APIRoute = async (context) => {
  const parsed = templateSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Datos inválidos.', 400);

  const template = await prisma.promptTemplate.create({ data: parsed.data });
  return json({ ok: true, templateId: template.id }, 201);
};

export const DELETE: APIRoute = async (context) => {
  const body = (await readJson(context.request)) as { id?: string } | null;
  if (!body?.id) return errorJson('Falta el id.', 400);

  await prisma.promptTemplate
    .delete({ where: { id: body.id } })
    .catch(() => {});
  return json({ ok: true });
};
