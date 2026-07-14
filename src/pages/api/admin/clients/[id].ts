import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json } from '@/lib/server/http';
import { deleteStoredFile } from '@/lib/server/uploads';

export const prerender = false;

/** Elimina un cliente con sus proyectos, archivos y datos asociados. */
export const DELETE: APIRoute = async (context) => {
  const clientId = context.params.id ?? '';
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    include: { projects: { include: { files: true } } },
  });

  if (!client || client.role !== 'CLIENT') {
    return errorJson('Cliente no encontrado.', 404);
  }

  // Primero el disco, después la base (los registros caen en cascada).
  for (const project of client.projects) {
    for (const file of project.files) {
      await deleteStoredFile(file.storedName);
    }
  }

  await prisma.$transaction([
    prisma.project.deleteMany({ where: { clientId } }),
    prisma.user.delete({ where: { id: clientId } }),
  ]);

  return json({ ok: true });
};
