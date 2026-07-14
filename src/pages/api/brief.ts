import type { APIRoute } from 'astro';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { recordEvent } from '@/lib/server/projects/timeline';
import { briefSchema } from '@/lib/server/validation';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return errorJson('No autenticado.', 401);
  if (!user.companyId)
    return errorJson('La cuenta no tiene empresa asociada.', 400);

  const parsed = briefSchema.safeParse(await readJson(context.request));
  if (!parsed.success)
    return errorJson('Revisá las respuestas del formulario.', 400);
  const data = parsed.data;

  const existing = await prisma.project.findFirst({
    where: { clientId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { brief: true },
  });

  const briefData = {
    siteType: data.siteType,
    industry: data.industry,
    aesthetics: data.aesthetics,
    colors: data.colors,
    feelings: data.feelings,
    sections: data.sections,
    features: data.features,
    hasLogo: data.hasLogo,
    hasBrand: data.hasBrand,
    hasDomain: data.hasDomain,
    budgetRange: data.budgetRange,
    urgency: data.urgency,
    referenceUrls: data.referenceUrls,
    comment: data.comment ?? null,
  };

  // El cliente puede editar sus respuestas mientras el proyecto no fue aprobado.
  if (existing?.brief) {
    if (existing.status !== 'PENDIENTE') {
      return errorJson(
        'El proyecto ya fue aprobado: escribinos por mensajes para pedir cambios.',
        409,
      );
    }
    await prisma.brief.update({
      where: { id: existing.brief.id },
      data: briefData,
    });
    await recordEvent(
      existing.id,
      'BRIEF_ACTUALIZADO',
      'Brief actualizado',
      'El cliente ajustó sus respuestas del formulario.',
    );
    return json({ ok: true, projectId: existing.id });
  }

  const project = await prisma.project.create({
    data: {
      title: `${data.siteType} · ${user.firstName} ${user.lastName}`,
      clientId: user.id,
      companyId: user.companyId,
      brief: { create: briefData },
    },
  });

  // El registro del usuario también queda en la historia del proyecto.
  await prisma.timelineEvent.create({
    data: {
      projectId: project.id,
      type: 'REGISTRO',
      title: 'Cuenta creada',
      createdAt: user.createdAt,
    },
  });
  await recordEvent(
    project.id,
    'BRIEF_ENVIADO',
    'Brief enviado',
    'El cliente completó el formulario inteligente.',
  );

  return json({ ok: true, projectId: project.id }, 201);
};
