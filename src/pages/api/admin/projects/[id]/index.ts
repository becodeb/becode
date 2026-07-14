import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { projectUpdateSchema } from '@/lib/server/validation';

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
  const projectId = context.params.id ?? '';
  const parsed = projectUpdateSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Datos inválidos.', 400);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return errorJson('Proyecto no encontrado.', 404);

  const { title, priority, quote } = parsed.data;
  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(title !== undefined && { title }),
      ...(priority !== undefined && { priority }),
      ...(quote !== undefined && { quote }),
    },
  });

  return json({ ok: true });
};
