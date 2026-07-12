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
    'Hola, soy el asistente de IA de becode. Puedo contarte qué hacemos, cómo trabajamos y qué productos construimos.',
};

const MAX_HISTORY = 16;

function createId(): string {
  return Math.random().toString(36).slice(2);
}

function AssistantLogo({ className }: { className: string }) {
  return (
    <span
      className={`${className} border-line bg-surface block shrink-0 overflow-hidden rounded-[var(--radius-ui)] border`}
      aria-hidden="true"
    >
      <img
        src="/assistant-logo.png"
        alt=""
        width={192}
        height={192}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </span>
  );
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

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: text,
    };
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

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
      };

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
          content:
            'No pudimos responder. Probá de nuevo o escribinos a hola@becode.com.ar.',
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
          aria-label="Asistente de IA de becode"
          className="border-ink bg-paper shadow-window fixed inset-x-3 top-[4.5rem] bottom-3 flex flex-col overflow-hidden rounded-[var(--radius-ui)] border sm:inset-auto sm:top-auto sm:right-0 sm:bottom-20 sm:h-[34rem] sm:w-96"
        >
          <div className="bg-ink text-surface flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <AssistantLogo className="h-10 w-10" />
              <div>
                <p className="font-display text-base font-semibold">
                  Asistente de IA
                </p>
                <p className="text-dim text-xs">
                  Respuestas automáticas sobre becode
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="hover:text-signal grid h-8 w-8 place-items-center rounded-[var(--radius-ui)] transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
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
            {messages.map((message) =>
              message.role === 'user' ? (
                <div
                  key={message.id}
                  className="bg-ink text-surface ml-auto max-w-[85%] rounded-[var(--radius-ui)] px-4 py-2.5 text-sm"
                >
                  {message.content}
                </div>
              ) : (
                <div key={message.id} className="flex items-start gap-2">
                  <AssistantLogo className="h-7 w-7" />
                  <div
                    className={
                      message.role === 'error'
                        ? 'text-signal border-signal/30 bg-surface max-w-[85%] rounded-[var(--radius-ui)] border px-4 py-2.5 text-sm'
                        : 'border-line bg-surface text-ink max-w-[85%] rounded-[var(--radius-ui)] border px-4 py-2.5 text-sm'
                    }
                  >
                    {message.content}
                  </div>
                </div>
              ),
            )}
            {loading && (
              <div className="flex items-start gap-2">
                <AssistantLogo className="h-7 w-7" />
                <div className="border-line bg-surface flex w-fit gap-1.5 rounded-[var(--radius-ui)] border px-4 py-3">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-line bg-surface flex items-center gap-2 border-t p-3"
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
              className="border-line focus:border-signal focus:ring-signal/30 bg-paper text-ink placeholder:text-muted w-full rounded-[var(--radius-ui)] border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              aria-label="Enviar mensaje"
              className="bg-signal text-surface hover:bg-signal-dark grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-ui)] transition-colors disabled:opacity-40"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
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
        aria-label={
          open ? 'Cerrar el asistente' : 'Abrir el asistente de IA de becode'
        }
        className="border-ink bg-surface text-ink shadow-window hover:border-signal flex min-h-14 items-center gap-2.5 rounded-[var(--radius-ui)] border p-2 pr-3 text-left transition-colors"
      >
        <AssistantLogo className="h-11 w-11" />
        <span className="min-w-0">
          <strong className="font-display block text-sm font-semibold whitespace-nowrap">
            Asistente de IA
          </strong>
          <small className="text-muted block text-[0.65rem] whitespace-nowrap">
            Preguntame sobre becode
          </small>
        </span>
        {open && (
          <span
            className="ml-1 grid h-6 w-6 place-items-center"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
