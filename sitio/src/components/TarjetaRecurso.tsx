import { Link } from 'react-router-dom';
import type { EntradaIndice } from '@/types/recurso';
import { buscarCategoria } from '@/types/recurso';
import Etiqueta from './Etiqueta';

interface Props {
  recurso: EntradaIndice;
  compacta?: boolean;
}

export default function TarjetaRecurso({ recurso, compacta = false }: Props) {
  const categoria = buscarCategoria(recurso.tipo);
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-tierra-200 bg-white p-5 shadow-sm transition hover:border-rio-400 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Etiqueta texto={categoria?.etiqueta ?? recurso.tipo} tipo="tipo" />
      </div>

      <h3 className="font-serif text-lg font-semibold leading-snug text-tierra-900">
        <Link
          to={`/recurso/${encodeURIComponent(recurso.id)}`}
          className="no-underline before:absolute before:inset-0 group-hover:text-rio-700"
        >
          {recurso.titulo}
        </Link>
      </h3>

      {recurso.resumen && !compacta && (
        <p className="mt-2 text-sm leading-relaxed text-tierra-700 line-clamp-4">
          {recurso.resumen}
        </p>
      )}

      {!compacta && (recurso.temas.length > 0 || recurso.territorios.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-1.5 relative z-10">
          {recurso.temas.slice(0, 3).map((t) => (
            <Etiqueta key={`tema-${t}`} texto={t} tipo="tema" />
          ))}
          {recurso.territorios.slice(0, 2).map((t) => (
            <Etiqueta key={`terr-${t}`} texto={t} tipo="territorio" />
          ))}
        </div>
      )}

    </article>
  );
}
