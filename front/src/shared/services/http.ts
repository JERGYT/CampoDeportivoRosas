import type { ErrorResponse } from './types';

/** Error HTTP del back con el código (400, 409, 500…) y el "mensaje" que envía el controlador. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: Query;
  body?: unknown;
}

/**
 * Llama a un endpoint de la rama back: `${baseUrl}${path}`.
 * Ej.: request(apiConfig.reservasUrl, '/view/clientes')
 */
export async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body } = options;
  const qs = query
    ? '?' +
      Object.entries(query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  // El cuerpo JSON se envía como text/plain para que el navegador no haga la petición previa
  // OPTIONS (CORS preflight): Slim no tiene rutas OPTIONS y respondería 405. Los controladores
  // del back leen el cuerpo con json_decode((string)$request->getBody()), así que da igual el tipo.
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}${qs}`, {
      method,
      headers: body ? { 'Content-Type': 'text/plain;charset=UTF-8' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el back esté corriendo.');
  }

  const data = (await response.json().catch(() => null)) as (T & Partial<ErrorResponse>) | null;
  if (!response.ok || data?.status === 'error') {
    throw new ApiError(response.status, data?.mensaje ?? `Error ${response.status}`);
  }
  return data as T;
}
