import { Link } from 'react-router-dom';
import type { EntradaIndice } from '@/types/recurso';
import { buscarCategoria } from '@/types/recurso';
import Etiqueta from './Etiqueta';

interface Props {
  recurso: EntradaIndice;
}

export default function FilaRecurso({ recurso }: Props) {
  const categoria = buscarCategoria(recurso.tipo);
  return (
    <article className="group relative flex items-start gap-4 rounded-lg border border-tierra-200 bg-white px-4 py-3 shadow-sm transition hover:border-rio-400 hover:shadow-md">
      <div className="mt-0.5 shrink-0">
        <Etiqueta texto={categoria?.etiqueta ?? recurso.tipo} tipo="tipo" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-base font-semibold leading-snug text-tierra-900">
          <Link
            to={`/recurso/${encodeURIComponent(recurso.id)}`}
            className="no-underline before:absolute before:inset-0 group-hover:text-rio-700"
          >
            {recurso.titulo}
          </Link>
        </h3>
        {recurso.resumen && (
          <p className="mt-0.5 text-sm leading-relaxed text-tierra-600 line-clamp-1">
            {recurso.resumen}
          </p>
        )}
        {(recurso.temas.length > 0 || recurso.territorios.length > 0) && (
          <div className="mt-1.5 flex flex-wrap gap-1 relative z-10">
            {recurso.temas.slice(0, 3).map((t) => (
              <Etiqueta key={`tema-${t}`} texto={t} tipo="tema" />
            ))}
            {recurso.territorios.slice(0, 2).map((t) => (
              <Etiqueta key={`terr-${t}`} texto={t} tipo="territorio" />
            ))}
          </div>
        )}
      </div>

    </article>
  );
}