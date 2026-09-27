export class ApiError extends Error {
  constructor(message: string, public status: number, public kind: 'network' | 'timeout' | 'http') { super(message); }
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: BodyInit | null; json?: unknown; timeoutMs?: number };

export async function apiFetch(url: `/api/${string}`, options: ApiOptions = {}) {
  const { json, timeoutMs = 300_000, ...init } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal;
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: json === undefined ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
      body: json === undefined ? init.body : JSON.stringify(json),
      signal: controller.signal
    });
    const text = await response.text();
    let data: any;
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { ok: false, error: response.ok ? 'Invalid server response.' : 'Server returned an error.' }; }
    if (response.status === 401 && data?.type === 'AUTH_REQUIRED') window.dispatchEvent(new Event('prompt-refinery-auth-required'));
    return { ok: response.ok, status: response.status, json: async () => data };
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new ApiError('Request timed out.', 0, 'timeout');
    throw new ApiError(navigator.onLine ? 'Cannot reach the server.' : 'You are offline.', 0, 'network');
  } finally {
    clearTimeout(timer);
  }
}
