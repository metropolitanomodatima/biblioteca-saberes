import type { VercelRequest, VercelResponse } from '@vercel/node';
import { COOKIE_BORRAR } from '../_lib/sesion.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', COOKIE_BORRAR);
  res.json({ ok: true });
}
