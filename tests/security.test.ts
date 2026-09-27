import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCustomProviderUrl, validateCustomHeaders, assertPublicResolution, fetchCustomProvider, createPinnedPublicLookup } from '../src/server/providerPolicy';
import { persistentProfiles, migrateProfiles } from '../src/lib/profileStorage';
import { recursiveSanitize, redactString } from '../src/lib/sanitize';
import { createAuth } from '../src/server/auth';
import { safeExportFileName } from '../src/lib/exporters';

test('production authentication fails closed without secrets', () => {
  assert.throws(() => createAuth(undefined, undefined, true));
  assert.throws(() => createAuth('set', 'short', true));
  assert.equal(createAuth(undefined, undefined, false).bypass, true);
});

test('production custom provider policy permits approved hosts', () => {
  assert.equal(validateCustomProviderUrl('https://api.openrouter.ai/api/v1/chat/completions', true).hostname, 'api.openrouter.ai');
  assert.equal(validateCustomProviderUrl('https://nano-gpt.com/api/v1/chat/completions', true).hostname, 'nano-gpt.com');
});

test('production custom provider policy rejects SSRF targets and malformed URLs', () => {
  for (const input of [
    'https://localhost:11434/v1', 'https://127.0.0.1/v1', 'https://[::1]/v1',
    'https://[fe80::1]/v1', 'https://[fd00::1]/v1',
    'https://10.1.2.3/v1', 'https://172.16.1.1/v1', 'https://192.168.1.1/v1',
    'https://169.254.169.254/latest/meta-data', 'http://api.openrouter.ai/v1',
    'https://person:pass@api.openrouter.ai/v1', 'https://example.com/v1', 'not a url'
  ]) assert.throws(() => validateCustomProviderUrl(input, true), input);
  assert.equal(validateCustomProviderUrl('http://localhost:11434/v1', false).hostname, 'localhost');
});

test('DNS resolution cannot point an approved name into private networks', async () => {
  const url = validateCustomProviderUrl('https://api.openrouter.ai/v1', true);
  await assert.rejects(() => assertPublicResolution(url, async () => [{ address: '169.254.169.254', family: 4 }]));
  await assert.doesNotReject(() => assertPublicResolution(url, async () => [{ address: '8.8.8.8', family: 4 }]));
});

test('outbound socket lookup pins a public address and rejects private DNS results', async () => {
  const publicLookup = createPinnedPublicLookup(async () => [{ address: '8.8.8.8', family: 4 }]);
  await new Promise<void>((resolve, reject) => publicLookup('api.openrouter.ai', {}, (error, address) => {
    if (error) return reject(error);
    assert.equal(address, '8.8.8.8'); resolve();
  }));
  const privateLookup = createPinnedPublicLookup(async () => [{ address: '127.0.0.1', family: 4 }]);
  await new Promise<void>(resolve => privateLookup('api.openrouter.ai', {}, error => {
    assert.ok(error); resolve();
  }));
});

test('production transport rejects a private address at connection time', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(() => fetchCustomProvider(new URL('http://localhost:43213/'), { method: 'POST' }, 1000),
      error => /forbidden network/i.test(String((error as Error & { cause?: Error }).cause?.message)));
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('outbound fetch disables redirects and times out', async () => {
  await assert.rejects(() => fetchCustomProvider(new URL('https://api.openrouter.ai/v1'), { method: 'POST' }, 100,
    async (_url, init) => {
      assert.equal(init?.redirect, 'error');
      throw new Error('redirect refused');
    }));
  const pending = assert.rejects(() => fetchCustomProvider(new URL('https://api.openrouter.ai/v1'), { method: 'POST' }, 5,
    async (_url, init) => new Promise<Response>((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('aborted'))))));
  await new Promise(resolve => setTimeout(resolve, 20));
  await pending;
});

test('custom headers cannot change transport or authorization', () => {
  assert.deepEqual(validateCustomHeaders('{"HTTP-Referer":"https://example.com","X-Title":"Prompt Refinery"}'),
    { 'HTTP-Referer': 'https://example.com', 'X-Title': 'Prompt Refinery' });
  for (const header of ['Host', 'Authorization', 'Cookie', 'Proxy-Authorization', 'Connection']) {
    assert.throws(() => validateCustomHeaders(JSON.stringify({ [header]: 'bad' })));
  }
});

test('profile migration strips persisted credentials and remains idempotent', () => {
  const raw = JSON.stringify([{ id: 'p', name: 'Mine', provider: 'custom_openai', apiUrl: 'https://nano-gpt.com/api/v1',
    model: 'model', jsonMode: true, apiKey: 'fixture-key', customHeadersJson: '{"X-Api-Key":"fixture-header"}',
    authorization: 'fixture-secret' }]);
  const first = migrateProfiles(raw);
  assert.equal(first.profiles[0].apiKey, 'fixture-key'); // Volatile for this browser session.
  assert.ok(first.rewritten);
  assert.doesNotMatch(first.rewritten!, /fixture-key|fixture-header|fixture-secret/);
  assert.equal(migrateProfiles(first.rewritten).rewritten, null);
  assert.equal(persistentProfiles(first.profiles)[0].name, 'Mine');
});

test('profile URLs cannot persist embedded credentials or secret query parameters', () => {
  const profile = { id: 'p', name: 'Profile', provider: 'custom_openai' as const,
    apiUrl: 'https://user:pass@nano-gpt.com/api/v1?api_key=fixture-secret&region=us',
    apiKey: '', model: 'model', jsonMode: false };
  const serialized = JSON.stringify(persistentProfiles([profile]));
  assert.doesNotMatch(serialized, /user:pass|fixture-secret|api_key/);
  assert.match(serialized, /region=us/);
});

test('secret sanitizer removes keyed values and bearer tokens', () => {
  assert.doesNotMatch(redactString('Authorization: Bearer fixturetoken123456789012345'), /fixturetoken/);
  const sanitized = recursiveSanitize({ apiKey: 'fixture-key', nested: { password: 'fixture-pass' } });
  assert.equal(sanitized.apiKey, '[REDACTED]');
  assert.equal(sanitized.nested.password, '[REDACTED]');
});

test('export filenames redact credential-looking text', () => {
  assert.doesNotMatch(safeExportFileName('sk-abcdefghijklmnopqrstuvwxyz1234567890_blueprint.json'), /abcdefghijklmnopqrstuvwxyz/);
});
