import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HISTORY_MIGRATION_KEY, LEGACY_HISTORY_KEY, migrateLegacyHistory, readWorkflowHistory, replaceWorkflowHistory } from '../src/lib/historyStorage';
import { createBackupData, parseBackupData, restoreBackupData } from '../src/lib/backup';

class MemoryStorage implements Storage {
  private entries = new Map<string, string>();
  get length() { return this.entries.size; }
  clear() { this.entries.clear(); }
  getItem(key: string) { return this.entries.get(key) ?? null; }
  key(index: number) { return [...this.entries.keys()][index] ?? null; }
  removeItem(key: string) { this.entries.delete(key); }
  setItem(key: string, value: string) { this.entries.set(key, value); }
}

test('legacy history moves to IndexedDB once and survives reload without duplicates', async () => {
  await replaceWorkflowHistory([]);
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([{ id: 'run_1', title: 'Saved run', rawPrompt: 'A prompt' }]));
  await migrateLegacyHistory(storage);
  assert.equal(storage.getItem(LEGACY_HISTORY_KEY), null);
  assert.equal(storage.getItem(HISTORY_MIGRATION_KEY), '1');
  assert.equal((await readWorkflowHistory()).length, 1);
  storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([{ id: 'run_1', title: 'Saved run' }]));
  await migrateLegacyHistory(storage);
  assert.equal((await readWorkflowHistory()).length, 1);
});

test('invalid legacy history remains intact when migration fails', async () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_HISTORY_KEY, '{invalid');
  await assert.rejects(() => migrateLegacyHistory(storage));
  assert.equal(storage.getItem(LEGACY_HISTORY_KEY), '{invalid');
  assert.equal(storage.getItem(HISTORY_MIGRATION_KEY), null);
});

test('backup excludes credentials and restore validates and merges records', async () => {
  await replaceWorkflowHistory([{ id: 'run_2', title: 'Output', rawPrompt: 'password=privatevalue', apiKey: 'privatevalue' } as any]);
  const storage = new MemoryStorage();
  storage.setItem('prompt_refinery_connection_profiles', JSON.stringify([{ id: 'profile_1', name: 'Personal', provider: 'custom_openai', apiUrl: 'https://api.openrouter.ai/v1?token=privatevalue', model: 'test', apiKey: 'privatevalue', customHeadersJson: '{"X-Api-Key":"privatevalue"}' }]));
  storage.setItem('prompt_refinery_project_packs', JSON.stringify([{ id: 'pack_1', name: 'Pack', description: 'Hello' }]));
  const backup = await createBackupData(storage);
  const serialized = JSON.stringify(backup);
  assert.equal(serialized.includes('privatevalue'), false);
  assert.equal(serialized.includes('apiKey'), false);
  assert.equal(serialized.includes('customHeadersJson'), false);
  assert.equal(backup.history.length, 1);
  assert.throws(() => parseBackupData('{bad'), /valid JSON/);
  assert.throws(() => parseBackupData(JSON.stringify({ ...backup, version: 2 })), /not supported/);
  await restoreBackupData(backup, storage);
  assert.equal((await readWorkflowHistory()).length, 1);
  assert.equal(JSON.parse(storage.getItem('prompt_refinery_project_packs')!).length, 1);
  assert.equal(JSON.stringify(storage.getItem('prompt_refinery_connection_profiles')).includes('privatevalue'), false);
});
