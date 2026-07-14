import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json } from '@/lib/server/http';
import { recordEvent } from '@/lib/server/projects/timeline';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';
import {
  MAX_FILE_SIZE,
  isAllowedMimeType,
  storeFile,
} from '@/lib/server/uploads';

export const prerender = false;

const limiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 40,
});

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return errorJson('No autenticado.', 401);

  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson(
      'Demasiadas subidas. Probá de nuevo en unos minutos.',
      429,
    );
  }

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return errorJson('Formato de subida inválido.', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return errorJson('No se recibió ningún archivo.', 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return errorJson('El archivo supera el máximo de 25 MB.', 413);
  }
  if (!isAllowedMimeType(file.type)) {
    return errorJson('Tipo de archivo no permitido.', 415);
  }

  const requestedProjectId = form.get('projectId');
  const project =
    user.role === 'OWNER' && typeof requestedProjectId === 'string'
      ? await prisma.project.findUnique({ where: { id: requestedProjectId } })
      : await prisma.project.findFirst({
          where: { clientId: user.id },
          orderBy: { createdAt: 'desc' },
        });

  if (!project)
    return errorJson('No hay un proyecto para asociar el archivo.', 404);

  const storedName = await storeFile(file);
  const record = await prisma.fileUpload.create({
    data: {
      projectId: project.id,
      uploaderId: user.id,
      filename: file.name.slice(0, 255),
      storedName,
      mimeType: file.type,
      size: file.size,
    },
  });

  await recordEvent(
    project.id,
    'ARCHIVO_SUBIDO',
    'Archivo subido',
    file.name.slice(0, 255),
  );

  return json({ ok: true, fileId: record.id }, 201);
};
