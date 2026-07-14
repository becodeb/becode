import { useState } from 'react';
import { requestJson } from '@/lib/client/api';

interface PromptItem {
  id: string;
  kind: string;
  content: string;
  model: string;
  createdAt: string;
}

const KIND_LABELS: Record<string, string> = {
  ANALISIS: 'Análisis',
  COMPLETO: 'Prompt completo',
  DISENO: 'Diseño',
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  PRISMA: 'Prisma',
  SEO: 'SEO',
  DEPLOY: 'Deploy',
  TESTING: 'Testing',
};

const KIND_ORDER = Object.keys(KIND_LABELS);

export default function PromptsViewer({ prompts }: { prompts: PromptItem[] }) {
  const sorted = [...prompts].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
  const [activeId, setActiveId] = useState(sorted[0]?.id ?? '');
  const [feedback, setFeedback] = useState<string | null>(null);

  const active = sorted.find((prompt) => prompt.id === activeId) ?? sorted[0];

  if (!active) {
    return (
      <p className="text-muted text-sm">
        Todavía no hay documentación generada. Aprobá el proyecto o usá “Generar
        documentación IA”.
      </p>
    );
  }

  async function copyActive() {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.content);
      setFeedback('Copiado al portapapeles.');
    } catch {
      setFeedback('No se pudo copiar.');
    }
    window.setTimeout(() => setFeedback(null), 2500);
  }

  async function saveAsTemplate() {
    if (!active) return;
    const result = await requestJson('/api/admin/templates', {
      body: {
        title: `${KIND_LABELS[active.kind] ?? active.kind} · ${new Date().toLocaleDateString('es-AR')}`,
        category: (KIND_LABELS[active.kind] ?? active.kind).toLowerCase(),
        content: active.content,
      },
    });
    setFeedback(
      result.ok
        ? 'Guardado en la biblioteca.'
        : (result.error ?? 'No se pudo guardar.'),
    );
    window.setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Documentos generados"
      >
        {sorted.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            role="tab"
            aria-selected={prompt.id === active.id}
            onClick={() => setActiveId(prompt.id)}
            className="chip"
            data-selected={prompt.id === active.id}
          >
            {KIND_LABELS[prompt.kind] ?? prompt.kind}
          </button>
        ))}
      </div>

      <div className="border-line bg-paper rounded-[var(--radius-ui)] border">
        <div className="border-line flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <p className="text-dim font-mono text-[0.65rem]">
            {active.model} · {active.createdAt}
          </p>
          <div className="flex items-center gap-2">
            {feedback && <span className="text-muted text-xs">{feedback}</span>}
            <button
              type="button"
              onClick={() => void copyActive()}
              className="border-line hover:border-ink rounded-[var(--radius-ui)] border px-2.5 py-1 text-xs font-semibold transition-colors"
            >
              Copiar
            </button>
            <button
              type="button"
              onClick={() => void saveAsTemplate()}
              className="border-line hover:border-ink rounded-[var(--radius-ui)] border px-2.5 py-1 text-xs font-semibold transition-colors"
            >
              Guardar como plantilla
            </button>
          </div>
        </div>
        <div className="prose-ai max-h-[32rem] overflow-y-auto px-5 py-4">
          <pre className="font-body text-sm leading-relaxed whitespace-pre-wrap">
            {active.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
