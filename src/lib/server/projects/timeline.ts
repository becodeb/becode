import type { TimelineEventType } from '@/generated/prisma/client';
import { prisma } from '@/lib/server/db';

export function recordEvent(
  projectId: string,
  type: TimelineEventType,
  title: string,
  description?: string,
) {
  return prisma.timelineEvent.create({
    data: { projectId, type, title, description: description ?? null },
  });
}
