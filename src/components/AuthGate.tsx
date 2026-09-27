import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { apiFetch } from '../lib/api/client';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    apiFetch('/api/auth/status', { timeoutMs: 5000 }).then(async response => {
      const data = await response.json();
      setStatus(data.authenticated ? 'unlocked' : 'locked');
    }).catch(() => { setError('Cannot reach Prompt Refinery.'); setStatus('locked'); });
    const lock = () => setStatus('locked');
    window.addEventListener('prompt-refinery-auth-required', lock);
    return () => window.removeEventListener('prompt-refinery-auth-required', lock);
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/auth/login', { method: 'POST', json: { password }, timeoutMs: 8000 });
      if (!response.ok) { setError('Invalid password or too many attempts.'); return; }
      setPassword(''); setStatus('unlocked');
    } catch { setError('Cannot reach Prompt Refinery.'); }
    finally { setBusy(false); }
  }
  if (status === 'unlocked') return <>{children}</>;
  return <main className="min-h-screen bg-[#0b0d10] flex items-center justify-center px-4 text-slate-100">
    <div className="w-full max-w-md rounded-2xl border border-[#26333b] bg-[#11161b] p-8 shadow-2xl">
      <div className="mb-6 text-cyan-400 text-xs font-semibold tracking-[0.3em] uppercase">Prompt Refinery</div>
      <h1 className="text-3xl font-semibold mb-2">Workspace locked</h1>
      <p className="text-slate-400 mb-7">Enter your access password to continue.</p>
      {status === 'checking' ? <p className="text-slate-400">Checking session…</p> : <form onSubmit={login}>
        <label htmlFor="access-password" className="block text-sm mb-2 text-slate-300">Access password</label>
        <input id="access-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required
          className="w-full rounded-lg border border-[#34434d] bg-[#0b0d10] p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">{busy ? 'Unlocking…' : 'Unlock workspace'}</button>
      </form>}
    </div>
  </main>;
}
