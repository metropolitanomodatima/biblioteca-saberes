import type { EntradaIndice, Indice, TipoRecurso } from '@/types/recurso';

let promesaIndice: Promise<Indice> | null = null;

export function cargarIndice(): Promise<Indice> {
  if (!promesaIndice) {
    promesaIndice = fetch(`${import.meta.env.BASE_URL}indice-recursos.json`).then(async (r) => {
      if (!r.ok) {
        throw new Error(
          `No se pudo cargar el índice de recursos (HTTP ${r.status}). ` +
            'Ejecuta `npm run indice` en /sitio para generarlo.',
        );
      }
      return (await r.json()) as Indice;
    });
  }
  return promesaIndice;
}

export async function listarPorTipo(tipo: TipoRecurso): Promise<EntradaIndice[]> {
  const indice = await cargarIndice();
  return indice.recursos.filter((r) => r.tipo === tipo);
}

export async function obtenerEntrada(id: string): Promise<EntradaIndice | undefined> {
  const indice = await cargarIndice();
  return indice.recursos.find((r) => r.id === id);
}

export async function obtenerRelacionados(ids: string[]): Promise<EntradaIndice[]> {
  if (ids.length === 0) return [];
  const indice = await cargarIndice();
  const set = new Set(ids);
  return indice.recursos.filter((r) => set.has(r.id));
}

export async function recientes(n = 6): Promise<EntradaIndice[]> {
  const indice = await cargarIndice();
  return indice.recursos.slice(0, n);
}

export async function destacados(n = 4): Promise<EntradaIndice[]> {
  const indice = await cargarIndice();
  const preferidos: TipoRecurso[] = ['argumentario', 'campaña', 'concepto', 'conflicto'];
  const orden = new Map(preferidos.map((t, i) => [t, i]));
  return [...indice.recursos]
    .sort((a, b) => {
      const ia = orden.get(a.tipo) ?? 99;
      const ib = orden.get(b.tipo) ?? 99;
      return ia - ib;
    })
    .slice(0, n);
}

export function extraerRegiones(recursos: EntradaIndice[]) {
  const cuenta = new Map<string, number>();
  for (const r of recursos) {
    if (r.region) cuenta.set(r.region, (cuenta.get(r.region) ?? 0) + 1);
  }
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([valor, total]) => ({ valor, total }));
}

export function extraerFacetas(recursos: EntradaIndice[]) {
  const contar = (llave: 'temas' | 'territorios' | 'etiquetas') => {
    const cuenta = new Map<string, number>();
    for (const r of recursos) {
      for (const v of r[llave]) {
        cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
      }
    }
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
      .map(([valor, total]) => ({ valor, total }));
  };
  return {
    temas: contar('temas'),
    territorios: contar('territorios'),
    etiquetas: contar('etiquetas'),
  };
}
