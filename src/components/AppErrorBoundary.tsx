import { Component, type ErrorInfo, type ReactNode } from 'react';

export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Render failure', error, info);
    else console.error('Render failure');
  }
  async reloadLatest() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) await registration.update();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          await Promise.race([
            new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })),
            new Promise<void>(resolve => setTimeout(resolve, 3000))
          ]);
        }
      }
    } catch { /* A normal reload remains available. */ }
    window.location.reload();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen bg-[#0b0d10] flex items-center justify-center px-4 text-slate-100">
      <section className="max-w-lg rounded-2xl border border-[#26333b] bg-[#11161b] p-8 shadow-xl">
        <p className="text-cyan-400 uppercase tracking-widest text-xs mb-4">Prompt Refinery</p>
        <h1 className="text-3xl font-semibold mb-3">Something interrupted the workspace</h1>
        <p className="text-slate-400 mb-6">Reload the application to recover your saved work.</p>
        <button onClick={() => void this.reloadLatest()} className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950">Reload latest version</button>
      </section>
    </main>;
  }
}
