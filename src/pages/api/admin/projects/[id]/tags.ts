import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { tagAssignSchema } from '@/lib/server/validation';

export const prerender = false;

async function parseTagRequest(context: Parameters<APIRoute>[0]) {
  const projectId = context.params.id ?? '';
  const parsed = tagAssignSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return null;

  return { projectId, tagId: parsed.data.tagId };
}

export const POST: APIRoute = async (context) => {
  const request = await parseTagRequest(context);
  if (!request) return errorJson('Datos inválidos.', 400);

  await prisma.project.update({
    where: { id: request.projectId },
    data: { tags: { connect: { id: request.tagId } } },
  });
  return json({ ok: true });
};

export const DELETE: APIRoute = async (context) => {
  const request = await parseTagRequest(context);
  if (!request) return errorJson('Datos inválidos.', 400);

  await prisma.project.update({
    where: { id: request.projectId },
    data: { tags: { disconnect: { id: request.tagId } } },
  });
  return json({ ok: true });
};
