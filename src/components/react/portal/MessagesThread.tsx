import { useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/client/api';
import { inputClass } from '@/components/react/ui/Field';

interface ThreadMessage {
  id: string;
  content: string;
  mine: boolean;
  senderName: string;
  createdAt: string;
}

export default function MessagesThread({
  projectId,
  messages,
}: {
  projectId: string;
  messages: ThreadMessage[];
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    const result = await requestJson('/api/messages', {
      body: { projectId, content },
    });
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <div
        className="max-h-80 space-y-3 overflow-y-auto pr-1"
        role="log"
        aria-label="Mensajes"
      >
        {messages.length === 0 && (
          <p className="text-muted text-sm">
            Sin mensajes todavía. Escribinos lo que necesites.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-[var(--radius-ui)] border px-3.5 py-2.5 text-sm ${
              message.mine
                ? 'border-ink bg-ink text-surface ml-auto'
                : 'border-line bg-paper'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <p
              className={`mt-1 font-mono text-[0.6rem] ${message.mine ? 'text-surface/60' : 'text-dim'}`}
            >
              {message.senderName} · {message.createdAt}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-signal text-xs">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí un mensaje…"
          maxLength={2000}
          aria-label="Tu mensaje"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="bg-signal text-surface hover:bg-signal-dark shrink-0 rounded-[var(--radius-ui)] px-4 text-sm font-bold transition-colors disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
