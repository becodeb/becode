// Metadatos de presentación de los estados del proyecto.
// Seguro para importar tanto en el servidor como en islands.

export const PROJECT_STATUSES = [
  'PENDIENTE',
  'APROBADO',
  'DISENO',
  'DESARROLLO',
  'TESTING',
  'DEPLOY',
  'FINALIZADO',
] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export const STATUS_META: Record<
  ProjectStatusValue,
  { label: string; dot: string; badge: string }
> = {
  PENDIENTE: {
    label: 'Pendiente',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  },
  APROBADO: {
    label: 'Aprobado',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  },
  DISENO: {
    label: 'Diseño',
    dot: 'bg-violet-500',
    badge: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  },
  DESARROLLO: {
    label: 'Desarrollo',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  },
  TESTING: {
    label: 'Testing',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30',
  },
  DEPLOY: {
    label: 'Deploy',
    dot: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  },
  FINALIZADO: {
    label: 'Finalizado',
    dot: 'bg-ink',
    badge: 'bg-ink/10 text-ink border-ink/30',
  },
};

export const PRIORITY_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function statusLabel(status: string): string {
  return STATUS_META[status as ProjectStatusValue]?.label ?? status;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
