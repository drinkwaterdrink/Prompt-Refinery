import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwa(busy: boolean) {
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheck = useRef(0);
  const installEvent = useRef<InstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      registration.current = reg || null;
      if (reg && navigator.onLine) {
        lastCheck.current = Date.now();
        void reg.update().catch(() => { /* Keep the current app running. */ });
      }
    },
    onRegisterError() { /* The browser can still run the online app. */ }
  });

  const checkForUpdate = useCallback(async () => {
    if (!navigator.onLine || !registration.current) return;
    lastCheck.current = Date.now();
    try { await registration.current.update(); } catch { /* Keep the current app running. */ }
  }, []);

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      installEvent.current = event as InstallPromptEvent;
      setInstallable(true);
    };
    const didInstall = () => { installEvent.current = null; setInstallable(false); setInstalled(true); setShowInstallGuide(false); };
    const visible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > 15 * 60_000) void checkForUpdate();
    };
    const cleanupLegacy = () => { if ('caches' in window) void caches.delete('refinery-app-shell-v1'); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', didInstall);
    document.addEventListener('visibilitychange', visible);
    navigator.serviceWorker?.addEventListener('controllerchange', cleanupLegacy);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void checkForUpdate(); }, 30 * 60_000);
    if (navigator.serviceWorker?.controller) cleanupLegacy();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', didInstall);
      document.removeEventListener('visibilitychange', visible);
      navigator.serviceWorker?.removeEventListener('controllerchange', cleanupLegacy);
    };
  }, [checkForUpdate]);

  const install = useCallback(async () => {
    if (installed) return;
    if (!installEvent.current) { setShowInstallGuide(true); return; }
    const event = installEvent.current;
    installEvent.current = null;
    setInstallable(false);
    await event.prompt();
    await event.userChoice;
  }, [installed]);

  const updateNow = useCallback(() => {
    setDismissed(false);
    if (busy) { setUpdatePending(true); return; }
    void updateServiceWorker(true);
  }, [busy, updateServiceWorker]);

  useEffect(() => {
    if (updatePending && !busy) { setUpdatePending(false); void updateServiceWorker(true); }
  }, [updatePending, busy, updateServiceWorker]);

  return {
    version: __APP_VERSION__, build: __APP_BUILD__, installed, installable, showInstallGuide, install,
    updateAvailable: needRefresh, showUpdateNotice: needRefresh && !dismissed,
    updatePending, updateNow, dismissUpdate: () => setDismissed(true), checkForUpdate
  };
}
export type PwaState = ReturnType<typeof usePwa>;
