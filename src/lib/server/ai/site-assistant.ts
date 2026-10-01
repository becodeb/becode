// Construcción del prompt del asistente público del sitio (chatbot flotante).

import { getCollection } from 'astro:content';
import companyContext from '@/data/company-context.md?raw';

const ESTADO_LABEL: Record<string, string> = {
  'en-uso': 'En uso',
  piloto: 'Piloto',
  experimento: 'Experimento',
};

export async function buildSiteAssistantPrompt(): Promise<string> {
  const projects = (await getCollection('proyectos')).sort(
    (a, b) => a.data.fecha.getTime() - b.data.fecha.getTime(),
  );

  const projectLines = projects.map((project) => {
    const { nombre, resumen, tipo, estado, url } = project.data;
    const estadoLabel = ESTADO_LABEL[estado] ?? estado;
    return `- ${nombre} (${tipo}, ${estadoLabel}) — ${resumen} · ${url}`;
  });

  return [
    companyContext.trim(),
    '## Proyectos y productos de becode',
    projectLines.join('\n'),
  ].join('\n\n');
}
