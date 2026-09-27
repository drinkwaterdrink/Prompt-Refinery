import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';

async function freePort(): Promise<number> {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

test('production authentication, health, and mock generation', async () => {
  const port = await freePort();
  const password = randomBytes(18).toString('hex');
  const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server.ts'], {
    cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'production', PORT: String(port),
      APP_ACCESS_PASSWORD: password, COOKIE_SECRET: randomBytes(32).toString('hex') }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverOutput = '';
  child.stdout?.on('data', chunk => { serverOutput += String(chunk); });
  child.stderr?.on('data', chunk => { serverOutput += String(chunk); });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 300; attempt++) {
      if (child.exitCode !== null) throw new Error(`Server exited ${child.exitCode}`);
      try { const response = await fetch(`${base}/healthz`); if (response.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, `server should start: ${serverOutput}`);
    const health = await fetch(`${base}/healthz`);
    assert.deepEqual(await health.json(), { status: 'ok' });
    assert.equal((await fetch(`${base}/api/auth/status`)).status, 200);
    const unauthorized = await fetch(`${base}/api/refine`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawPrompt: 'A todo app', mode: 'mock' }) });
    assert.equal(unauthorized.status, 401);
    assert.equal((await unauthorized.json()).type, 'AUTH_REQUIRED');
    const bad = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: randomBytes(16).toString('hex') }) });
    assert.equal(bad.status, 401);
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);
    assert.match(login.headers.get('set-cookie') || '', /HttpOnly.*Secure.*SameSite=Strict/i);
    const authenticated = await fetch(`${base}/api/auth/status`, { headers: { Cookie: cookie! } });
    assert.equal((await authenticated.json()).authenticated, true);
    const generated = await fetch(`${base}/api/refine`, { method: 'POST', headers: { Cookie: cookie!, 'Content-Type': 'application/json' }, body: JSON.stringify({ rawPrompt: 'A todo app', mode: 'mock' }) });
    assert.equal(generated.status, 200);
    assert.equal((await generated.json()).ok, true);
    const oversized = await fetch(`${base}/api/refine`, { method: 'POST', headers: { Cookie: cookie!, 'Content-Type': 'application/json' }, body: JSON.stringify({ rawPrompt: 'x'.repeat(2 * 1024 * 1024) }) });
    assert.equal(oversized.status, 413);
    const logout = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie! } });
    assert.equal(logout.status, 200);
    assert.equal((await (await fetch(`${base}/api/auth/status`, { headers: { Cookie: cookie! } })).json()).authenticated, false);
    for (let attempt = 0; attempt < 3; attempt++) {
      await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: randomBytes(16).toString('hex') }) });
    }
    const limited = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    assert.equal(limited.status, 429);
  } finally {
    child.kill();
  }
});
