// Helper compartido por los islands para llamar a la API propia.

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function requestJson<T = Record<string, unknown>>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: options.method ?? 'POST',
      headers:
        options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {},
      body: options.body !== undefined ? JSON.stringify(options.body) : null,
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Sin body JSON.
    }

    const error =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null;

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? (payload as T) : null,
      error: response.ok ? null : (error ?? 'Algo salió mal. Probá de nuevo.'),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'No pudimos conectar con el servidor.',
    };
  }
}
