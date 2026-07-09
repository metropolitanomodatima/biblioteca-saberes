import { useState, useEffect } from 'react';
import type { PlantillaTipo, PayloadRecurso } from '@/services/recursoEditor';
import { cargarPlantillas, crearRecurso, editarRecurso } from '@/services/recursoEditor';

interface Estado {
  tipo: string;
  slug: string;
  titulo: string;
  resumen: string;
  camposExtra: Record<string, string>;
  cuerpo: string;
}

const ESTADO_INICIAL: Estado = {
  tipo: 'concepto',
  slug: '',
  titulo: '',
  resumen: '',
  camposExtra: {},
  cuerpo: '',
};

export function useFormularioRecurso(modoEdicion?: PayloadRecurso) {
  const [plantillas, setPlantillas] = useState<Record<string, PlantillaTipo>>({});
  const [estado, setEstado] = useState<Estado>(
    modoEdicion
      ? {
          tipo: modoEdicion.tipo,
          slug: modoEdicion.slug,
          titulo: modoEdicion.titulo,
          resumen: modoEdicion.resumen ?? '',
          camposExtra: Object.fromEntries(
            Object.entries(modoEdicion.frontmatter).map(([k, v]) => [k, String(v ?? '')]),
          ),
          cuerpo: modoEdicion.cuerpo,
        }
      : ESTADO_INICIAL,
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  useEffect(() => {
    cargarPlantillas().then(setPlantillas).catch(() => {});
  }, []);

  // Cuando cambia el tipo en modo creación, precargar esqueleto de cuerpo
  useEffect(() => {
    if (modoEdicion) return;
    const plantilla = plantillas[estado.tipo];
    if (plantilla) {
      setEstado((prev) => ({ ...prev, cuerpo: plantilla.esqueletoMarkdown, camposExtra: {} }));
    }
  }, [estado.tipo, plantillas, modoEdicion]);

  function setTipo(tipo: string) { setEstado((p) => ({ ...p, tipo })); }
  function setSlug(slug: string) { setEstado((p) => ({ ...p, slug })); }
  function setTitulo(titulo: string) { setEstado((p) => ({ ...p, titulo })); }
  function setResumen(resumen: string) { setEstado((p) => ({ ...p, resumen })); }
  function setCuerpo(cuerpo: string) { setEstado((p) => ({ ...p, cuerpo })); }
  function setCampoExtra(nombre: string, valor: string) {
    setEstado((p) => ({ ...p, camposExtra: { ...p.camposExtra, [nombre]: valor } }));
  }

  async function submit() {
    setError(null);
    setEnviando(true);
    try {
      const payload: PayloadRecurso = {
        tipo: estado.tipo,
        slug: estado.slug,
        titulo: estado.titulo,
        resumen: estado.resumen,
        frontmatter: estado.camposExtra,
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
    setTipo, setSlug, setTitulo, setResumen, setCuerpo, setCampoExtra,
    enviando, error, prUrl, submit,
  };
}