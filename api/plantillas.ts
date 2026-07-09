import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aquí = path.dirname(fileURLToPath(import.meta.url));
const rutaJson = path.resolve(aquí, '..', 'public', 'plantillas.json');

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const contenido = await readFile(rutaJson, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(contenido);
  } catch {
    res.status(503).json({ error: 'plantillas.json no generado — ejecuta npm run build' });
  }
}
