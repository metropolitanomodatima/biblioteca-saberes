import { useEffect, useState } from 'react';
import type { RecursoCompleto } from '@/types/recurso';
import { cargarIndice } from '@/services/indice';
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

function formatearFecha(iso: string): string {
  const [yyyy, mm, dd] = iso.split('-');
  if (!yyyy || !mm || !dd) return iso;
  return `${dd}/${mm}/${yyyy}`;
}

export default function Metadatos({ recurso }: Props) {
  const [nombresPorId, setNombresPorId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recurso.tipo !== 'conflicto' || recurso.territorios.length === 0) return;
    cargarIndice().then((idx) => {
      const mapa: Record<string, string> = {};
      for (const r of idx.recursos) mapa[r.id] = r.titulo;
      setNombresPorId(mapa);
    }).catch(() => {});
  }, [recurso.tipo, recurso.territorios]);

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
        {recurso.tipo === 'evento' && recurso.fecha_inicio && (
          <Fila etiqueta="Fecha inicio">{formatearFecha(recurso.fecha_inicio)}{recurso.hora_inicio ? `, ${recurso.hora_inicio}` : ''}</Fila>
        )}
        {recurso.tipo === 'evento' && recurso.fecha_fin && (
          <Fila etiqueta="Fecha fin">{formatearFecha(recurso.fecha_fin)}{recurso.hora_fin ? `, ${recurso.hora_fin}` : ''}</Fila>
        )}
        {recurso.tipo === 'evento' && recurso.ubicacion && (
          <Fila etiqueta="Ubicación">{recurso.ubicacion}</Fila>
        )}
        {recurso.nivel && <Fila etiqueta="Nivel">{recurso.nivel}</Fila>}
        {recurso.publico.length > 0 && (
          <Fila etiqueta="Público">{recurso.publico.join(', ')}</Fila>
        )}
        {recurso.licencia && <Fila etiqueta="Licencia">{recurso.licencia}</Fila>}

        {recurso.territorios.length > 0 && (
          <Fila etiqueta="Territorios">
            <div className="flex flex-wrap gap-1.5">
              {recurso.territorios.map((t) => (
                <Etiqueta
                  key={t}
                  texto={nombresPorId[t] ?? t}
                  tipo="territorio"
                  href={`/recurso/${encodeURIComponent(t)}`}
                />
              ))}
            </div>
          </Fila>
        )}

        {recurso.tipo === 'conflicto' && recurso.actores.length > 0 && (
          <Fila etiqueta="Actores">
            <ul className="space-y-1 list-disc pl-4">
              {recurso.actores.map((a) => (
                <li key={a} className="break-words">{a}</li>
              ))}
            </ul>
          </Fila>
        )}

        {recurso.temas.length > 0 && (
          <Fila etiqueta="Temas">
            <div className="flex flex-wrap gap-1.5">
              {recurso.temas.map((t) => (
                <Etiqueta key={t} texto={t} tipo="tema" href={`/buscar?tema=${encodeURIComponent(t)}`} />
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
            <ol className="space-y-2 list-decimal pl-5 text-xs leading-relaxed marker:text-tierra-400">
              {recurso.fuentes.map((f) => (
                <li key={f} className="break-words">
                  <FuenteTexto texto={f.trim()} />
                </li>
              ))}
            </ol>
          </Fila>
        )}
      </dl>
    </aside>
  );
}

function acortarUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  try {
    const u = new URL(url);
    const base = u.hostname.replace(/^www\./, '') + u.pathname;
    if (base.length <= max) return base;
    return base.slice(0, max - 1) + '…';
  } catch {
    return url.slice(0, max - 1) + '…';
  }
}

const RE_URL = /https?:\/\/[^\s)]+/g;

function FuenteTexto({ texto }: { texto: string }) {
  const partes: (string | { url: string })[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(RE_URL)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) partes.push(texto.slice(ultimo, inicio));
    partes.push({ url: m[0] });
    ultimo = inicio + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  if (partes.length === 0) partes.push(texto);

  return (
    <>
      {partes.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rio-700 underline decoration-rio-300 hover:text-rio-500 hover:decoration-rio-500 break-all"
          >
            {acortarUrl(p.url)}
          </a>
        ),
      )}
    </>
  );
}
