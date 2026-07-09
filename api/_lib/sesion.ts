import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Sesion } from './tipos';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secretKey(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET no configurado');
  return s;
}

function hmac(payload: string): string {
  return createHmac('sha256', secretKey()).update(payload).digest('base64url');
}

export function crearCookie(sesion: Sesion): string {
  const exp = Date.now() + TTL_MS;
  const payload = Buffer.from(JSON.stringify({ sesion, exp })).toString('base64url');
  const firma = hmac(payload);
  const valor = `${payload}.${firma}`;
  return `sesion=${valor}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MS / 1000}`;
}

export function parsearSesion(cookieHeader: string | undefined): Sesion | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)sesion=([^;]+)/);
  if (!match) return null;
  try {
    const [payload, firma] = match[1].split('.');
    if (!payload || !firma) return null;
    const firmaEsperada = Buffer.from(hmac(payload), 'base64url');
    const firmaRecibida = Buffer.from(firma, 'base64url');
    if (firmaEsperada.length !== firmaRecibida.length) return null;
    if (!timingSafeEqual(firmaEsperada, firmaRecibida)) return null;
    const { sesion, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (Date.now() > exp) return null;
    return sesion as Sesion;
  } catch {
    return null;
  }
}

export const COOKIE_BORRAR =
  'sesion=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
