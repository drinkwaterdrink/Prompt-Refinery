import type { ProjectContextPack, WorkflowHistoryItem } from '../types';
import type { ConnectionProfile } from './providers/types';
import { readWorkflowHistory, replaceWorkflowHistory } from './historyStorage';
import { persistentProfiles } from './profileStorage';
import { redactString } from './sanitize';

const forbiddenField = /(?:api.?key|authorization|bearer|password|token|secret|cookie|customHeadersJson|session)/i;

export function stripBackupSecrets(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(stripBackupSecrets);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !forbiddenField.test(key))
      .map(([key, item]) => [key, stripBackupSecrets(item)]));
  }
  return value;
}

function storedArray<T>(storage: Storage, key: string): T[] {
  try { const parsed = JSON.parse(storage.getItem(key) || '[]'); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

export interface RefineryBackup {
  schema: 'prompt-refinery-backup';
  version: 1;
  createdAt: string;
  history: WorkflowHistoryItem[];
  packs: ProjectContextPack[];
  profiles: Pick<ConnectionProfile, 'id' | 'name' | 'provider' | 'apiUrl' | 'model' | 'jsonMode'>[];
  drafts: { rawPrompt: string; projectContext: string };
  preferences: { workflowMode: string; activeProfileId: string; activePackId: string };
}

export async function createBackupData(storage: Storage = localStorage): Promise<RefineryBackup> {
  const profiles = persistentProfiles(storedArray<ConnectionProfile>(storage, 'prompt_refinery_connection_profiles'))
    .map(({ id, name, provider, apiUrl, model, jsonMode }) => ({ id, name, provider, apiUrl, model, jsonMode }));
  return stripBackupSecrets({
    schema: 'prompt-refinery-backup', version: 1, createdAt: new Date().toISOString(),
    history: await readWorkflowHistory(),
    packs: storedArray<ProjectContextPack>(storage, 'prompt_refinery_project_packs'),
    profiles,
    drafts: {
      rawPrompt: storage.getItem('prompt_refinery_raw_prompt') || '',
      projectContext: storage.getItem('prompt_refinery_project_context') || ''
    },
    preferences: {
      workflowMode: storage.getItem('prompt_refinery_workflow_mode') || 'blueprint',
      activeProfileId: storage.getItem('prompt_refinery_active_profile_id') || '',
      activePackId: storage.getItem('prompt_refinery_active_pack_id') || ''
    }
  }) as RefineryBackup;
}

export function parseBackupData(raw: string): RefineryBackup {
  let value: any;
  try { value = JSON.parse(raw); } catch { throw new Error('This is not a valid JSON backup file.'); }
  if (value?.schema !== 'prompt-refinery-backup' || value?.version !== 1) throw new Error('This backup version is not supported.');
  if (!Array.isArray(value.history) || !Array.isArray(value.packs) || !Array.isArray(value.profiles)
    || !value.drafts || typeof value.drafts.rawPrompt !== 'string' || typeof value.drafts.projectContext !== 'string'
    || !value.preferences || typeof value.preferences.workflowMode !== 'string') {
    throw new Error('This backup is incomplete or corrupt.');
  }
  if (!value.history.every((item: any) => item && typeof item.id === 'string' && typeof item.title === 'string')
    || !value.packs.every((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string')
    || !value.profiles.every((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string')) {
    throw new Error('This backup contains invalid saved records.');
  }
  return stripBackupSecrets(value) as RefineryBackup;
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const merged = new Map(current.map(item => [item.id, item]));
  for (const item of incoming) if (!merged.has(item.id)) merged.set(item.id, item);
  return [...merged.values()];
}

export async function restoreBackupData(backup: RefineryBackup, storage: Storage = localStorage): Promise<void> {
  const safe = parseBackupData(JSON.stringify(backup));
  const history = mergeById(await readWorkflowHistory(), safe.history);
  const packs = mergeById(storedArray<ProjectContextPack>(storage, 'prompt_refinery_project_packs'), safe.packs);
  const profiles = mergeById(storedArray<ConnectionProfile>(storage, 'prompt_refinery_connection_profiles'), safe.profiles as ConnectionProfile[]);
  await replaceWorkflowHistory(history);
  storage.setItem('prompt_refinery_project_packs', JSON.stringify(stripBackupSecrets(packs)));
  storage.setItem('prompt_refinery_connection_profiles', JSON.stringify(persistentProfiles(profiles)));
  if (!storage.getItem('prompt_refinery_raw_prompt')) storage.setItem('prompt_refinery_raw_prompt', safe.drafts.rawPrompt);
  if (!storage.getItem('prompt_refinery_project_context')) storage.setItem('prompt_refinery_project_context', safe.drafts.projectContext);
  for (const [key, value] of Object.entries({
    prompt_refinery_workflow_mode: safe.preferences.workflowMode,
    prompt_refinery_active_profile_id: safe.preferences.activeProfileId,
    prompt_refinery_active_pack_id: safe.preferences.activePackId
  })) if (!storage.getItem(key) && value) storage.setItem(key, value);
}
