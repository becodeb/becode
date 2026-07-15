import type { APIRoute } from 'astro';
import { generateProjectPrompts } from '@/lib/server/ai/prompt-generator';
import { prisma } from '@/lib/server/db';
import { errorJson, json } from '@/lib/server/http';
import { recordEvent } from '@/lib/server/projects/timeline';

export const prerender = false;

const DEFAULT_CHECKLIST = [
  'Definimos el alcance y los próximos pasos',
  'Diseñamos la experiencia y el estilo visual',
  'Construimos las pantallas y funciones',
  'Cargamos y revisamos el contenido',
  'Probamos todo en celular y computadora',
  'Publicamos el proyecto',
  'Entregamos y acompañamos la salida',
];

export const POST: APIRoute = async (context) => {
  const projectId = context.params.id ?? '';
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brief: true },
  });

  if (!project) return errorJson('Proyecto no encontrado.', 404);
  if (!project.brief)
    return errorJson('El proyecto todavía no tiene brief.', 409);
  if (project.status !== 'PENDIENTE') {
    return errorJson('El proyecto ya fue aprobado.', 409);
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { status: 'APROBADO', approvedAt: new Date() },
    }),
    prisma.checklistItem.createMany({
      data: DEFAULT_CHECKLIST.map((label, order) => ({
        projectId,
        label,
        order,
      })),
    }),
  ]);
  await recordEvent(
    projectId,
    'CLIENTE_APROBADO',
    'Cliente aprobado',
    'El equipo aprobó el proyecto y arranca la documentación.',
  );

  // Generación de documentación con el servicio de IA existente. Tolerante a
  // fallas: la aprobación queda firme y lo que falle se puede regenerar.
  const result = await generateProjectPrompts(projectId);

  return json({ ok: true, ...result });
};
