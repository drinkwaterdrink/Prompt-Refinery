import type { ConnectionProfile } from './providers/types';
import { redactString } from './sanitize';

function safeUrl(value: unknown): string {
  const raw = String(value || '');
  try {
    const url = new URL(raw);
    url.username = '';
    url.password = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/key|token|password|secret|auth/i.test(key)) url.searchParams.delete(key);
    }
    return redactString(url.toString());
  } catch { return redactString(raw); }
}

/** Persist only profile metadata. Keys and all custom headers remain volatile. */
export function persistentProfiles(profiles: ConnectionProfile[]): ConnectionProfile[] {
  return profiles.map(profile => ({
    id: redactString(String(profile.id || '')),
    name: redactString(String(profile.name || '')),
    provider: profile.provider,
    apiUrl: safeUrl(profile.apiUrl),
    apiKey: '',
    model: redactString(String(profile.model || '')),
    customHeadersJson: '{}',
    jsonMode: Boolean(profile.jsonMode)
  }));
}

export function migrateProfiles(raw: string | null): { profiles: ConnectionProfile[]; rewritten: string | null } {
  if (!raw) return { profiles: [], rewritten: null };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { profiles: [], rewritten: '[]' };
    const profiles = parsed.filter(profile => profile && typeof profile === 'object' && typeof profile.id === 'string') as ConnectionProfile[];
    const rewritten = JSON.stringify(persistentProfiles(profiles));
    return { profiles, rewritten: rewritten === raw ? null : rewritten };
  } catch {
    return { profiles: [], rewritten: '[]' };
  }
}
