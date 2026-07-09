import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cargando from '@/components/Cargando';
import ErrorMensaje from '@/components/ErrorMensaje';
import TarjetaRecurso from '@/components/TarjetaRecurso';
import Etiqueta from '@/components/Etiqueta';
import { buscarCategoriaPorSlug } from '@/types/recurso';
import type { EntradaIndice } from '@/types/recurso';
import { extraerFacetas, listarPorTipo } from '@/services/indice';
import { useTiposVisibles } from '@/controllers/useTiposVisibles';
import { urlLogin } from '@/services/sesion';

export default function Categoria() {
  const { slug = '' } = useParams();
  const tiposVisibles = useTiposVisibles();
  const categoria = buscarCategoriaPorSlug(slug);
  const [items, setItems] = useState<EntradaIndice[] | null>(null);
  const [filtroTema, setFiltroTema] = useState<string | null>(null);
  const [filtroTerritorio, setFiltroTerritorio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoria) return;
    setItems(null);
    setFiltroTema(null);
    setFiltroTerritorio(null);
    listarPorTipo(categoria.tipo)
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [categoria]);

  const facetas = useMemo(() => (items ? extraerFacetas(items) : null), [items]);

  const filtrados = useMemo(() => {
    if (!items) return null;
    return items.filter((r) => {
      if (filtroTema && !r.temas.includes(filtroTema)) return false;
      if (filtroTerritorio && !r.territorios.includes(filtroTerritorio)) return false;
      return true;
    });
  }, [items, filtroTema, filtroTerritorio]);

  if (!categoria) {
    return (
      <ErrorMensaje
        titulo="Categoría desconocida"
        mensaje={`No existe la categoría "${slug}".`}
      />
    );
  }

  if (tiposVisibles && !(tiposVisibles as string[]).includes(categoria.tipo)) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-tierra-700">
          Necesitas iniciar sesión para ver esta categoría.
        </p>
        <a
          href={urlLogin()}
          className="mt-4 inline-block rounded-md bg-rio-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rio-700 no-underline"
        >
          Iniciar sesión con GitHub
        </a>
      </div>
    );
  }
  if (error) return <ErrorMensaje mensaje={error} />;
  if (!items || !facetas || !filtrados) return <Cargando />;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-rio-700">Categoría</p>
        <h1 className="font-serif text-3xl font-bold text-tierra-900">{categoria.etiquetaPlural}</h1>
        <p className="mt-2 max-w-2xl text-tierra-600">{categoria.descripcion}</p>
        <p className="mt-1 text-sm text-tierra-500">
          {items.length} recurso{items.length === 1 ? '' : 's'} publicado
          {items.length === 1 ? '' : 's'}
        </p>
      </header>

      {(facetas.temas.length > 0 || facetas.territorios.length > 0) && (
        <section aria-label="Filtros" className="rounded-xl border border-tierra-200 bg-white p-4">
          {facetas.temas.length > 0 && (
            <div className="mb-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-tierra-500">
                Temas
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroTema(null)}
                  className={[
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    filtroTema == null
                      ? 'border-rio-500 bg-rio-50 text-rio-700'
                      : 'border-tierra-200 text-tierra-700 hover:border-rio-400',
                  ].join(' ')}
                >
                  Todos
                </button>
                {facetas.temas.map(({ valor, total }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltroTema(valor === filtroTema ? null : valor)}
                    className={[
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      valor === filtroTema
                        ? 'border-alerce-500 bg-alerce-100 text-alerce-800'
                        : 'border-tierra-200 text-tierra-700 hover:border-alerce-400',
                    ].join(' ')}
                  >
                    {valor} <span className="ml-1 text-tierra-500">({total})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {facetas.territorios.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-tierra-500">
                Territorios
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroTerritorio(null)}
                  className={[
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    filtroTerritorio == null
                      ? 'border-rio-500 bg-rio-50 text-rio-700'
                      : 'border-tierra-200 text-tierra-700 hover:border-rio-400',
                  ].join(' ')}
                >
                  Todos
                </button>
                {facetas.territorios.map(({ valor, total }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltroTerritorio(valor === filtroTerritorio ? null : valor)}
                    className={[
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      valor === filtroTerritorio
                        ? 'border-rio-500 bg-rio-100 text-rio-800'
                        : 'border-tierra-200 text-tierra-700 hover:border-rio-400',
                    ].join(' ')}
                  >
                    {valor} <span className="ml-1 text-tierra-500">({total})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-tierra-300 bg-white p-10 text-center">
          <p className="text-tierra-700">
            Aún no hay recursos publicados que coincidan con estos filtros.
          </p>
          <p className="mt-2 text-sm text-tierra-500">
            Puedes contribuir agregando un archivo Markdown en{' '}
            <code className="rounded bg-tierra-100 px-1">recursos/{categoria.slug}/</code>.
          </p>
          <Link
            to="/buscar"
            className="mt-4 inline-block text-sm font-semibold text-rio-700 hover:text-rio-500"
          >
            Buscar en otras categorías →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {filtroTema && (
              <Etiqueta texto={`Tema: ${filtroTema}`} tipo="tema" />
            )}
            {filtroTerritorio && (
              <Etiqueta texto={`Territorio: ${filtroTerritorio}`} tipo="territorio" />
            )}
            <span className="text-sm text-tierra-500">
              {filtrados.length} de {items.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((r) => (
              <TarjetaRecurso key={r.id} recurso={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
