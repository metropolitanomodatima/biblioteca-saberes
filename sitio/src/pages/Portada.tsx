import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Buscador from '@/components/Buscador';
import TarjetaRecurso from '@/components/TarjetaRecurso';
import Cargando from '@/components/Cargando';
import ErrorMensaje from '@/components/ErrorMensaje';
import { CATEGORIAS_PORTADA, buscarCategoria } from '@/types/recurso';
import type { EntradaIndice, Indice } from '@/types/recurso';
import { cargarIndice, destacados, recientes } from '@/services/indice';
import { useTiposVisibles } from '@/controllers/useTiposVisibles';

export default function Portada() {
  const tiposVisibles = useTiposVisibles();
  const [indice, setIndice] = useState<Indice | null>(null);
  const [top, setTop] = useState<EntradaIndice[]>([]);
  const [ultimos, setUltimos] = useState<EntradaIndice[]>([]);
  const [error, setError] = useState<string | null>(null);

  function filtrar(lista: EntradaIndice[]): EntradaIndice[] {
    if (tiposVisibles == null) return lista;
    return lista.filter((r) => (tiposVisibles as string[]).includes(r.tipo));
  }

  useEffect(() => {
    Promise.all([cargarIndice(), destacados(4), recientes(6)])
      .then(([i, d, r]) => {
        setIndice(i);
        setTop(d);
        setUltimos(r);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMensaje mensaje={error} />;
  if (!indice) return <Cargando texto="Cargando la biblioteca de saberes…" />;

  return (
    <div className="space-y-10 sm:space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rio-700 via-rio-600 to-alerce-600 text-white shadow-lg">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <pattern id="lineas" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 8L8 0" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#lineas)" />
          </svg>
        </div>
        <div className="relative px-5 py-10 sm:px-12 sm:py-20 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Biblioteca digital viva
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
            Conocimiento para la justicia socioambiental
          </h1>
          <p className="mt-4 text-lg text-white/90 leading-relaxed">
            Un espacio comunitario donde consultar argumentarios, campañas, cuencas, leyes y
            memoria de los territorios. Contenido abierto, riguroso y colaborativo.
          </p>
          <div className="mt-8">
            <Buscador destacado />
          </div>
          <p className="mt-4 text-sm text-white/80">
            {indice.total} recursos publicados · actualizado el {indice.generado_en.slice(0, 10)}
          </p>
        </div>
      </section>

      <section aria-labelledby="categorias">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="categorias" className="font-serif text-2xl font-bold text-tierra-900">
              Explorar por categoría
            </h2>
            <p className="text-tierra-600">Encuentra el conocimiento según su forma.</p>
          </div>
          <Link to="/buscar" className="text-sm text-rio-700 hover:text-rio-500">
            Ver todo →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIAS_PORTADA.filter((tipo) => !tiposVisibles || (tiposVisibles as string[]).includes(tipo)).map((tipo) => {
            const c = buscarCategoria(tipo)!;
            const total = indice.por_tipo[tipo] ?? 0;
            return (
              <Link
                key={tipo}
                to={c.ruta}
                className="group flex flex-col rounded-2xl border border-tierra-200 bg-white p-6 no-underline transition hover:-translate-y-0.5 hover:border-rio-400 hover:shadow-md"
              >
                <span className="text-xs uppercase tracking-widest text-rio-700">{total} recursos</span>
                <span className="mt-2 font-serif text-xl font-semibold text-tierra-900 group-hover:text-rio-700">
                  {c.etiquetaPlural}
                </span>
                <span className="mt-2 text-sm text-tierra-600">{c.descripcion}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {top.length > 0 && (
        <section aria-labelledby="destacados">
          <div className="mb-6 flex items-end justify-between">
            <h2 id="destacados" className="font-serif text-2xl font-bold text-tierra-900">
              Recursos destacados
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtrar(top).map((r) => (
              <TarjetaRecurso key={r.id} recurso={r} />
            ))}
          </div>
        </section>
      )}

      {ultimos.length > 0 && (
        <section aria-labelledby="recientes">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="recientes" className="font-serif text-2xl font-bold text-tierra-900">
              Últimas actualizaciones
            </h2>
            <Link to="/buscar" className="text-sm text-rio-700 hover:text-rio-500">
              Buscador avanzado →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrar(ultimos).map((r) => (
              <TarjetaRecurso key={r.id} recurso={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
