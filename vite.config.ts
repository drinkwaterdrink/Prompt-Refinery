import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
let buildId = process.env.GITHUB_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || '';
if (!buildId) {
  try { buildId = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { buildId = 'local'; }
}
buildId = /^[a-f0-9]{7,40}$/i.test(buildId) ? buildId.slice(0, 8) : 'local';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        id: '/',
        name: 'Prompt Refinery',
        short_name: 'Refinery',
        description: 'Craft precise prompts, blueprints, project plans, and design audits.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#07080b',
        theme_color: '#0e0e0e',
        categories: ['productivity', 'utilities'],
        prefer_related_applications: false,
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/healthz$/],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.origin === self.location.origin && (url.pathname.startsWith('/api/') || url.pathname === '/healthz'),
          handler: 'NetworkOnly'
        }],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false
      }
    })],
    define: { __APP_VERSION__: JSON.stringify(version), __APP_BUILD__: JSON.stringify(buildId) },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
