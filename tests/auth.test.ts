import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuth } from '../src/server/auth.js';
import type { Request, Response } from 'express';

const month = 30 * 24 * 60 * 60 * 1000;

function response() {
  const result: { status: number; body?: any; cookie?: string; options?: any; cleared?: any } = { status: 200 };
  const res = {
    status(code: number) { result.status = code; return res; },
    json(body: any) { result.body = body; return res; },
    cookie(name: string, value: string, options: any) { result.cookie = `${name}=${value}`; result.options = options; return res; },
    clearCookie(name: string, options: any) { result.cleared = { name, options }; return res; }
  } as unknown as Response;
  return { res, result };
}

function request(cookie?: string, password?: string): Request {
  return { headers: { cookie }, body: { password } } as Request;
}

test('stateless production session survives a fresh auth instance and enforces signature, expiry, and secret rotation', () => {
  const password = 'test-password';
  const secret = 'a'.repeat(64);
  let clock = 1_800_000_000_000;
  let auth = createAuth(password, secret, true, () => clock);
  const login = response();
  auth.login(request(undefined, password), login.res);
  assert.equal(login.result.status, 200);
  assert.equal(login.result.body.ok, true);
  const cookie = login.result.cookie!;
  assert.ok(cookie);
  assert.deepEqual(login.result.options, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: month });
  assert.equal(cookie.includes(password), false);

  auth = createAuth(password, secret, true, () => clock);
  const freshStatus = response();
  auth.status(request(cookie), freshStatus.res);
  assert.equal(freshStatus.result.body.authenticated, true);

  const tampered = response();
  const [name, token] = cookie.split('=');
  const [payload, mac] = token.split('.');
  auth.status(request(`${name}=${payload}.${mac[0] === 'A' ? 'B' : 'A'}${mac.slice(1)}`), tampered.res);
  assert.equal(tampered.result.body.authenticated, false);

  const rotated = response();
  createAuth(password, 'b'.repeat(64), true, () => clock).status(request(cookie), rotated.res);
  assert.equal(rotated.result.body.authenticated, false);

  clock += month + 1;
  const expired = response();
  createAuth(password, secret, true, () => clock).status(request(cookie), expired.res);
  assert.equal(expired.result.body.authenticated, false);
});

test('logout clears production browser cookie', () => {
  const auth = createAuth('test-password', 'a'.repeat(64), true);
  const login = response();
  auth.login(request(undefined, 'test-password'), login.res);
  const logout = response();
  auth.logout(request(login.result.cookie), logout.res);
  assert.equal(logout.result.body.ok, true);
  assert.deepEqual(logout.result.cleared, {
    name: 'prompt_refinery_session',
    options: { httpOnly: true, secure: true, sameSite: 'strict', path: '/' }
  });
  const browserAfterLogout = response();
  auth.status(request(), browserAfterLogout.res);
  assert.equal(browserAfterLogout.result.body.authenticated, false);
});
