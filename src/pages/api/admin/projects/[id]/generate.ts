import type { APIRoute } from 'astro';
import { generateProjectPrompts } from '@/lib/server/ai/prompt-generator';
import { prisma } from '@/lib/server/db';
import { errorJson, json } from '@/lib/server/http';

export const prerender = false;

/** Regenera la documentación IA de un proyecto ya aprobado. */
export const POST: APIRoute = async (context) => {
  const projectId = context.params.id ?? '';
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true, brief: { select: { id: true } } },
  });

  if (!project) return errorJson('Proyecto no encontrado.', 404);
  if (!project.brief) return errorJson('El proyecto no tiene brief.', 409);

  const result = await generateProjectPrompts(projectId);
  return json({ ok: true, ...result });
};
