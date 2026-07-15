import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsearSesion } from '../_lib/sesion.js';
import { tienePermiso, subcarpetaDeTipo } from '../_lib/tipos.js';
import { shaMain, crearRama, subirArchivo, abrirPR } from '../_lib/github.js';
import { construirMarkdown } from '../_lib/yaml.js';

const TIPOS_VALIDOS = new Set([
  'argumentario', 'concepto', 'campaña', 'territorio', 'cuenca',
  'ley', 'conflicto', 'persona', 'organizacion', 'evento', 'biblioteca',
]);
const SLUG_RE = /^[a-z0-9-]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

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

  if (!TIPOS_VALIDOS.has(tipo)) return res.status(400).json({ error: `Tipo inválido: ${tipo}` });
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'Slug inválido (solo a-z, 0-9, guiones)' });
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' });

  const nombreRama = `nuevo-recurso/${tipo}-${slug}`;
  const rutaArchivo = `recursos/${subcarpetaDeTipo(tipo)}/${slug}.md`;

  const fm = { id: `${tipo}.${slug}`, titulo, tipo, resumen: resumen ?? '', ...frontmatter };
  const contenidoMd = construirMarkdown(fm, cuerpo);

  try {
    const sha = await shaMain();
    await crearRama(nombreRama, sha);
    await subirArchivo({
      ruta: rutaArchivo,
      contenido: contenidoMd,
      mensaje: `add(${tipo}): ${titulo}`,
      rama: nombreRama,
    });
    const prUrl = await abrirPR({
      titulo: `add(${tipo}): ${titulo}`,
      cuerpo: `Nuevo recurso creado por @${sesion.login} desde el mantenedor del sitio.\n\n**Tipo:** ${tipo}\n**Título:** ${titulo}\n**Resumen:** ${resumen ?? ''}`,
      rama: nombreRama,
    });
    res.json({ pr_url: prUrl, branch: nombreRama });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
}
