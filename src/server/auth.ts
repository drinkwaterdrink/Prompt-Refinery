import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';

const COOKIE_NAME = 'prompt_refinery_session';
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function cookies(req: Request): Record<string, string> {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => part.trim().split(/=(.*)/s).slice(0, 2)).filter(pair => pair.length === 2));
}

export function createAuth(password = process.env.APP_ACCESS_PASSWORD, secret = process.env.COOKIE_SECRET, production = process.env.NODE_ENV === 'production') {
  if (production && (!password || !secret || secret.length < 32)) {
    throw new Error('Production requires APP_ACCESS_PASSWORD and COOKIE_SECRET (at least 32 characters).');
  }
  const bypass = !production && !password;
  const signingSecret = secret || randomBytes(32).toString('hex');
  const sessions = new Map<string, number>();
  const sign = (id: string) => createHmac('sha256', signingSecret).update(id).digest('base64url');
  const valid = (req: Request): boolean => {
    if (bypass) return true;
    const [id, mac] = (cookies(req)[COOKIE_NAME] || '').split('.');
    if (!id || !mac || !/^[a-f0-9]{64}$/.test(id)) return false;
    const expected = Buffer.from(sign(id));
    const actual = Buffer.from(mac);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
    const expires = sessions.get(id);
    if (!expires || expires < Date.now()) { sessions.delete(id); return false; }
    return true;
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
    for (const [sessionId, expires] of sessions) if (expires < Date.now()) sessions.delete(sessionId);
    const id = randomBytes(32).toString('hex');
    sessions.set(id, Date.now() + SESSION_MS);
    res.cookie(COOKIE_NAME, `${id}.${sign(id)}`, cookieOptions);
    return res.json({ ok: true });
  };
  const logout = (req: Request, res: Response) => {
    const id = (cookies(req)[COOKIE_NAME] || '').split('.')[0];
    sessions.delete(id);
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: production, sameSite: 'strict', path: '/' });
    res.json({ ok: true });
  };
  return { bypass, loginLimit, requireAuth, status, login, logout };
}
