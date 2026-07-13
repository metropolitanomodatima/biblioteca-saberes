import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsearSesion } from '../_lib/sesion.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const sesion = parsearSesion(req.headers.cookie);
  if (!sesion) return res.status(401).json({ error: 'No autenticado' });
  res.json(sesion);
}
