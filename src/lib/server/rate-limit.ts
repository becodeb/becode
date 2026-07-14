// Rate limiting simple en memoria, por proceso. Suficiente para un
// deployment de un solo nodo (VPS); si el sitio escala horizontalmente
// conviene moverlo a Redis detrás de esta misma interfaz.

interface RateLimiter {
  /** Devuelve true si la clave superó el límite en la ventana. */
  isLimited(key: string): boolean;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}): RateLimiter {
  const log = new Map<string, number[]>();

  return {
    isLimited(key: string): boolean {
      const now = Date.now();
      const timestamps = (log.get(key) ?? []).filter(
        (time) => now - time < options.windowMs,
      );
      timestamps.push(now);
      log.set(key, timestamps);
      return timestamps.length > options.maxRequests;
    },
  };
}

/** Obtiene la clave de rate limit desde el contexto de la request. */
export function rateLimitKey(context: { clientAddress?: string }): string {
  try {
    return context.clientAddress ?? 'unknown';
  } catch {
    // clientAddress puede no estar disponible según el modo del adapter.
    return 'unknown';
  }
}
