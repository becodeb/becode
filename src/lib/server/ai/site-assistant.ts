// Construcción del prompt del asistente público del sitio (chatbot flotante).

import { getCollection } from 'astro:content';
import companyContext from '@/data/company-context.md?raw';

export async function buildSiteAssistantPrompt(): Promise<string> {
  const projects = (await getCollection('projects')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const projectLines = projects.map((project) => {
    const { name, description, stack, category, status, url } = project.data;
    return `- ${name} (${category}, ${status}) — ${description} · Stack: ${stack.join(', ')} · ${url}`;
  });

  return [
    companyContext.trim(),
    '## Proyectos y productos de becode',
    projectLines.join('\n'),
  ].join('\n\n');
}
