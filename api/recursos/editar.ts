import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsearSesion } from '../_lib/sesion.js';
import { tienePermiso, subcarpetaDeTipo } from '../_lib/tipos.js';
import { shaMain, crearRama, subirArchivo, abrirPR, shaArchivo } from '../_lib/github.js';
import { construirMarkdown } from '../_lib/yaml.js';

const SLUG_RE = /^[a-z0-9-]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });

  const sesion = parsearSesion(req.headers.cookie);
  if (!sesion) return res.status(401).json({ error: 'No autenticado' });
  if (!tienePermiso(sesion.rol, 'editor')) return res.status(403).json({ error: 'Sin permisos' });

  const { tipo, slug, titulo, resumen, frontmatter, cuerpo } = req.body as {
    tipo: string;
    slug: string;
    titulo: string;
    resumen?: string;
    frontmatter: Record<string, unknown>;
    cuerpo: string;
  };

  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'Slug inválido' });
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' });

  const rutaArchivo = `recursos/${subcarpetaDeTipo(tipo)}/${slug}.md`;
  const shaActual = await shaArchivo(rutaArchivo);
  if (!shaActual) return res.status(404).json({ error: 'Recurso no encontrado en el repositorio' });

  const ts = Date.now();
  const nombreRama = `editar-recurso/${tipo}-${slug}-${ts}`;

  const fm = { ...frontmatter, titulo, tipo, resumen: resumen ?? '' };
  const contenidoMd = construirMarkdown(fm, cuerpo);

  try {
    const sha = await shaMain();
    await crearRama(nombreRama, sha);
    await subirArchivo({
      ruta: rutaArchivo,
      contenido: contenidoMd,
      mensaje: `edit(${tipo}): ${titulo}`,
      rama: nombreRama,
      sha: shaActual,
    });
    const prUrl = await abrirPR({
      titulo: `edit(${tipo}): ${titulo}`,
      cuerpo: `Recurso editado por @${sesion.login} desde el mantenedor del sitio.\n\n**Tipo:** ${tipo}\n**Título:** ${titulo}`,
      rama: nombreRama,
    });
    res.json({ pr_url: prUrl, branch: nombreRama });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
}
