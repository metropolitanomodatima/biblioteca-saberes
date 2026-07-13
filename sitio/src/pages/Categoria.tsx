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
  const [filtroRegion, setFiltroRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usaRegion = categoria?.tipo === 'cuenca' || categoria?.tipo === 'territorio';

  useEffect(() => {
    if (!categoria || tiposVisibles === undefined) return;
    setItems(null);
    setFiltroTema(null);
    setFiltroTerritorio(null);
    setFiltroRegion(null);
    listarPorTipo(categoria.tipo)
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [categoria, tiposVisibles]);

  const facetas = useMemo(() => (items ? extraerFacetas(items) : null), [items]);

  const facetasRegion = useMemo(() => {
    if (!items || !usaRegion) return [];
    const conteo = new Map<string, number>();
    for (const r of items) {
      if (r.region) conteo.set(r.region, (conteo.get(r.region) ?? 0) + 1);
    }
    return Array.from(conteo.entries())
      .map(([valor, total]) => ({ valor, total }))
      .sort((a, b) => a.valor.localeCompare(b.valor, 'es'));
  }, [items, usaRegion]);

  const filtrados = useMemo(() => {
    if (!items) return null;
    return items.filter((r) => {
      if (filtroTema && !r.temas.includes(filtroTema)) return false;
      if (!usaRegion && filtroTerritorio && !r.territorios.includes(filtroTerritorio)) return false;
      if (usaRegion && filtroRegion && r.region !== filtroRegion) return false;
      return true;
    });
  }, [items, filtroTema, filtroTerritorio, filtroRegion, usaRegion]);

  const porRegion = useMemo(() => {
    if (!filtrados || !usaRegion) return null;
    const grupos = new Map<string, typeof filtrados>();
    for (const r of filtrados) {
      const clave = r.region ?? 'Sin región';
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave)!.push(r);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [filtrados, usaRegion]);

  if (!categoria) {
    return (
      <ErrorMensaje
        titulo="Categoría desconocida"
        mensaje={`No existe la categoría "${slug}".`}
      />
    );
  }

  if (tiposVisibles != null && !(tiposVisibles as string[]).includes(categoria.tipo)) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-tierra-700">
          Necesitas iniciar sesión para ver esta categoría.
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

      {(facetas.temas.length > 0 || (!usaRegion && facetas.territorios.length > 0) || facetasRegion.length > 0) && (
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

          {usaRegion && facetasRegion.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-tierra-500">
                Región
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroRegion(null)}
                  className={[
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    filtroRegion == null
                      ? 'border-rio-500 bg-rio-50 text-rio-700'
                      : 'border-tierra-200 text-tierra-700 hover:border-rio-400',
                  ].join(' ')}
                >
                  Todas
                </button>
                {facetasRegion.map(({ valor, total }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltroRegion(valor === filtroRegion ? null : valor)}
                    className={[
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      valor === filtroRegion
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

          {!usaRegion && facetas.territorios.length > 0 && (
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
            {!usaRegion && filtroTerritorio && (
              <Etiqueta texto={`Territorio: ${filtroTerritorio}`} tipo="territorio" />
            )}
            {usaRegion && filtroRegion && (
              <Etiqueta texto={`Región: ${filtroRegion}`} tipo="territorio" />
            )}
            <span className="text-sm text-tierra-500">
              {filtrados.length} de {items.length}
            </span>
          </div>
          {porRegion ? (
            <div className="space-y-10">
              {porRegion.map(([region, recursos]) => (
                <section key={region}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-tierra-500 border-b border-tierra-200 pb-1">
                    {region}
                    <span className="ml-2 font-normal normal-case text-tierra-400">({recursos.length})</span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recursos.map((r) => (
                      <TarjetaRecurso key={r.id} recurso={r} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((r) => (
                <TarjetaRecurso key={r.id} recurso={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
