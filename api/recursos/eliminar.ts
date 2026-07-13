import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsearSesion } from '../_lib/sesion.js';
import { tienePermiso } from '../_lib/tipos.js';
import { shaMain, crearRama, abrirPR, shaArchivo, ghDelete } from '../_lib/github.js';

const SLUG_RE = /^[a-z0-9-]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  const sesion = parsearSesion(req.headers.cookie);
  if (!sesion) return res.status(401).json({ error: 'No autenticado' });
  if (!tienePermiso(sesion.rol, 'admin')) return res.status(403).json({ error: 'Solo administradores pueden eliminar recursos' });

  const { tipo, slug } = req.body as { tipo: string; slug: string };

  if (!slug || !SLUG_RE.test(slug)) return res.status(400).json({ error: 'Slug inválido' });
  if (!tipo) return res.status(400).json({ error: 'Tipo requerido' });

  const subcarpeta = tipo === 'campaña' ? 'campañas' : tipo + 's';
  const rutaArchivo = `recursos/${subcarpeta}/${slug}.md`;

  const shaActual = await shaArchivo(rutaArchivo);
  if (!shaActual) return res.status(404).json({ error: 'Recurso no encontrado en el repositorio' });

  const ts = Date.now();
  const nombreRama = `eliminar-recurso/${tipo}-${slug}-${ts}`;

  try {
    const sha = await shaMain();
    await crearRama(nombreRama, sha);

    await ghDelete({
      ruta: rutaArchivo,
      mensaje: `delete(${tipo}): ${slug}`,
      rama: nombreRama,
      sha: shaActual,
    });

    const prUrl = await abrirPR({
      titulo: `delete(${tipo}): ${slug}`,
      cuerpo: `Recurso eliminado por @${sesion.login} desde el mantenedor del sitio.\n\n**Tipo:** ${tipo}\n**Archivo:** ${rutaArchivo}`,
      rama: nombreRama,
    });

    res.json({ pr_url: prUrl, branch: nombreRama });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
}