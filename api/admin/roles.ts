import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsearSesion } from '../_lib/sesion.js';
import { tienePermiso } from '../_lib/tipos.js';
import { leerArchivoRepo, shaMain, crearRama, escribirArchivoRepo, abrirPR, listarMiembrosOrg } from '../_lib/github.js';

const RUTA_CONFIG = 'config/roles.json';

interface ConfigRoles {
  admins: string[];
  editores: string[];
  _nota?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sesion = parsearSesion(req.headers.cookie);
  if (!sesion) return res.status(401).json({ error: 'No autenticado' });
  if (!tienePermiso(sesion.rol, 'admin')) return res.status(403).json({ error: 'Solo administradores pueden gestionar roles' });

  if (req.method === 'GET') {
    const [{ contenido }, miembros] = await Promise.all([
      leerArchivoRepo(RUTA_CONFIG),
      listarMiembrosOrg(),
    ]);
    if (!contenido) return res.status(404).json({ error: 'No se encontró config/roles.json' });
    const config = JSON.parse(contenido) as ConfigRoles;
    return res.json({
      admins: config.admins ?? [],
      editores: config.editores ?? [],
      miembros,
    });
  }

  if (req.method === 'PUT') {
    const { login, rol } = req.body as { login?: string; rol?: string };
    if (!login || typeof login !== 'string') return res.status(400).json({ error: 'login requerido' });
    if (!['admin', 'editor', 'militancia'].includes(rol ?? '')) return res.status(400).json({ error: 'rol inválido' });

    if (login === sesion.login) return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });

    const { sha, contenido } = await leerArchivoRepo(RUTA_CONFIG);
    if (!contenido || !sha) return res.status(500).json({ error: 'No se pudo leer config/roles.json' });

    const config = JSON.parse(contenido) as ConfigRoles;
    config.admins = (config.admins ?? []).filter((u) => u !== login);
    config.editores = (config.editores ?? []).filter((u) => u !== login);
    if (rol === 'admin') config.admins.push(login);
    if (rol === 'editor') config.editores.push(login);

    const nuevoContenido = JSON.stringify(config, null, 2) + '\n';
    const ts = Date.now();
    const nombreRama = `admin/roles-${login}-${ts}`;

    try {
      const shaBase = await shaMain();
      await crearRama(nombreRama, shaBase);
      await escribirArchivoRepo({
        ruta: RUTA_CONFIG,
        contenido: nuevoContenido,
        mensaje: `chore(roles): ${login} → ${rol} (por @${sesion.login})`,
        rama: nombreRama,
        sha,
      });
      const prUrl = await abrirPR({
        titulo: `chore(roles): ${login} → ${rol}`,
        cuerpo: `Cambio de rol solicitado por @${sesion.login}.\n\n**Usuario:** @${login}\n**Nuevo rol:** ${rol}`,
        rama: nombreRama,
      });
      return res.json({ pr_url: prUrl });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}