// Servicio de IA único de becode.
//
// Es la MISMA integración que usa el chatbot del sitio (misma API key, mismo
// modelo, misma lógica de comunicación con OpenAI): se extrajo de
// src/pages/api/chat.ts para que toda función inteligente nueva (generación
// de prompts, análisis de briefs, etc.) la reutilice en lugar de crear otro
// cliente. No agregar otras integraciones de IA: consumir siempre este módulo.

import { OPENAI_API_KEY, OPENAI_MODEL } from 'astro:env/server';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
}

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}

export function aiModelName(): string {
  return OPENAI_MODEL;
}

export async function requestChatCompletion({
  messages,
  temperature = 0.4,
  maxTokens = 500,
}: CompletionOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY no está configurada.');
    throw new AiServiceError('El servicio de IA no está configurado.', 500);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature,
      max_completion_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error de OpenAI:', response.status, errorBody);
    throw new AiServiceError('No pudimos generar una respuesta.', 502);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new AiServiceError('No pudimos generar una respuesta.', 502);
  }

  return reply;
}
