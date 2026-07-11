import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { OPENAI_API_KEY, OPENAI_MODEL } from 'astro:env/server';
import companyContext from '@/data/company-context.md?raw';

export const prerender = false;

const MAX_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== 'object' || !('messages' in body)) return null;
  const raw = (body as { messages: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES)
    return null;

  const messages: ChatMessage[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const { role, content } = entry as { role: unknown; content: unknown };
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || content.trim().length === 0) return null;
    if (content.length > MAX_MESSAGE_LENGTH) return null;
    messages.push({ role, content: content.trim() });
  }

  if (messages[messages.length - 1]?.role !== 'user') return null;
  return messages;
}

async function buildSystemPrompt(): Promise<string> {
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let rateLimitKey = 'unknown';
  try {
    rateLimitKey = clientAddress;
  } catch {
    // clientAddress puede no estar disponible según el modo del adapter.
  }

  if (isRateLimited(rateLimitKey)) {
    return new Response(
      JSON.stringify({
        error: 'Demasiadas consultas. Probá de nuevo en unos minutos.',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY no está configurada.');
    return new Response(
      JSON.stringify({
        error: 'El asistente no está disponible en este momento.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return new Response(JSON.stringify({ error: 'Mensaje inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = await buildSystemPrompt();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        max_completion_tokens: 500,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error de OpenAI:', response.status, errorBody);
      return new Response(
        JSON.stringify({
          error: 'No pudimos generar una respuesta. Probá de nuevo.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return new Response(
        JSON.stringify({
          error: 'No pudimos generar una respuesta. Probá de nuevo.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error llamando a OpenAI:', error);
    return new Response(
      JSON.stringify({
        error: 'No pudimos generar una respuesta. Probá de nuevo.',
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
