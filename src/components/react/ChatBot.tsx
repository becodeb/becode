import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    'Hola. Soy el asistente de becode. Preguntame qué hacemos, cómo trabajamos o sobre nuestros proyectos.',
};

const MAX_HISTORY = 16;

function createId(): string {
  return Math.random().toString(36).slice(2);
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { id: createId(), role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = nextMessages
        .filter((message) => message.role !== 'error')
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? 'Error desconocido.');
      }

      setMessages((current) => [
        ...current,
        { id: createId(), role: 'assistant', content: data.reply as string },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'error',
          content: 'No pudimos responder. Probá de nuevo o escribinos a hola@becode.com.ar.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asistente de becode"
          className="border-ink bg-paper shadow-window fixed inset-x-3 top-[4.5rem] bottom-3 flex flex-col overflow-hidden rounded-[var(--radius-ui)] border sm:inset-auto sm:top-auto sm:right-0 sm:bottom-20 sm:h-[34rem] sm:w-96"
        >
          <div className="bg-ink text-surface flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-display text-base font-semibold">
                be<span className="text-signal">/</span>code
              </p>
              <p className="text-dim text-xs">Asistente del sitio</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="hover:text-signal grid h-8 w-8 place-items-center rounded-[var(--radius-ui)] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-[var(--radius-ui)] bg-ink px-4 py-2.5 text-sm text-surface'
                    : message.role === 'error'
                      ? 'text-signal max-w-[85%] rounded-[var(--radius-ui)] border border-signal/30 bg-surface px-4 py-2.5 text-sm'
                      : 'max-w-[85%] rounded-[var(--radius-ui)] border border-line bg-surface px-4 py-2.5 text-sm text-ink'
                }
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="border-line bg-surface flex w-fit gap-1.5 rounded-[var(--radius-ui)] border px-4 py-3">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-line flex items-center gap-2 border-t bg-surface p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribí tu pregunta…"
              maxLength={1000}
              disabled={loading}
              aria-label="Tu mensaje"
              className="border-line focus:border-signal focus:ring-signal/30 w-full rounded-[var(--radius-ui)] border bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:ring-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              aria-label="Enviar mensaje"
              className="bg-signal text-surface hover:bg-signal-dark grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-ui)] transition-colors disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M4 12h16M13 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar el asistente' : 'Abrir el asistente de becode'}
        className="bg-ink text-surface shadow-window hover:bg-signal grid h-14 w-14 place-items-center rounded-full transition-colors"
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.67 17 4 16.33 4 15.5v-10Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
