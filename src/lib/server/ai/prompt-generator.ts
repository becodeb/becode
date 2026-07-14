// Generación automática de documentación técnica a partir del brief.
// Consume el servicio de IA único (src/lib/server/ai/client.ts): la misma
// integración, API key y modelo que el chatbot del sitio.

import type {
  Brief,
  Company,
  FileUpload,
  PromptKind,
  Project,
  User,
} from '@/generated/prisma/client';
import { urgencyLabel } from '@/lib/brief-options';
import {
  aiModelName,
  requestChatCompletion,
  type AiMessage,
} from '@/lib/server/ai/client';
import { prisma } from '@/lib/server/db';

type ProjectWithContext = Project & {
  brief: Brief;
  company: Company;
  client: User;
  files: FileUpload[];
};

interface PromptSpec {
  kind: PromptKind;
  instruction: string;
  maxTokens: number;
}

const PROMPT_SPECS: PromptSpec[] = [
  {
    kind: 'DISENO',
    maxTokens: 1400,
    instruction:
      'Redactá un prompt de DISEÑO UI/UX listo para dárselo a un diseñador o a una IA generativa: dirección visual, paleta concreta (con códigos hex sugeridos), tipografías, espaciado, componentes clave y referencias de estilo, alineado a la estética y sensaciones elegidas por el cliente.',
  },
  {
    kind: 'FRONTEND',
    maxTokens: 1400,
    instruction:
      'Redactá un prompt de FRONTEND: stack recomendado, estructura de componentes, páginas y secciones a construir, estados de carga y vacío, accesibilidad y responsive. Debe poder usarse directamente para iniciar el desarrollo.',
  },
  {
    kind: 'BACKEND',
    maxTokens: 1400,
    instruction:
      'Redactá un prompt de BACKEND: endpoints/API necesarios, autenticación, reglas de negocio, validaciones y servicios externos que requieren las funcionalidades elegidas.',
  },
  {
    kind: 'PRISMA',
    maxTokens: 1400,
    instruction:
      'Redactá un prompt para modelar la BASE DE DATOS con Prisma + PostgreSQL: entidades, campos, relaciones, índices y restricciones que exige el proyecto. Incluí un esbozo de schema.prisma.',
  },
  {
    kind: 'SEO',
    maxTokens: 1000,
    instruction:
      'Redactá un prompt de SEO: keywords según el rubro, estructura de headings, metadatos, datos estructurados, rendimiento y contenido recomendado.',
  },
  {
    kind: 'DEPLOY',
    maxTokens: 1000,
    instruction:
      'Redactá un prompt de DEPLOY: infraestructura recomendada, variables de entorno, CI/CD, dominio, SSL y monitoreo para este proyecto.',
  },
  {
    kind: 'TESTING',
    maxTokens: 1000,
    instruction:
      'Redactá un prompt de TESTING: estrategia de tests (unitarios, integración, e2e), casos críticos según las funcionalidades elegidas y herramientas recomendadas.',
  },
  {
    kind: 'COMPLETO',
    maxTokens: 3500,
    instruction:
      'Redactá el PROMPT MAESTRO COMPLETO del proyecto, de entre 1000 y 2000 palabras, que integre diseño, frontend, backend, base de datos, SEO, deploy y testing en un único documento accionable para construir el sitio de punta a punta.',
  },
  {
    kind: 'ANALISIS',
    maxTokens: 2200,
    instruction: [
      'Elaborá el ANÁLISIS EJECUTIVO del proyecto con estas secciones en markdown:',
      '## Resumen ejecutivo',
      '## Riesgos detectados',
      '## Complejidad (baja/media/alta, justificada)',
      '## Estimación de horas (desglosada por área)',
      '## Tecnologías recomendadas',
      '## Cotización sugerida (rango en USD, coherente con el presupuesto del cliente)',
      '## Checklist de trabajo',
      '## Roadmap por fases',
      '## MVP recomendado',
      '## Dependencias y bloqueos',
      '## Estructura de carpetas sugerida',
      '## Arquitectura recomendada',
    ].join('\n'),
  },
];

const SYSTEM_PROMPT = [
  'Sos el arquitecto técnico senior de becode, una agencia argentina de desarrollo web.',
  'Recibís el brief de un cliente y generás documentación técnica accionable y específica (nunca genérica).',
  'Respondé siempre en español rioplatense, en markdown, sin preámbulos ni despedidas.',
].join(' ');

function describeBrief(project: ProjectWithContext): string {
  const { brief, company, client, files } = project;
  const list = (value: unknown): string =>
    Array.isArray(value) && value.length > 0
      ? value.join(', ')
      : 'Sin especificar';

  return [
    `# Brief del proyecto "${project.title}"`,
    `- Cliente: ${client.firstName} ${client.lastName} (${company.name})`,
    `- Tipo de sitio: ${brief.siteType}`,
    `- Rubro: ${brief.industry}`,
    `- Estética deseada: ${list(brief.aesthetics)}`,
    `- Colores preferidos: ${list(brief.colors)}`,
    `- Sensaciones a transmitir: ${list(brief.feelings)}`,
    `- Secciones requeridas: ${list(brief.sections)}`,
    `- Funcionalidades requeridas: ${list(brief.features)}`,
    `- Tiene logo: ${brief.hasLogo ? 'sí' : 'no'} · Identidad visual: ${brief.hasBrand ? 'sí' : 'no'} · Dominio: ${brief.hasDomain ? 'sí' : 'no'}`,
    `- Presupuesto: ${brief.budgetRange} USD`,
    `- Urgencia: ${urgencyLabel(brief.urgency)}`,
    `- Sitios de referencia: ${list(brief.referenceUrls)}`,
    `- Archivos adjuntos: ${files.length > 0 ? files.map((f) => f.filename).join(', ') : 'ninguno'}`,
    brief.comment ? `- Comentario del cliente: ${brief.comment}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export interface GenerationResult {
  generated: PromptKind[];
  failed: PromptKind[];
}

/**
 * Genera (o regenera) todos los prompts especializados de un proyecto.
 * Tolerante a fallas: guarda los que salieron bien y registra los errores en
 * el historial de IA para poder reintentar.
 */
export async function generateProjectPrompts(
  projectId: string,
): Promise<GenerationResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brief: true, company: true, client: true, files: true },
  });

  if (!project || !project.brief) {
    throw new Error('El proyecto no tiene brief para analizar.');
  }

  const briefDescription = describeBrief(project as ProjectWithContext);
  const model = aiModelName();
  const generated: PromptKind[] = [];
  const failed: PromptKind[] = [];

  // Secuencial a propósito: evita picos de rate limit contra la API.
  for (const spec of PROMPT_SPECS) {
    const messages: AiMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${briefDescription}\n\n---\n\n${spec.instruction}`,
      },
    ];

    try {
      const content = await requestChatCompletion({
        messages,
        temperature: 0.5,
        maxTokens: spec.maxTokens,
      });

      await prisma.$transaction([
        // Regenerar reemplaza la versión anterior del mismo tipo.
        prisma.generatedPrompt.deleteMany({
          where: { projectId, kind: spec.kind },
        }),
        prisma.generatedPrompt.create({
          data: { projectId, kind: spec.kind, content, model },
        }),
        prisma.aiInteraction.create({
          data: {
            projectId,
            feature: 'prompt-generation',
            model,
            success: true,
          },
        }),
      ]);
      generated.push(spec.kind);
    } catch (error) {
      failed.push(spec.kind);
      await prisma.aiInteraction.create({
        data: {
          projectId,
          feature: 'prompt-generation',
          model,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
    }
  }

  if (generated.length > 0) {
    await prisma.timelineEvent.create({
      data: {
        projectId,
        type: 'PROMPTS_GENERADOS',
        title: 'Documentación generada con IA',
        description: `Se generaron ${generated.length} documentos técnicos.`,
      },
    });
  }

  return { generated, failed };
}
