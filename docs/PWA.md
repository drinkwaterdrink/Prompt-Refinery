# Prompt Refinery PWA

Prompt Refinery is an installable web app. The hosted application remains one same-origin Node/Express deployment; the PWA adds an offline-capable shell and local workspace storage. Hosting and Railway setup are separate deployment work.

## Install on Android

Open the HTTPS Prompt Refinery URL in Chrome or Samsung Internet. Sign in, open **Settings → App & local data**, and choose **Install Prompt Refinery** when available. If the button cannot open an install prompt, use the browser menu and choose **Install app** or **Add to Home Screen**. Once installed, the app opens in a standalone window. Installation does not require an APK or later reinstalls.

## Updates

`vite-plugin-pwa` and Workbox generate one service worker from the current Vite build. It precaches the HTML shell, hashed JavaScript/CSS, and icons. The app checks for an updated worker at launch, after returning to a visible tab following at least 15 minutes, and every 30 minutes while visible. A waiting worker displays **Update now** and **Later**. Later keeps the current page and unsaved inputs intact; Settings retains an update action. Update now activates the waiting worker and reloads. If a generation operation is active, activation waits until it finishes. A rendering failure offers a deliberate **Reload latest version** action.

The old hand-written `refinery-app-shell-v1` cache is removed by the new app. Workbox cleans up obsolete precache versions. Browser caches for `index.html`, the manifest, and worker scripts revalidate; fingerprinted `/assets/*` use immutable caching.

## Offline behavior and security

The service worker caches application resources only. `/api/*` and `/healthz` are network-only and excluded from navigation fallback. It never caches authentication, provider results, generated content, credentials, or health responses. There is no background queue for AI work.

After a successful online server authentication, the browser stores a small local-only access marker. It contains no password, cookie, token, or API key. If the network or server becomes unavailable, that browser can open locally saved history, packs, drafts, exports, and client-side Mock Mode. The banner says **Offline — local features only** or **Server unavailable — local features only**. Live generation is blocked. A fresh device without a successful sign-in cannot enter this local workspace. On reconnect, the server session is checked again; a rejected session returns to the login screen. The local marker is a convenience for local browser data, not server authorization. The Express authentication middleware remains authoritative for every paid API request.

**Lock** is always available, including offline. It immediately removes local-only access through the app UI and clears volatile browser key fields. When the server is reachable, Lock also requests server logout, which clears the HttpOnly session cookie. If that request fails, the local workspace stays locked and the login screen says server logout could not be confirmed; it does not claim the server session was revoked. Offline or during a server outage, Lock makes no logout request. The app remains locked across reloads and revalidates the server session when connectivity returns, but an explicit successful online password sign-in is required to reopen the workspace and restore offline access. The frontend never reads or stores the HttpOnly session token.

Workflow History lives in IndexedDB. Existing `prompt_refinery_workflow_history` localStorage records migrate once, by ID, inside a transaction. The legacy key is removed only after migration commits. If migration fails, the legacy records remain and the app reports a small notice. When the legacy data is valid but IndexedDB is unavailable, history continues saving to localStorage until a later successful migration. Project packs, small preferences, and drafts remain in localStorage. Browsers can still clear local data; Settings offers a user-triggered persistent-storage request where supported.

**Backup Prompt Refinery Data** downloads versioned JSON containing history, packs, non-secret connection profile metadata, selected preferences, and local drafts. Credentials, cookies, session material, and custom secret headers are excluded. **Restore Prompt Refinery Data** validates the schema, previews record counts in a confirmation, and merges by ID while keeping existing records and drafts when IDs or values already exist. Keep backups somewhere you control.

Android and other browsers that support file sharing can use **Share** on an output to open the native share sheet. Existing Copy and Download actions remain available; Share downloads the file when native file sharing is unsupported.

## Local production PWA testing

Use Node 24 LTS. Development mode supports hot reload but is not an installability test. Build and run the production Express app with test-only secrets:

```bash
npm install
npm run generate:pwa-icons
npm run typecheck
npm test
npm run build
npm run test:pwa
```

`npm run test:pwa` starts the built Express server with random in-memory test credentials and runs Playwright Chromium at desktop, 412×915, and 360×800 viewports. Install its Chromium binary first with `npx playwright install chromium` if necessary. The suite checks the manifest, icons, service-worker control, network-only API behavior, offline shell, mock generation, history migration, backup sanitization, and mobile navigation. It uses no paid AI provider. Browser test output under `test-results/` is ignored by Git.
