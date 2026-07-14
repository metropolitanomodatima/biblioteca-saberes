export type TipoRecurso =
  | 'argumentario'
  | 'concepto'
  | 'campaña'
  | 'territorio'
  | 'cuenca'
  | 'ley'
  | 'conflicto'
  | 'persona'
  | 'organizacion'
  | 'evento'
  | 'biblioteca';

export interface EntradaIndice {
  id: string;
  tipo: TipoRecurso;
  titulo: string;
  resumen: string;
  temas: string[];
  territorios: string[];
  etiquetas: string[];
  relacionados: string[];
  fuentes: string[];
  adjuntos: string[];
  nivel: string | null;
  publico: string[];
  licencia: string | null;
  enlace: string | null;
  region: string | null;
  contenidoResumen: string;
  ruta: string;
}

export interface Indice {
  generado_en: string;
  total: number;
  por_tipo: Partial<Record<TipoRecurso, number>>;
  recursos: EntradaIndice[];
}

export interface RecursoCompleto extends EntradaIndice {
  contenido: string;
  frontmatter: Record<string, unknown>;
}

export interface CategoriaInfo {
  tipo: TipoRecurso;
  etiqueta: string;
  etiquetaPlural: string;
  descripcion: string;
  slug: string;
  ruta: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  {
    tipo: 'argumentario',
    etiqueta: 'Argumentario',
    etiquetaPlural: 'Argumentarios',
    descripcion: 'Posiciones, fundamentos y respuestas a objeciones sobre temas clave.',
    slug: 'argumentarios',
    ruta: '/argumentarios',
  },
  {
    tipo: 'concepto',
    etiqueta: 'Concepto',
    etiquetaPlural: 'Conceptos',
    descripcion: 'Definiciones y explicaciones de ideas fundamentales.',
    slug: 'conceptos',
    ruta: '/conceptos',
  },
  {
    tipo: 'campaña',
    etiqueta: 'Campaña',
    etiquetaPlural: 'Campañas',
    descripcion: 'Campañas históricas y vigentes de MODATIMA.',
    slug: 'campanas',
    ruta: '/campanas',
  },
  {
    tipo: 'territorio',
    etiqueta: 'Territorio',
    etiquetaPlural: 'Territorios',
    descripcion: 'Regiones, comunas y/o comunidades donde se encuentran agrupaciones activas de militantes de MODATIMA.',
    slug: 'territorios',
    ruta: '/territorios',
  },
  {
    tipo: 'cuenca',
    etiqueta: 'Cuenca',
    etiquetaPlural: 'Cuencas',
    descripcion: 'Cuencas hidrográficas y su realidad socioambiental.',
    slug: 'cuencas',
    ruta: '/cuencas',
  },
  {
    tipo: 'ley',
    etiqueta: 'Ley',
    etiquetaPlural: 'Leyes',
    descripcion: 'Legislación, tratados y análisis jurídico.',
    slug: 'leyes',
    ruta: '/leyes',
  },
  {
    tipo: 'conflicto',
    etiqueta: 'Conflicto',
    etiquetaPlural: 'Conflictos',
    descripcion: 'Conflictos socioambientales documentados.',
    slug: 'conflictos',
    ruta: '/conflictos',
  },
  {
    tipo: 'organizacion',
    etiqueta: 'Organización',
    etiquetaPlural: 'Organizaciones',
    descripcion: 'Organizaciones sociales, instituciones y actores relacionados.',
    slug: 'organizaciones',
    ruta: '/organizaciones',
  },
  {
    tipo: 'persona',
    etiqueta: 'Persona',
    etiquetaPlural: 'Personas',
    descripcion: 'Referentes, dirigentes y personas relevantes.',
    slug: 'personas',
    ruta: '/personas',
  },
  {
    tipo: 'evento',
    etiqueta: 'Evento',
    etiquetaPlural: 'Eventos',
    descripcion: 'Encuentros, movilizaciones e hitos.',
    slug: 'eventos',
    ruta: '/eventos',
  },
  {
    tipo: 'biblioteca',
    etiqueta: 'Documento',
    etiquetaPlural: 'Biblioteca',
    descripcion: 'Estudios, informes, material audiovisual, libros y publicaciones de referencia.',
    slug: 'biblioteca',
    ruta: '/biblioteca',
  },
];

export const CATEGORIAS_PORTADA: TipoRecurso[] = [
  'argumentario',
  'concepto',
  'campaña',
  'territorio',
  'cuenca',
  'ley',
  'biblioteca',
];

export function buscarCategoria(tipo: TipoRecurso): CategoriaInfo | undefined {
  return CATEGORIAS.find((c) => c.tipo === tipo);
}

export function buscarCategoriaPorSlug(slug: string): CategoriaInfo | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}
