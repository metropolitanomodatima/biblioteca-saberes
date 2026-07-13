import type { Rol } from './tipos.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface ConfigRoles {
  admins: string[];
  editores: string[];
}

let cacheRoles: ConfigRoles | null = null;
let cacheTs = 0;
const CACHE_TTL = 60_000;

async function cargarRoles(): Promise<ConfigRoles> {
  // En desarrollo lee desde el sistema de archivos local
  if (process.env.NODE_ENV !== 'production') {
    const aquí = path.dirname(fileURLToPath(import.meta.url));
    const rutaLocal = path.resolve(aquí, '..', '..', 'config', 'roles.json');
    const contenido = await readFile(rutaLocal, 'utf8');
    return JSON.parse(contenido) as ConfigRoles;
  }
  // En producción lee desde GitHub
  const org = process.env.GITHUB_ORG ?? 'metropolitanomodatima';
  const repo = process.env.GITHUB_REPO ?? 'centro-conocimiento';
  const url = `https://raw.githubusercontent.com/${org}/${repo}/main/config/roles.json`;
  const r = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  if (!r.ok) throw new Error(`No se pudo leer config/roles.json: HTTP ${r.status}`);
  return r.json() as Promise<ConfigRoles>;
}

export async function obtenerRol(login: string): Promise<Rol> {
  const ahora = Date.now();
  if (!cacheRoles || ahora - cacheTs > CACHE_TTL) {
    cacheRoles = await cargarRoles();
    cacheTs = ahora;
  }
  if (cacheRoles.admins?.includes(login)) return 'admin';
  if (cacheRoles.editores?.includes(login)) return 'editor';
  return 'militancia';
}
