import type { APIRoute } from 'astro';
import { statusLabel } from '@/lib/project-status';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { recordEvent } from '@/lib/server/projects/timeline';
import { statusSchema } from '@/lib/server/validation';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const projectId = context.params.id ?? '';
  const parsed = statusSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Estado inválido.', 400);
  const status = parsed.data.status;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return errorJson('Proyecto no encontrado.', 404);
  if (project.status === status) return json({ ok: true });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status,
      ...(status === 'FINALIZADO' && !project.deliveredAt
        ? { deliveredAt: new Date() }
        : {}),
    },
  });

  const eventType =
    status === 'DEPLOY'
      ? 'DEPLOY'
      : status === 'FINALIZADO'
        ? 'ENTREGA'
        : 'CAMBIO_ESTADO';
  await recordEvent(
    projectId,
    eventType,
    `Estado: ${statusLabel(status)}`,
    `El proyecto pasó de ${statusLabel(project.status)} a ${statusLabel(status)}.`,
  );

  return json({ ok: true });
};
