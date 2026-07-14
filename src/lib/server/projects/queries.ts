import type { User } from '@/generated/prisma/client';
import { prisma } from '@/lib/server/db';

/** Proyecto activo del cliente (el más reciente), con todo su contexto. */
export function getClientProject(user: User) {
  return prisma.project.findFirst({
    where: { clientId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      brief: true,
      company: true,
      files: { orderBy: { createdAt: 'desc' } },
      timelineEvents: { orderBy: { createdAt: 'desc' } },
      checklistItems: { orderBy: { order: 'asc' } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { firstName: true, role: true } } },
      },
    },
  });
}
