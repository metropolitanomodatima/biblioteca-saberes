import type { EntradaIndice, RecursoCompleto } from '@/types/recurso';
import { obtenerEntrada } from './indice';

// Parser mínimo de frontmatter YAML: solo lo necesario para lectura en runtime.
// (En el build, gray-matter se ejecuta en Node para producir el índice.)
function parseFrontmatter(md: string): { data: Record<string, unknown>; content: string } {
  const coincide = md.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!coincide) return { data: {}, content: md };

  const bloque = coincide[1];
  const contenido = coincide[2];
  const datos: Record<string, unknown> = {};

  const lineas = bloque.split(/\r?\n/);
  let claveActual: string | null = null;
  let listaActual: string[] | null = null;

  for (const linea of lineas) {
    if (!linea.trim()) continue;
    const itemLista = linea.match(/^\s*-\s+(.*)$/);
    if (itemLista && claveActual) {
      if (!listaActual) {
        listaActual = [];
        datos[claveActual] = listaActual;
      }
      listaActual.push(itemLista[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }
    const par = linea.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ_][\w-]*)\s*:\s*(.*)$/);
    if (par) {
      claveActual = par[1];
      const valor = par[2].trim();
      listaActual = null;
      if (valor === '') {
        datos[claveActual] = null;
      } else {
        datos[claveActual] = valor.replace(/^["']|["']$/g, '');
      }
    }
  }

  return { data: datos, content: contenido };
}

export async function cargarRecurso(id: string): Promise<RecursoCompleto> {
  const entrada = await obtenerEntrada(id);
  if (!entrada) {
    throw new Error(`Recurso no encontrado: ${id}`);
  }
  const url = `${import.meta.env.BASE_URL}recursos/${entrada.ruta}`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar el recurso "${id}" (HTTP ${respuesta.status}).`);
  }
  const texto = await respuesta.text();
  const { data, content } = parseFrontmatter(texto);
  return { ...entrada, contenido: content, frontmatter: data } satisfies RecursoCompleto;
}

export function agrupar<T extends EntradaIndice>(
  entradas: T[],
  llave: (e: T) => string | undefined,
): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const e of entradas) {
    const k = llave(e) ?? '—';
    const lista = grupos.get(k) ?? [];
    lista.push(e);
    grupos.set(k, lista);
  }
  return grupos;
}
