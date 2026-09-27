import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';

const COOKIE_NAME = 'prompt_refinery_session';
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function cookies(req: Request): Record<string, string> {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => part.trim().split(/=(.*)/s).slice(0, 2)).filter(pair => pair.length === 2));
}

export function createAuth(password = process.env.APP_ACCESS_PASSWORD, secret = process.env.COOKIE_SECRET, production = process.env.NODE_ENV === 'production', now = Date.now) {
  if (production && (!password || !secret || secret.length < 32)) {
    throw new Error('Production requires APP_ACCESS_PASSWORD and COOKIE_SECRET (at least 32 characters).');
  }
  const bypass = !production && !password;
  const signingSecret = secret || randomBytes(32).toString('hex');
  const sign = (payload: string) => createHmac('sha256', signingSecret).update(payload).digest();
  const valid = (req: Request): boolean => {
    if (bypass) return true;
    const token = cookies(req)[COOKIE_NAME] || '';
    const parts = token.split('.');
    if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return false;
    const [encoded, mac] = parts;
    try {
      const actual = Buffer.from(mac, 'base64url');
      const expected = sign(encoded);
      if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) return false;
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      return Array.isArray(payload) && payload.length === 4 && payload[0] === 1
        && Number.isSafeInteger(payload[1]) && Number.isSafeInteger(payload[2])
        && typeof payload[3] === 'string' && /^[a-f0-9]{64}$/.test(payload[3])
        && payload[1] <= now() && payload[2] > now()
        && payload[2] - payload[1] === SESSION_MS;
    } catch { return false; }
  };
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'strict' as const, path: '/', maxAge: SESSION_MS };
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { ok: false, error: 'Too many login attempts. Try again later.' } });
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!valid(req)) return res.status(401).json({ ok: false, error: 'Authentication required.', type: 'AUTH_REQUIRED' });
    next();
  };
  const status = (req: Request, res: Response) => res.json({ authenticated: valid(req) });
  const login = (req: Request, res: Response) => {
    if (bypass) return res.json({ ok: true });
    const supplied = typeof req.body?.password === 'string' ? req.body.password : '';
    const expected = Buffer.from(createHmac('sha256', signingSecret).update(password || '').digest());
    const received = Buffer.from(createHmac('sha256', signingSecret).update(supplied).digest());
    if (!timingSafeEqual(expected, received)) return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    const issuedAt = now();
    const payload = Buffer.from(JSON.stringify([1, issuedAt, issuedAt + SESSION_MS, randomBytes(32).toString('hex')])).toString('base64url');
    res.cookie(COOKIE_NAME, `${payload}.${sign(payload).toString('base64url')}`, cookieOptions);
    return res.json({ ok: true });
  };
  const logout = (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: production, sameSite: 'strict', path: '/' });
    res.json({ ok: true });
  };
  return { bypass, loginLimit, requireAuth, status, login, logout };
}
