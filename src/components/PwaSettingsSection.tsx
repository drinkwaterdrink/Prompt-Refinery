import { useEffect, useRef, useState } from 'react';
import { Download, Upload, RefreshCw, Smartphone, HardDrive } from 'lucide-react';
import type { PwaState } from '../hooks/usePwa';
import { createBackupData, parseBackupData, restoreBackupData } from '../lib/backup';
import { downloadJSON } from '../lib/exporters';

export function PwaSettingsSection({ pwa, showToast }: { pwa: PwaState; showToast: (message: string) => void }) {
  const restoreInput = useRef<HTMLInputElement>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  useEffect(() => {
    if (navigator.storage?.persisted) void navigator.storage.persisted().then(setPersistent).catch(() => setPersistent(null));
  }, []);
  async function requestPersistence() {
    if (!navigator.storage?.persist) return;
    try {
      const granted = await navigator.storage.persist();
      setPersistent(granted);
      showToast(granted ? 'Persistent storage granted.' : 'Browser kept its current storage policy.');
    } catch { showToast('Could not request persistent storage.'); }
  }
  async function backup() {
    try {
      downloadJSON(await createBackupData(), `prompt-refinery-backup-${new Date().toISOString().slice(0, 10)}.json`);
      showToast('Backup downloaded. Keep it somewhere safe.');
    } catch { showToast('Could not create a backup from browser storage.'); }
  }
  async function restore(file: File) {
    try {
      const backup = parseBackupData(await file.text());
      const agreed = window.confirm(`Merge this backup with local data?\n\n${backup.history.length} history records, ${backup.packs.length} project packs, ${backup.profiles.length} connection profiles.\n\nExisting records with matching IDs are kept. Saved drafts are kept when already present. The app will reload after restore.`);
      if (!agreed) return;
      await restoreBackupData(backup);
      window.location.reload();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not restore this backup.'); }
  }
  return <section className="rounded-xl border border-[#2c3540] bg-[#101820] p-4 space-y-3" aria-labelledby="pwa-settings-title">
    <div className="flex items-center gap-2 text-primary"><Smartphone className="h-4 w-4" /><h4 id="pwa-settings-title" className="text-sm font-bold">App & local data</h4></div>
    <p className="text-xs text-slate-400">Prompt Refinery v{pwa.version} · build {pwa.build} · {pwa.installed ? 'Installed app' : 'Browser tab'}</p>
    {!pwa.installed && <button type="button" onClick={() => void pwa.install()} className="pwa-settings-action">Install Prompt Refinery</button>}
    {pwa.showInstallGuide && !pwa.installed && <p className="text-xs text-slate-300">Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void pwa.checkForUpdate()} className="pwa-settings-action"><RefreshCw className="h-4 w-4" /> Check for update</button>
      {pwa.updateAvailable && <button type="button" onClick={pwa.updateNow} className="pwa-settings-action">Update now</button>}
    </div>
    <p className="text-xs text-slate-400">{pwa.updateAvailable ? 'A new version is ready.' : 'Updates are checked when the app opens and after it returns to the foreground.'}</p>
    <div className="border-t border-[#2c3540] pt-3 space-y-2">
      <p className="text-xs text-slate-300 flex items-center gap-2"><HardDrive className="h-4 w-4" /> Local history uses IndexedDB. {persistent === true ? 'Persistent storage granted.' : persistent === false ? 'Persistent storage not granted.' : 'Storage status unavailable.'}</p>
      {persistent === false && <button type="button" onClick={() => void requestPersistence()} className="pwa-settings-action">Protect local storage</button>}
      <p className="text-xs text-slate-500">Persistent storage helps protect saved history from automatic browser cleanup.</p>
    </div>
    <div className="border-t border-[#2c3540] pt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => void backup()} className="pwa-settings-action"><Download className="h-4 w-4" /> Backup Prompt Refinery Data</button>
      <input ref={restoreInput} type="file" accept=".json,application/json" className="hidden" aria-label="Restore backup file" onChange={event => {
        const file = event.target.files?.[0]; if (file) void restore(file); event.target.value = '';
      }} />
      <button type="button" onClick={() => restoreInput.current?.click()} className="pwa-settings-action"><Upload className="h-4 w-4" /> Restore Prompt Refinery Data</button>
    </div>
    <p className="text-xs text-slate-500">Backups include local work and safe profile settings. Passwords, API keys, and sessions are excluded.</p>
  </section>;
}
