import type { RecursoCompleto } from '@/types/recurso';
import Etiqueta from './Etiqueta';

interface Props {
  recurso: RecursoCompleto;
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-tierra-100 last:border-none sm:grid sm:grid-cols-[max-content_1fr] sm:gap-x-4 sm:gap-y-0">
      <dt className="text-xs uppercase tracking-wider text-tierra-500 sm:pt-0.5">{etiqueta}</dt>
      <dd className="text-sm text-tierra-800 min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function Metadatos({ recurso }: Props) {
  return (
    <aside
      aria-label="Metadatos del recurso"
      className="rounded-xl border border-tierra-200 bg-white p-5"
    >
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-tierra-500">
        Metadatos
      </h2>
      <dl>
        {recurso.enlace && (
          <Fila etiqueta="Enlace">
            <a
              href={recurso.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rio-700 underline hover:text-rio-500 break-all"
            >
              {recurso.enlace}
            </a>
          </Fila>
        )}
        {recurso.nivel && <Fila etiqueta="Nivel">{recurso.nivel}</Fila>}
        {recurso.publico.length > 0 && (
          <Fila etiqueta="Público">{recurso.publico.join(', ')}</Fila>
        )}
        {recurso.licencia && <Fila etiqueta="Licencia">{recurso.licencia}</Fila>}

        {recurso.temas.length > 0 && (
          <Fila etiqueta="Temas">
            <div className="flex flex-wrap gap-1.5">
              {recurso.temas.map((t) => (
                <Etiqueta key={t} texto={t} tipo="tema" href={`/buscar?tema=${encodeURIComponent(t)}`} />
              ))}
            </div>
          </Fila>
        )}

        {recurso.territorios.length > 0 && (
          <Fila etiqueta="Territorios">
            <div className="flex flex-wrap gap-1.5">
              {recurso.territorios.map((t) => (
                <Etiqueta
                  key={t}
                  texto={t}
                  tipo="territorio"
                  href={`/buscar?territorio=${encodeURIComponent(t)}`}
                />
              ))}
            </div>
          </Fila>
        )}

        {recurso.etiquetas.length > 0 && (
          <Fila etiqueta="Etiquetas">
            <div className="flex flex-wrap gap-1.5">
              {recurso.etiquetas.map((t) => (
                <Etiqueta key={t} texto={t} tipo="etiqueta" />
              ))}
            </div>
          </Fila>
        )}

        {recurso.fuentes.length > 0 && (
          <Fila etiqueta="Fuentes">
            <ul className="space-y-1 list-disc pl-4">
              {recurso.fuentes.map((f) => (
                <li key={f} className="break-words">
                  {f}
                </li>
              ))}
            </ul>
          </Fila>
        )}
      </dl>
    </aside>
  );
}
