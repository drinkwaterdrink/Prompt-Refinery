import { test, expect } from '@playwright/test';

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
