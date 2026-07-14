import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cargando from '@/components/Cargando';
import ErrorMensaje from '@/components/ErrorMensaje';
import Metadatos from '@/components/Metadatos';
import Relacionados from '@/components/Relacionados';
import RenderizadorMarkdown from '@/components/RenderizadorMarkdown';
import Etiqueta from '@/components/Etiqueta';
import { buscarCategoria } from '@/types/recurso';
import type { RecursoCompleto } from '@/types/recurso';
import { cargarRecurso } from '@/services/recurso';
import { eliminarRecurso } from '@/services/recursoEditor';
import { useRolPermitido } from '@/controllers/useRolPermitido';
import { useTiposVisibles } from '@/controllers/useTiposVisibles';
import { urlLogin } from '@/services/sesion';
import { useNavigate } from 'react-router-dom';
import Dialogo from '@/components/Dialogo';

export default function Recurso() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const puedeEditar = useRolPermitido('editor');
  const esAdmin = useRolPermitido('admin');
  const tiposVisibles = useTiposVisibles();
  const [recurso, setRecurso] = useState<RecursoCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  async function confirmarEliminar() {
    if (!recurso) return;
    setMostrarConfirm(false);
    setEliminando(true);
    try {
      const slug = recurso.ruta.split('/').pop()?.replace(/\.md$/, '') ?? id;
      const resultado = await eliminarRecurso(recurso.tipo, slug);
      window.open(resultado.pr_url, '_blank');
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEliminando(false);
    }
  }

  useEffect(() => {
    setRecurso(null);
    setError(null);
    cargarRecurso(decodeURIComponent(id))
      .then(setRecurso)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorMensaje mensaje={error} />;
  if (!recurso) return <Cargando texto="Cargando recurso…" />;

  if (tiposVisibles != null && !(tiposVisibles as string[]).includes(recurso.tipo)) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-tierra-700">
          Necesitas iniciar sesión para ver este recurso.
        </p>
        <a
          href={urlLogin()}
          className="mt-4 inline-block rounded-md bg-rio-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rio-700 no-underline"
        >
          Autentícate
        </a>
      </div>
    );
  }

  const categoria = buscarCategoria(recurso.tipo);

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <nav aria-label="Migas" className="mb-4 text-sm text-tierra-500">
          <Link to="/" className="hover:text-rio-700">
            Inicio
          </Link>
          {categoria && (
            <>
              <span className="mx-2">›</span>
              <Link to={categoria.ruta} className="hover:text-rio-700">
                {categoria.etiquetaPlural}
              </Link>
            </>
          )}
        </nav>

        <header className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Etiqueta texto={categoria?.etiqueta ?? recurso.tipo} tipo="tipo" />
            {puedeEditar && (
              <Link
                to={`/editar/${encodeURIComponent(id)}`}
                className="ml-auto rounded-md border border-tierra-300 px-3 py-1 text-xs text-tierra-600 hover:border-rio-400 hover:text-rio-700 no-underline"
              >
                Editar
              </Link>
            )}
            {esAdmin && (
              <button
                onClick={() => setMostrarConfirm(true)}
                disabled={eliminando}
                className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
              >
                {eliminando ? 'Eliminando…' : 'Eliminar'}
              </button>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-tierra-900">
            {recurso.titulo}
          </h1>
          {recurso.resumen && (
            <p className="mt-3 text-lg leading-relaxed text-tierra-700">{recurso.resumen}</p>
          )}
        </header>

        <RenderizadorMarkdown contenido={recurso.contenido} />

        <div className="mt-10 rounded-xl border border-tierra-200 bg-tierra-50 p-4 text-sm text-tierra-600">
          <p>
            Fuente en el repositorio:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 border border-tierra-200">
              recursos/{recurso.ruta}
            </code>
          </p>
        </div>

        <div className="mt-10 space-y-10">
          <Relacionados ids={recurso.relacionados} />
        </div>
      </div>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <Metadatos recurso={recurso} />
      </div>

      {mostrarConfirm && (
        <Dialogo
          titulo="Eliminar recurso"
          mensaje={`¿Eliminar "${recurso.titulo}"? Se abrirá un Pull Request para revisión antes de que el cambio sea efectivo.`}
          labelConfirmar="Eliminar"
          labelCancelar="Cancelar"
          variante="peligro"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setMostrarConfirm(false)}
        />
      )}
    </article>
  );
}
