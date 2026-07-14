import type { APIRoute } from 'astro';
import {
  AiServiceError,
  aiModelName,
  requestChatCompletion,
} from '@/lib/server/ai/client';
import { buildSiteAssistantPrompt } from '@/lib/server/ai/site-assistant';
import { prisma } from '@/lib/server/db';
import { errorJson, json, readJson } from '@/lib/server/http';
import { createRateLimiter, rateLimitKey } from '@/lib/server/rate-limit';

export const prerender = false;

const MAX_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 1000;

const limiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
});

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

async function logInteraction(success: boolean, error?: string): Promise<void> {
  // El chat público no debe romperse si la base de datos no está disponible.
  try {
    await prisma.aiInteraction.create({
      data: {
        feature: 'chat',
        model: aiModelName(),
        success,
        error: error ?? null,
      },
    });
  } catch {
    // Historial best-effort.
  }
}

export const POST: APIRoute = async (context) => {
  if (limiter.isLimited(rateLimitKey(context))) {
    return errorJson(
      'Demasiadas consultas. Probá de nuevo en unos minutos.',
      429,
    );
  }

  const body = await readJson(context.request);
  if (body === null) return errorJson('Cuerpo inválido.', 400);

  const messages = parseMessages(body);
  if (!messages) return errorJson('Mensaje inválido.', 400);

  const systemPrompt = await buildSiteAssistantPrompt();

  try {
    const reply = await requestChatCompletion({
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.4,
      maxTokens: 500,
    });

    void logInteraction(true);
    return json({ reply });
  } catch (error) {
    void logInteraction(
      false,
      error instanceof Error ? error.message : 'Error desconocido',
    );

    if (error instanceof AiServiceError && error.status === 500) {
      return errorJson('El asistente no está disponible en este momento.', 500);
    }
    console.error('Error llamando al servicio de IA:', error);
    return errorJson('No pudimos generar una respuesta. Probá de nuevo.', 502);
  }
};
