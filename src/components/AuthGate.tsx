import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { apiFetch, setLocalOnlyMode } from '../lib/api/client';

const MARKER = 'prompt_refinery_offline_access_v1';
type Access = 'checking' | 'locked' | 'online' | 'local_only';
type Connection = 'online' | 'offline' | 'server_unavailable';
const AccessContext = createContext<{ localOnly: boolean; connection: Connection }>({ localOnly: false, connection: 'online' });
export const useWorkspaceAccess = () => useContext(AccessContext);

export default function AuthGate({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>('checking');
  const [connection, setConnection] = useState<Connection>(navigator.onLine ? 'online' : 'offline');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let lastCheck = 0;
    async function checkSession() {
      lastCheck = Date.now();
      if (!navigator.onLine) {
        if (active) { setConnection('offline'); setAccess(localStorage.getItem(MARKER) === '1' ? 'local_only' : 'locked'); }
        return;
      }
      try {
        const response = await apiFetch('/api/auth/status', { timeoutMs: 5000 });
        const data = await response.json();
        if (!active) return;
        setConnection('online');
        if (data.authenticated) {
          localStorage.setItem(MARKER, '1');
          setAccess('online');
        } else {
          localStorage.removeItem(MARKER);
          setAccess('locked');
        }
      } catch {
        if (!active) return;
        setConnection(navigator.onLine ? 'server_unavailable' : 'offline');
        setAccess(localStorage.getItem(MARKER) === '1' ? 'local_only' : 'locked');
      }
    }
    const lock = () => { localStorage.removeItem(MARKER); setAccess('locked'); };
    const online = () => { void checkSession(); };
    const offline = () => { setConnection('offline'); setAccess(localStorage.getItem(MARKER) === '1' ? 'local_only' : 'locked'); };
    const visible = () => { if (document.visibilityState === 'visible' && Date.now() - lastCheck > 60_000) void checkSession(); };
    void checkSession();
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('prompt-refinery-auth-required', lock);
    document.addEventListener('visibilitychange', visible);
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void checkSession(); }, 60_000);
    return () => {
      active = false; window.clearInterval(interval);
      window.removeEventListener('online', online); window.removeEventListener('offline', offline);
      window.removeEventListener('prompt-refinery-auth-required', lock); document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  useEffect(() => { setLocalOnlyMode(access === 'local_only'); }, [access]);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/auth/login', { method: 'POST', json: { password }, timeoutMs: 8000 });
      if (!response.ok) { setError('Invalid password or too many attempts.'); return; }
      localStorage.setItem(MARKER, '1');
      setPassword(''); setConnection('online'); setAccess('online');
    } catch { setError('Cannot reach Prompt Refinery.'); }
    finally { setBusy(false); }
  }
  if (access === 'online' || access === 'local_only') {
    return <AccessContext.Provider value={{ localOnly: access === 'local_only', connection }}>{children}</AccessContext.Provider>;
  }
  return <main className="min-h-dvh bg-[#07080b] flex items-center justify-center px-4 text-slate-100">
    <div className="w-full max-w-md rounded-2xl border border-[#26333b] bg-[#11161b] p-6 sm:p-8 shadow-2xl">
      <div className="mb-6 text-cyan-400 text-xs font-semibold tracking-[0.3em] uppercase">Prompt Refinery</div>
      <h1 className="text-3xl font-semibold mb-2">Workspace locked</h1>
      <p className="text-slate-400 mb-7">{connection === 'offline' ? 'Connect to the internet to sign in on this device.' : 'Enter your access password to continue.'}</p>
      {access === 'checking' ? <p className="text-slate-400" role="status">Checking session…</p> : <form onSubmit={login}>
        <label htmlFor="access-password" className="block text-sm mb-2 text-slate-300">Access password</label>
        <input id="access-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={connection !== 'online'}
          className="w-full rounded-lg border border-[#34434d] bg-[#0b0d10] p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50" />
        {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
        <button disabled={busy || connection !== 'online'} className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">{busy ? 'Unlocking…' : 'Unlock workspace'}</button>
      </form>}
    </div>
  </main>;
}
