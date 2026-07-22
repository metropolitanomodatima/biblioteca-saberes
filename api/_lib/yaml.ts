// Serializa un objeto de frontmatter a YAML seguro.
// Regla: cualquier escalar string que pueda romper el parser (contiene :, #, comillas,
// llaves, barras curvas, saltos de línea, o empieza con caracteres reservados)
// se emite entre comillas dobles con escapado. Listas se emiten en bloque.

const RESERVADO_INICIO = /^[\s>|&*!%@`?[\]{},'"#-]/;
const CARACTERES_RIESGO = /[:#\n\r\t"\\{}[\],&*!|>%@`]/;
// Comillas tipográficas y otros caracteres Unicode no ASCII no rompen YAML,
// pero combinadas con ':' sí — por eso el criterio principal es CARACTERES_RIESGO.

function necesitaComillas(s: string): boolean {
  if (s === '') return true;
  if (RESERVADO_INICIO.test(s)) return true;
  if (CARACTERES_RIESGO.test(s)) return true;
  if (/\s$/.test(s)) return true;
  // Valores que YAML interpretaría como no-string
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(s)) return true;
  if (/^-?\d+(\.\d+)?$/.test(s)) return true;
  return false;
}

function escaparComillasDobles(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function escalarYaml(valor: unknown): string {
  if (valor == null) return '';
  if (typeof valor === 'boolean' || typeof valor === 'number') return String(valor);
  const s = String(valor);
  if (necesitaComillas(s)) return `"${escaparComillasDobles(s)}"`;
  return s;
}

function itemLista(valor: unknown): string {
  if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) {
    const entradas = Object.entries(valor as Record<string, unknown>);
    if (entradas.length === 0) return '  - {}';
    const [primera, ...resto] = entradas;
    const lineas = [
      `  - ${primera[0]}: ${escalarYaml(primera[1])}`,
      ...resto.map(([k, v]) => `    ${k}: ${escalarYaml(v)}`),
    ];
    return lineas.join('\n');
  }
  return `  - ${escalarYaml(valor)}`;
}

export function serializarFrontmatter(frontmatter: Record<string, unknown>): string {
  return Object.entries(frontmatter)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length === 0) return `${k}: []`;
        return `${k}:\n${v.map(itemLista).join('\n')}`;
      }
      return `${k}: ${escalarYaml(v)}`;
    })
    .join('\n');
}

export function construirMarkdown(
  frontmatter: Record<string, unknown>,
  cuerpo: string,
): string {
  return `---\n${serializarFrontmatter(frontmatter)}\n---\n\n${cuerpo}`;
}
