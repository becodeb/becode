import { useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/client/api';
import { inputClass } from '@/components/react/ui/Field';

export default function NoteComposer({ projectId }: { projectId: string }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = content.trim();
    if (!text || busy) return;

    setBusy(true);
    setError(null);
    const result = await requestJson(`/api/admin/projects/${projectId}/notes`, {
      body: { content: text },
    });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Nota interna (solo la ve el equipo)…"
        aria-label="Nueva nota interna"
        className={`${inputClass} resize-y`}
      />
      {error && (
        <p role="alert" className="text-signal text-xs">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || content.trim().length === 0}
        className="border-line hover:border-ink w-full rounded-[var(--radius-ui)] border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {busy ? 'Guardando…' : 'Agregar nota'}
      </button>
    </form>
  );
}
