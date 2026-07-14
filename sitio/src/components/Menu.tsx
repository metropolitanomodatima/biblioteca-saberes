import { NavLink, Link } from 'react-router-dom';
import { CATEGORIAS } from '@/types/recurso';
import UsuarioMenu from '@/components/UsuarioMenu';
import { useTiposVisibles } from '@/controllers/useTiposVisibles';

const TIPOS_PUBLICOS = new Set(['concepto', 'territorio', 'cuenca', 'ley', 'conflicto']);

const enlacesPrincipales = [
  { ruta: '/', etiqueta: 'Inicio', exact: true },
  { ruta: '/buscar', etiqueta: 'Buscar' },
];

export default function Menu() {
  const tiposVisibles = useTiposVisibles();
  const categoriasFiltradas = CATEGORIAS.filter(
    (c) => tiposVisibles == null ? true : (tiposVisibles as string[]).includes(c.tipo),
  );

  return (
    <header className="border-b border-tierra-200 bg-tierra-50/95 backdrop-blur sticky top-0 z-30">
      <div className="contenedor flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
        <Link
          to="/"
          className="flex items-center gap-3 no-underline focus:no-underline"
          aria-label="Ir al inicio"
        >
          <span
            aria-hidden
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rio-600 text-tierra-50 font-serif text-lg font-bold"
          >
            BS
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-tierra-900">
              Biblioteca de Saberes
            </span>
            <span className="block text-xs uppercase tracking-widest text-rio-700">MODATIMA</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 text-sm">
            {enlacesPrincipales.map((e) => (
              <NavLink
                key={e.ruta}
                to={e.ruta}
                end={e.exact}
                className={({ isActive }) =>
                  [
                    'px-3 py-2 rounded-md no-underline',
                    isActive
                      ? 'bg-rio-100 text-rio-800 font-semibold'
                      : 'text-tierra-700 hover:bg-tierra-100',
                  ].join(' ')
                }
              >
                {e.etiqueta}
              </NavLink>
            ))}
          </nav>
          <UsuarioMenu />
        </div>
      </div>

      <div className="border-t border-tierra-100 bg-white">
        <div className="contenedor sin-scrollbar flex gap-2 overflow-x-auto py-2 text-xs">
          {categoriasFiltradas.filter((c) => TIPOS_PUBLICOS.has(c.tipo)).map((c) => (
            <NavLink
              key={c.tipo}
              to={c.ruta}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap px-3 py-1.5 rounded-full border transition no-underline',
                  isActive
                    ? 'border-rio-500 bg-rio-50 text-rio-800 font-semibold'
                    : 'border-tierra-200 text-tierra-700 hover:border-rio-300 hover:text-rio-700',
                ].join(' ')
              }
            >
              {c.etiquetaPlural}
            </NavLink>
          ))}

          {tiposVisibles === null && categoriasFiltradas.some((c) => !TIPOS_PUBLICOS.has(c.tipo)) && (
            <>
              <div className="mx-1 self-stretch w-px bg-tierra-200 shrink-0" />
              {categoriasFiltradas.filter((c) => !TIPOS_PUBLICOS.has(c.tipo)).map((c) => (
                <NavLink
                  key={c.tipo}
                  to={c.ruta}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap px-3 py-1.5 rounded-full border transition no-underline',
                      isActive
                        ? 'border-rio-500 bg-rio-50 text-rio-800 font-semibold'
                        : 'border-rio-400 bg-rio-600 text-white hover:bg-rio-700 hover:border-rio-700',
                    ].join(' ')
                  }
                >
                  {c.etiquetaPlural}
                </NavLink>
              ))}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
