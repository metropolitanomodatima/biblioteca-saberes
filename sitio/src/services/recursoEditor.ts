export interface CampoPlantilla {
  nombre: string;
  tipo: 'string' | 'lista' | 'fecha' | 'booleano' | 'textarea';
  requerido: boolean;
  valorDefecto: unknown;
}

export interface PlantillaTipo {
  campos: CampoPlantilla[];
  esqueletoMarkdown: string;
}

export type MapaPlantillas = Record<string, PlantillaTipo>;

let cachePlantillas: MapaPlantillas | null = null;

export async function cargarPlantillas(): Promise<MapaPlantillas> {
  if (cachePlantillas) return cachePlantillas;
  const r = await fetch(`${import.meta.env.BASE_URL}plantillas.json`);
  if (!r.ok) throw new Error(`No se pudo cargar plantillas.json (HTTP ${r.status})`);
  cachePlantillas = (await r.json()) as MapaPlantillas;
  return cachePlantillas;
}

export interface PayloadRecurso {
  tipo: string;
  slug: string;
  titulo: string;
  resumen?: string;
  frontmatter: Record<string, unknown>;
  cuerpo: string;
}

export interface ResultadoRecurso {
  pr_url: string;
  branch: string;
}

export async function crearRecurso(payload: PayloadRecurso): Promise<ResultadoRecurso> {
  const r = await fetch('/api/recursos/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error((err as { error: string }).error);
  }
  return r.json() as Promise<ResultadoRecurso>;
}

export async function eliminarRecurso(tipo: string, slug: string): Promise<ResultadoRecurso> {
  const r = await fetch('/api/recursos/eliminar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ tipo, slug }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error((err as { error: string }).error);
  }
  return r.json() as Promise<ResultadoRecurso>;
}

export async function editarRecurso(payload: PayloadRecurso): Promise<ResultadoRecurso> {
  const r = await fetch('/api/recursos/editar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error((err as { error: string }).error);
  }
  return r.json() as Promise<ResultadoRecurso>;
}
