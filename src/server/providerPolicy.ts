import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { Agent, fetch as undiciFetch } from 'undici';

const DEFAULT_HOSTS = ['api.openrouter.ai', 'nano-gpt.com'];

export function allowedCustomHosts(value = process.env.ALLOWED_CUSTOM_API_HOSTS): Set<string> {
  return new Set((value === undefined ? DEFAULT_HOSTS.join(',') : value)
    .split(',').map(host => host.trim().toLowerCase()).filter(Boolean));
}

function forbiddenIp(host: string): boolean {
  const normalized = host.replace(/^\[|\]$/g, '').toLowerCase();
  const version = isIP(normalized);
  if (version === 4) {
    const [a, b] = normalized.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0) || (a === 192 && b === 88) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) || (a === 203 && b === 0);
  }
  if (version === 6) {
    const first = Number.parseInt(normalized.split(':')[0] || '0', 16);
    return first < 0x2000 || first >= 0x4000 ||
      normalized.startsWith('2001:db8:') || normalized.startsWith('2001:0:') ||
      normalized.startsWith('2002:') || normalized.startsWith('3ffe:') ||
      normalized.startsWith('::ffff:');
  }
  return false;
}

export function validateCustomProviderUrl(input: string, production = process.env.NODE_ENV === 'production', hosts = allowedCustomHosts()): URL {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error('Invalid custom provider URL.'); }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || url.username || url.password || url.hash) throw new Error('Invalid custom provider URL.');
  if (url.protocol !== 'https:' && (production || url.protocol !== 'http:')) throw new Error('Custom provider requires HTTPS.');
  if (production && (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || isIP(host) || forbiddenIp(host))) {
    throw new Error('Custom provider host is not permitted.');
  }
  if (production && !hosts.has(host)) throw new Error('Custom provider host is not permitted.');
  return url;
}

export async function assertPublicResolution(url: URL, resolver: (hostname: string, options: { all: true }) => Promise<Array<{ address: string; family: number }>> = lookup): Promise<void> {
  let timer: ReturnType<typeof setTimeout>;
  const records = await Promise.race([
    resolver(url.hostname, { all: true }),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Provider DNS lookup timed out.')), 5000); })
  ]).finally(() => clearTimeout(timer));
  if (!records.length || records.some(record => forbiddenIp(record.address))) {
    throw new Error('Custom provider resolves to a forbidden network.');
  }
}

export function createPinnedPublicLookup(resolver: (hostname: string, options: { all: true }) => Promise<Array<{ address: string; family: number }>> = lookup) {
  return (hostname: string, _options: unknown, callback: (error: Error | null, address?: string, family?: number) => void) => {
    resolver(hostname, { all: true }).then(records => {
      if (!records.length || records.some(record => forbiddenIp(record.address))) {
        callback(new Error('Custom provider resolves to a forbidden network.'));
        return;
      }
      callback(null, records[0].address, records[0].family);
    }).catch(error => callback(error));
  };
}

const publicAgent = new Agent({ connect: { lookup: createPinnedPublicLookup() as any } });

export function fetchCustomProvider(url: URL, init: RequestInit, timeoutMs = 90_000, fetcher?: typeof fetch): Promise<Response> {
  const options = { ...init, redirect: 'error' as const, signal: AbortSignal.timeout(timeoutMs) };
  if (fetcher) return fetcher(url, options);
  if (process.env.NODE_ENV === 'production') {
    return undiciFetch(url.toString(), { ...options, dispatcher: publicAgent } as any) as unknown as Promise<Response>;
  }
  return fetch(url, options);
}

const SAFE_HEADERS = new Set(['http-referer', 'x-title', 'x-provider', 'x-api-version', 'anthropic-version', 'x-api-key']);

export function validateCustomHeaders(input: unknown): Record<string, string> {
  if (!input) return {};
  let parsed: unknown;
  try { parsed = typeof input === 'string' ? JSON.parse(input) : input; } catch { throw new Error('Invalid custom headers JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid custom headers JSON.');
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!SAFE_HEADERS.has(key.toLowerCase()) || typeof value !== 'string' || /[\r\n]/.test(value) || value.length > 500) {
      throw new Error('Custom header is not permitted.');
    }
    result[key] = value;
  }
  return result;
}
