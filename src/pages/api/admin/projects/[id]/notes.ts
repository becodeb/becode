import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { noteSchema } from '@/lib/server/validation';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const projectId = context.params.id ?? '';
  const user = context.locals.user;
  if (!user) return errorJson('No autenticado.', 401);

  const parsed = noteSchema.safeParse(await readJson(context.request));
  if (!parsed.success) return errorJson('Nota inválida.', 400);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return errorJson('Proyecto no encontrado.', 404);

  const note = await prisma.internalNote.create({
    data: { projectId, authorId: user.id, content: parsed.data.content },
  });

  return json({ ok: true, noteId: note.id }, 201);
};
