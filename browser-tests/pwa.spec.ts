import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  // The production login limiter permits five attempts per client per 15 minutes.
  // Model separate browser clients without weakening that server protection.
  const project = { desktop: 0, 'galaxy-s25-plus': 20, 'narrow-phone': 40 }[testInfo.project.name] ?? 60;
  const scenario = testInfo.title.startsWith('production PWA') ? 1
    : testInfo.title.startsWith('install action') ? 2
    : testInfo.title.startsWith('online logout') ? 3 : 4;
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': `198.51.100.${project + scenario}` });
});

test('production PWA keeps the full workspace usable on desktop and phones', async ({ page, context, request }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('prompt_refinery_workflow_history', JSON.stringify([{
    id: 'run_1700000000000_legacy', title: 'Migrated browser record', timestamp: 'Earlier', summary: 'Saved result',
    provider: 'mock', rawPrompt: 'Old prompt', projectContext: '', conversationHistory: [], selectedTab: 'overview', type: 'blueprint'
  }])));
  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  await expect(page.getByText('Prompt Refinery v0.10')).toBeVisible();

  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toHaveLength(3);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBeTruthy();

  await expect.poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistration()) !== undefined)).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(async () => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  await page.evaluate(async () => { const legacy = await caches.open('refinery-app-shell-v1'); await legacy.put('/legacy-only', new Response('old')); });
  await page.reload();
  await expect.poll(async () => page.evaluate(async () => !(await caches.keys()).includes('refinery-app-shell-v1'))).toBe(true);

  const nav = page.getByRole('navigation', { name: 'Primary workflows' });
  if (testInfo.project.name === 'desktop') await expect(nav).toBeHidden();
  else {
    await expect(nav).toBeVisible();
    for (const mode of ['Pipeline', 'Project', 'Audit', 'Prompt']) {
      await nav.getByRole('button', { name: mode }).click();
      await expect(nav.getByRole('button', { name: mode })).toHaveAttribute('aria-current', 'page');
    }
  }

  await page.locator('#settings-gear-button').click();
  await expect(page.getByRole('dialog', { name: 'Engine Configuration' })).toBeVisible();
  await expect(page.getByText('App & local data')).toBeVisible();
  if (testInfo.project.name !== 'desktop') {
    const originalSize = page.viewportSize()!;
    await page.setViewportSize({ width: originalSize.width, height: 520 });
    await expect(page.getByRole('dialog', { name: 'Engine Configuration' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close settings dialog' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize(originalSize);
  }
  await page.getByRole('button', { name: 'Close settings dialog' }).click();
  await expect(page.getByRole('dialog', { name: 'Engine Configuration' })).toBeHidden();

  await page.getByRole('button', { name: 'Open workflow history' }).click();
  await expect(page.getByText('Migrated browser record')).toBeVisible();
  await page.getByRole('button', { name: 'Close workflow history' }).click();
  await page.getByRole('button', { name: 'Mock' }).click();
  await page.locator('#raw-prompt').fill('Build a local test dashboard');
  await page.getByRole('button', { name: 'Enhance Prompt Blueprint' }).click();
  await expect(page.getByText('Blueprint generated and verified successfully.')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Open workflow history' }).click();
  await expect(page.getByText('Migrated browser record')).toBeVisible();
  await page.getByRole('button', { name: 'Close workflow history' }).click();
  await page.reload();
  await expect(page.locator('#raw-prompt')).toHaveValue('Build a local test dashboard');
  await page.getByRole('button', { name: 'Open workflow history' }).click();
  await expect(page.getByText('Migrated browser record')).toBeVisible();
  await page.getByRole('button', { name: 'Close workflow history' }).click();

  if (testInfo.project.name !== 'desktop') {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }

  await page.evaluate(() => localStorage.setItem('prompt_refinery_connection_profiles', JSON.stringify([{
    id: 'test-profile', name: 'Test profile', provider: 'custom_openai', apiUrl: 'https://api.openrouter.ai/v1', model: 'test', apiKey: 'never-export-this-key', customHeadersJson: '{"X-Api-Key":"never-export-this-key"}'
  }])));
  await page.locator('#settings-gear-button').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup Prompt Refinery Data' }).click();
  const download = await downloadPromise;
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(Buffer.from(chunk));
  const backup = Buffer.concat(chunks).toString('utf8');
  expect(backup).not.toContain('never-export-this-key');
  expect(JSON.parse(backup).schema).toBe('prompt-refinery-backup');
  await page.getByLabel('Restore backup file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('status').filter({ hasText: 'not a valid JSON backup' })).toBeVisible();
  await page.getByRole('button', { name: 'Close settings dialog' }).click();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline — local features only. Internet connection required for live AI generation.')).toBeVisible();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  await page.getByRole('button', { name: 'Open workflow history' }).click();
  await expect(page.getByText('Migrated browser record')).toBeVisible();
  await page.getByRole('button', { name: 'Close workflow history' }).click();
  const apiWasCached = await page.evaluate(async () => {
    try { await fetch('/api/auth/status'); return true; } catch { return false; }
  });
  expect(apiWasCached).toBe(false);
  expect(await page.evaluate(async () => { try { await fetch('/healthz'); return true; } catch { return false; } })).toBe(false);
  expect(await page.evaluate(async () => (await caches.match('/api/auth/status')) === undefined)).toBe(true);
  await page.getByRole('button', { name: 'Gemini' }).click();
  await page.getByRole('button', { name: 'Enhance Prompt Blueprint' }).click();
  await expect(page.getByText('Internet connection required for live AI generation. Switch to Mock Mode.')).toBeVisible();
  await page.getByRole('button', { name: 'Mock' }).click();
  await page.getByRole('button', { name: 'Enhance Prompt Blueprint' }).click();
  await expect(page.getByText('Blueprint generated and verified successfully.')).toBeVisible({ timeout: 15_000 });
});

test('install action is hidden in standalone mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => query.includes('display-mode: standalone')
      ? {
        matches: true, media: query, onchange: null,
        addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true,
      }
      : original(query);
  });
  await page.goto('/');
  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await page.locator('#settings-gear-button').click();
  await expect(page.getByText('Installed app')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Install Prompt Refinery' })).toHaveCount(0);
});

test('online logout and offline local lock keep the workspace locked until a fresh sign-in', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const logoutRequests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('/api/auth/logout')) logoutRequests.push(request.method()); });
  await page.goto('/');
  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBe('1');
  await page.evaluate(() => {
    sessionStorage.setItem('prompt_refinery_byok', 'test-only-key');
    sessionStorage.setItem('prompt_refinery_custom_headers', '{"X-Test-Key":"test-only-key"}');
  });

  await page.getByRole('button', { name: 'Lock workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('prompt_refinery_byok'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('prompt_refinery_custom_headers'))).toBeNull();
  await expect.poll(() => logoutRequests).toEqual(['POST']);

  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBe('1');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lock workspace' })).toBeEnabled();
  await page.getByRole('button', { name: 'Lock workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBeNull();
  expect(logoutRequests).toEqual(['POST']);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator('#access-password')).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBe('1');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline — local features only. Internet connection required for live AI generation.')).toBeVisible();
});

test('server-unavailable lock skips logout and a failed online logout reports its limit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const logoutRequests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('/api/auth/logout')) logoutRequests.push(request.method()); });
  await page.goto('/');
  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  await page.route('**/api/auth/status', route => route.abort());
  await page.reload();
  await expect(page.getByText('Server unavailable — local features only. Internet connection required for live AI generation.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lock workspace' })).toBeEnabled();
  await page.getByRole('button', { name: 'Lock workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  await expect(page.getByText('The server is unavailable, so server logout could not be confirmed.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBeNull();
  expect(logoutRequests).toEqual([]);
  await page.unroute('**/api/auth/status');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  await page.locator('#access-password').fill(process.env.PWA_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.locator('#prompt-refinery-app')).toBeVisible();
  await page.route('**/api/auth/logout', route => route.abort());
  await page.getByRole('button', { name: 'Lock workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
  await expect(page.getByText(/Server logout could not be confirmed/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('prompt_refinery_offline_access_v1'))).toBeNull();
  await expect.poll(() => logoutRequests.length).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workspace locked' })).toBeVisible();
});
