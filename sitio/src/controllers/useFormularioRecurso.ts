import { useState, useEffect } from 'react';
import type { PlantillaTipo, PayloadRecurso } from '@/services/recursoEditor';
import { cargarPlantillas, crearRecurso, editarRecurso } from '@/services/recursoEditor';
import type { Adjunto } from '@/components/FormularioRecurso';

interface Estado {
  tipo: string;
  slug: string;
  titulo: string;
  resumen: string;
  camposTexto: Record<string, string>;
  camposLista: Record<string, string[]>;
  adjuntos: Adjunto[];
  relacionados: string[];
  cuerpo: string;
}

const ESTADO_INICIAL: Estado = {
  tipo: 'concepto',
  slug: '',
  titulo: '',
  resumen: '',
  camposTexto: {},
  camposLista: {},
  adjuntos: [],
  relacionados: [],
  cuerpo: '',
};

const CAMPOS_BASE = new Set(['id', 'titulo', 'tipo', 'resumen', 'relacionados']);

function valorALista(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function adjuntosDesdeValor(v: unknown): Adjunto[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      return [{ url: String(o.url ?? ''), descripcion: String(o.descripcion ?? '') }];
    }
    if (typeof item === 'string' && item.trim()) {
      return [{ url: item.trim(), descripcion: '' }];
    }
    return [];
  });
}

function estadoDesdeEdicion(modoEdicion: PayloadRecurso, plantillas: Record<string, PlantillaTipo>): Partial<Estado> {
  const plantilla = plantillas[modoEdicion.tipo];
  const camposTexto: Record<string, string> = {};
  const camposLista: Record<string, string[]> = {};
  let adjuntos: Adjunto[] = [];

  if (plantilla) {
    for (const campo of plantilla.campos) {
      if (CAMPOS_BASE.has(campo.nombre)) continue;
      const v = modoEdicion.frontmatter[campo.nombre];
      if (campo.nombre === 'adjuntos') {
        adjuntos = adjuntosDesdeValor(v);
      } else if (campo.tipo === 'lista') {
        camposLista[campo.nombre] = valorALista(v);
      } else {
        camposTexto[campo.nombre] = v != null ? String(v) : '';
      }
    }
  } else {
    for (const [k, v] of Object.entries(modoEdicion.frontmatter)) {
      if (CAMPOS_BASE.has(k)) continue;
      if (k === 'adjuntos') {
        adjuntos = adjuntosDesdeValor(v);
      } else if (Array.isArray(v)) {
        camposLista[k] = valorALista(v);
      } else {
        camposTexto[k] = v != null ? String(v) : '';
      }
    }
  }

  const relacionados = valorALista(modoEdicion.frontmatter['relacionados']);

  return { camposTexto, camposLista, adjuntos, relacionados };
}

export function useFormularioRecurso(modoEdicion?: PayloadRecurso) {
  const [plantillas, setPlantillas] = useState<Record<string, PlantillaTipo>>({});
  const [estado, setEstado] = useState<Estado>(() => {
    if (!modoEdicion) return ESTADO_INICIAL;
    return {
      tipo: modoEdicion.tipo,
      slug: modoEdicion.slug,
      titulo: modoEdicion.titulo,
      resumen: modoEdicion.resumen ?? '',
      camposTexto: {},
      camposLista: {},
      adjuntos: [],
      relacionados: [],
      cuerpo: modoEdicion.cuerpo,
    };
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  useEffect(() => {
    cargarPlantillas().then((p) => {
      setPlantillas(p);
      if (modoEdicion) {
        const campos = estadoDesdeEdicion(modoEdicion, p);
        setEstado((prev) => ({ ...prev, ...campos }));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // solo al montar: modoEdicion es estable (no cambia durante la vida del formulario)

  // En creación: precargar esqueleto al cambiar tipo
  useEffect(() => {
    if (modoEdicion) return;
    const plantilla = plantillas[estado.tipo];
    if (plantilla) {
      const camposTexto: Record<string, string> = {};
      const camposLista: Record<string, string[]> = {};
      for (const campo of plantilla.campos) {
        if (CAMPOS_BASE.has(campo.nombre)) continue;
        if (campo.tipo === 'lista') {
          camposLista[campo.nombre] = [];
        } else {
          camposTexto[campo.nombre] = '';
        }
      }
      setEstado((prev) => ({
        ...prev,
        cuerpo: plantilla.esqueletoMarkdown,
        camposTexto,
        camposLista,
        relacionados: [],
      }));
    }
  }, [estado.tipo, plantillas, modoEdicion]);

  function setTipo(tipo: string) { setEstado((p) => ({ ...p, tipo })); }
  function setSlug(slug: string) { setEstado((p) => ({ ...p, slug })); }
  function setTitulo(titulo: string) { setEstado((p) => ({ ...p, titulo })); }
  function setResumen(resumen: string) { setEstado((p) => ({ ...p, resumen })); }
  function setCuerpo(cuerpo: string) { setEstado((p) => ({ ...p, cuerpo })); }
  function setCampoTexto(nombre: string, valor: string) {
    setEstado((p) => ({ ...p, camposTexto: { ...p.camposTexto, [nombre]: valor } }));
  }
  function setCampoLista(nombre: string, valor: string[]) {
    setEstado((p) => ({ ...p, camposLista: { ...p.camposLista, [nombre]: valor } }));
  }
  function setRelacionados(ids: string[]) {
    setEstado((p) => ({ ...p, relacionados: ids }));
  }
  function setAdjuntos(adjuntos: Adjunto[]) {
    setEstado((p) => ({ ...p, adjuntos }));
  }

  async function submit() {
    setError(null);
    setEnviando(true);
    try {
      const frontmatter: Record<string, unknown> = {
        ...estado.camposTexto,
        ...estado.camposLista,
        adjuntos: estado.adjuntos,
        relacionados: estado.relacionados,
      };
      const payload: PayloadRecurso = {
        tipo: estado.tipo,
        slug: estado.slug,
        titulo: estado.titulo,
        resumen: estado.resumen,
        frontmatter,
        cuerpo: estado.cuerpo,
      };
      const resultado = modoEdicion ? await editarRecurso(payload) : await crearRecurso(payload);
      setPrUrl(resultado.pr_url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const plantillaActual = plantillas[estado.tipo] ?? null;

  return {
    estado, plantillaActual,
    setTipo, setSlug, setTitulo, setResumen, setCuerpo,
    setCampoTexto, setCampoLista, setRelacionados, setAdjuntos,
    enviando, error, prUrl, submit,
  };
}