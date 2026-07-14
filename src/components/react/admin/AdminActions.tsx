import { useState } from 'react';
import { PROJECT_STATUSES, STATUS_META } from '@/lib/project-status';
import { requestJson } from '@/lib/client/api';

const selectClass =
  'border-line bg-paper text-ink w-full rounded-[var(--radius-ui)] border ' +
  'px-3 py-2 text-sm focus:border-signal focus:outline-none';

export default function AdminActions({
  projectId,
  clientId,
  status,
  priority,
  quote,
  hasPrompts,
}: {
  projectId: string;
  clientId: string;
  status: string;
  priority: string;
  quote: number | null;
  hasPrompts: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    label: string,
    action: () => Promise<{ ok: boolean; error: string | null }>,
  ) {
    if (busy) return;
    setBusy(label);
    setError(null);
    const result = await action();
    if (!result.ok) {
      setBusy(null);
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  const approve = () =>
    run('approve', () =>
      requestJson(`/api/admin/projects/${projectId}/approve`),
    );

  const regenerate = () =>
    run('generate', () =>
      requestJson(`/api/admin/projects/${projectId}/generate`),
    );

  const changeStatus = (next: string) =>
    run('status', () =>
      requestJson(`/api/admin/projects/${projectId}/status`, {
        body: { status: next },
      }),
    );

  const changePriority = (next: string) =>
    run('priority', () =>
      requestJson(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        body: { priority: next },
      }),
    );

  const saveQuote = (value: string) => {
    const amount = value === '' ? null : Number(value);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      setError('Cotización inválida.');
      return;
    }
    void run('quote', () =>
      requestJson(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        body: { quote: amount },
      }),
    );
  };

  const deleteClient = () => {
    if (
      !window.confirm(
        '¿Eliminar este cliente y todos sus datos? No se puede deshacer.',
      )
    )
      return;
    void run('delete', () =>
      requestJson(`/api/admin/clients/${clientId}`, { method: 'DELETE' }).then(
        (result) => {
          if (result.ok) window.location.href = '/admin/clientes';
          return result;
        },
      ),
    );
  };

  return (
    <div className="space-y-4">
      {status === 'PENDIENTE' ? (
        <button
          type="button"
          onClick={() => void approve()}
          disabled={busy !== null}
          className="bg-signal text-surface hover:bg-signal-dark w-full rounded-[var(--radius-ui)] px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {busy === 'approve'
            ? 'Aprobando y generando documentación…'
            : 'Aprobar y generar documentación'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void regenerate()}
          disabled={busy !== null}
          className="border-line hover:border-ink w-full rounded-[var(--radius-ui)] border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {busy === 'generate'
            ? 'Regenerando con IA…'
            : hasPrompts
              ? 'Regenerar documentación IA'
              : 'Generar documentación IA'}
        </button>
      )}
      {(busy === 'approve' || busy === 'generate') && (
        <p className="text-muted text-xs">
          La IA está redactando los prompts del proyecto; puede tardar un
          minuto. No cierres esta pestaña.
        </p>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="admin-status"
          className="text-xs font-semibold tracking-wide uppercase"
        >
          Estado
        </label>
        <select
          id="admin-status"
          className={selectClass}
          value={status}
          disabled={busy !== null}
          onChange={(e) => void changeStatus(e.target.value)}
        >
          {PROJECT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_META[value].label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-priority"
          className="text-xs font-semibold tracking-wide uppercase"
        >
          Prioridad
        </label>
        <select
          id="admin-priority"
          className={selectClass}
          value={priority}
          disabled={busy !== null}
          onChange={(e) => void changePriority(e.target.value)}
        >
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-quote"
          className="text-xs font-semibold tracking-wide uppercase"
        >
          Cotización (USD)
        </label>
        <input
          id="admin-quote"
          type="number"
          min={0}
          step={50}
          defaultValue={quote ?? ''}
          disabled={busy !== null}
          className={selectClass}
          placeholder="Sin cotizar"
          onBlur={(e) => {
            const value = e.target.value;
            if (value !== String(quote ?? '')) saveQuote(value);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-signal text-xs">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={deleteClient}
        disabled={busy !== null}
        className="text-muted hover:text-signal w-full pt-2 text-xs underline underline-offset-2 transition-colors"
      >
        Eliminar cliente y sus datos
      </button>
    </div>
  );
}
