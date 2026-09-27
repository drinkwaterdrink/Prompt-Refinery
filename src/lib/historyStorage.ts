import { openDB } from 'idb';
import type { WorkflowHistoryItem } from '../types';
import { recursiveSanitize } from './sanitize';

export const LEGACY_HISTORY_KEY = 'prompt_refinery_workflow_history';
export const HISTORY_MIGRATION_KEY = 'prompt_refinery_history_migration_version';
const DATABASE = 'prompt-refinery-local';
const STORE = 'workflow-history';
let writeQueue: Promise<void> = Promise.resolve();

async function openHistoryDB() {
  return openDB(DATABASE, 1, {
    upgrade(db) { db.createObjectStore(STORE, { keyPath: 'id' }); }
  });
}

function validItem(item: unknown): item is WorkflowHistoryItem {
  return !!item && typeof item === 'object' && typeof (item as WorkflowHistoryItem).id === 'string'
    && !!(item as WorkflowHistoryItem).id && typeof (item as WorkflowHistoryItem).title === 'string';
}

/** The legacy key is removed only after the IndexedDB transaction commits. */
export async function migrateLegacyHistory(storage: Storage = localStorage): Promise<void> {
  const raw = storage.getItem(LEGACY_HISTORY_KEY);
  if (!raw) { storage.setItem(HISTORY_MIGRATION_KEY, '1'); return; }
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(validItem)) throw new Error('Legacy history has an invalid format.');
  const db = await openHistoryDB();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    for (const item of parsed) {
      if (!await tx.store.get(item.id)) await tx.store.put(recursiveSanitize(item));
    }
    await tx.done;
    storage.removeItem(LEGACY_HISTORY_KEY);
    storage.setItem(HISTORY_MIGRATION_KEY, '1');
  } finally { db.close(); }
}

export async function readWorkflowHistory(): Promise<WorkflowHistoryItem[]> {
  const db = await openHistoryDB();
  try {
    const items = await db.getAll(STORE) as WorkflowHistoryItem[];
    return items.sort((a, b) => b.id.localeCompare(a.id));
  } finally { db.close(); }
}

async function replaceNow(items: WorkflowHistoryItem[]): Promise<void> {
  const db = await openHistoryDB();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    await tx.store.clear();
    for (const item of items) {
      if (!validItem(item)) throw new Error('Invalid workflow history record.');
      await tx.store.put(recursiveSanitize(item));
    }
    await tx.done;
  } finally { db.close(); }
}

export function replaceWorkflowHistory(items: WorkflowHistoryItem[]): Promise<void> {
  const operation = writeQueue.catch(() => {}).then(() => replaceNow(items));
  writeQueue = operation;
  return operation;
}
