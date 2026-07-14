import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json } from '@/lib/server/http';
import { deleteStoredFile, storedFilePath } from '@/lib/server/uploads';

export const prerender = false;

async function findAuthorizedFile(fileId: string, user: App.Locals['user']) {
  if (!user) return null;
  const file = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    include: { project: { select: { clientId: true, status: true } } },
  });
  if (!file) return null;
  if (user.role !== 'OWNER' && file.project.clientId !== user.id) return null;
  return file;
}

export const GET: APIRoute = async (context) => {
  const file = await findAuthorizedFile(
    context.params.id ?? '',
    context.locals.user,
  );
  if (!file) return errorJson('Archivo no encontrado.', 404);

  const filePath = storedFilePath(file.storedName);
  try {
    await stat(filePath);
  } catch {
    return errorJson('El archivo ya no está disponible.', 410);
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Cache-Control': 'private, max-age=0',
    },
  });
};

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  const file = await findAuthorizedFile(context.params.id ?? '', user);
  if (!file) return errorJson('Archivo no encontrado.', 404);

  // El cliente solo puede borrar archivos mientras el proyecto está pendiente.
  if (user?.role !== 'OWNER' && file.project.status !== 'PENDIENTE') {
    return errorJson(
      'El proyecto ya está en marcha: pedinos el cambio por mensajes.',
      409,
    );
  }

  await prisma.fileUpload.delete({ where: { id: file.id } });
  await deleteStoredFile(file.storedName);
  return json({ ok: true });
};
