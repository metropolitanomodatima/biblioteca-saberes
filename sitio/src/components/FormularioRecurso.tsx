import { useEffect, useRef, useState } from 'react';
import { CATEGORIAS } from '@/types/recurso';
import type { EntradaIndice } from '@/types/recurso';
import type { PayloadRecurso } from '@/services/recursoEditor';
import { useFormularioRecurso } from '@/controllers/useFormularioRecurso';
import { cargarIndice } from '@/services/indice';
import RenderizadorMarkdown from '@/components/RenderizadorMarkdown';

const CAMPOS_TEMAS = new Set(['temas', 'tema']);

const CAMPOS_BASE = new Set(['id', 'titulo', 'tipo', 'resumen', 'relacionados']);

interface Props {
  modoEdicion?: PayloadRecurso;
  onCancelar?: () => void;
}

// ── Campo de lista (chips) ─────────────────────────────────────────────────
function CampoLista({
  nombre, valores, onChange, sugerencias = [],
}: { nombre: string; valores: string[]; onChange: (v: string[]) => void; sugerencias?: string[] }) {
  const [input, setInput] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function agregar(valor: string) {
    const v = valor.trim();
    if (v && !valores.includes(v)) onChange([...valores, v]);
    setInput('');
    setMostrarSugerencias(false);
    inputRef.current?.focus();
  }

  const filtradas = sugerencias.filter(
    (s) => !valores.includes(s) && s.toLowerCase().includes(input.trim().toLowerCase()),
  );
  const mostrar = mostrarSugerencias && filtradas.length > 0;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {valores.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-tierra-100 px-2.5 py-0.5 text-xs text-tierra-700"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(valores.filter((x) => x !== v))}
              className="text-tierra-400 hover:text-red-500 leading-none"
              aria-label={`Quitar ${v}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setMostrarSugerencias(true); }}
            onFocus={() => setMostrarSugerencias(true)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); agregar(input); }
              if (e.key === 'Escape') setMostrarSugerencias(false);
            }}
            placeholder={`Agregar ${nombre}…`}
            className="w-full rounded-md border border-tierra-300 px-3 py-1.5 text-sm focus:border-rio-500 focus:outline-none"
          />
          {mostrar && (
            <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-tierra-200 bg-white shadow-lg">
              {filtradas.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); agregar(s); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-tierra-800 hover:bg-tierra-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => agregar(input)}
          disabled={!input.trim()}
          className="rounded-md border border-tierra-300 px-3 py-1.5 text-sm text-tierra-600 hover:border-rio-400 hover:text-rio-700 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Selector de recursos relacionados ─────────────────────────────────────
function SelectorRelacionados({
  seleccionados, onChange,
}: { seleccionados: string[]; onChange: (ids: string[]) => void }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<EntradaIndice[]>([]);
  const [todos, setTodos] = useState<EntradaIndice[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarIndice().then((idx) => setTodos(idx.recursos)).catch(() => {});
  }, []);

  useEffect(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) { setResultados([]); return; }
    const selSet = new Set(seleccionados);
    setResultados(
      todos
        .filter((r) => !selSet.has(r.id) && (r.titulo.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)))
        .slice(0, 8)
    );
  }, [busqueda, todos, seleccionados]);

  const seleccionadosInfo = seleccionados
    .map((id) => todos.find((r) => r.id === id))
    .filter((r): r is EntradaIndice => r !== undefined);

  function agregar(r: EntradaIndice) {
    onChange([...seleccionados, r.id]);
    setBusqueda('');
    setResultados([]);
    inputRef.current?.focus();
  }

  function quitar(id: string) {
    onChange(seleccionados.filter((x) => x !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {seleccionadosInfo.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1 rounded-full bg-rio-100 px-2.5 py-0.5 text-xs text-rio-800"
          >
            {r.titulo}
            <button
              type="button"
              onClick={() => quitar(r.id)}
              className="text-rio-400 hover:text-red-500 leading-none"
              aria-label={`Quitar ${r.titulo}`}
            >
              ×
            </button>
          </span>
        ))}
        {seleccionados.filter((id) => !todos.find((r) => r.id === id)).map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full bg-tierra-100 px-2.5 py-0.5 text-xs text-tierra-500"
          >
            {id}
            <button
              type="button"
              onClick={() => quitar(id)}
              className="hover:text-red-500 leading-none"
              aria-label={`Quitar ${id}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar recurso por título o id…"
          className="w-full rounded-md border border-tierra-300 px-3 py-1.5 text-sm focus:border-rio-500 focus:outline-none"
        />
        {resultados.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-tierra-200 bg-white shadow-lg">
            {resultados.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); agregar(r); }}
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-tierra-50"
                >
                  <span className="text-sm font-medium text-tierra-900">{r.titulo}</span>
                  <span className="text-xs text-tierra-400">{r.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Formulario principal ───────────────────────────────────────────────────
export default function FormularioRecurso({ modoEdicion, onCancelar }: Props) {
  const {
    estado, plantillaActual,
    setTipo, setSlug, setTitulo, setResumen, setCuerpo,
    setCampoTexto, setCampoLista, setRelacionados,
    enviando, error, prUrl, submit,
  } = useFormularioRecurso(modoEdicion);

  const [pestana, setPestana] = useState<'editar' | 'previa'>('editar');
  const [temasExistentes, setTemasExistentes] = useState<string[]>([]);

  useEffect(() => {
    cargarIndice().then((idx) => {
      const set = new Set<string>();
      for (const r of idx.recursos) {
        for (const t of r.temas) if (t) set.add(t);
      }
      setTemasExistentes([...set].sort((a, b) => a.localeCompare(b, 'es')));
    }).catch(() => {});
  }, []);

  if (prUrl) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-800">¡Recurso enviado para revisión!</p>
        <p className="mt-2 text-sm text-green-700">Se abrió un Pull Request en GitHub con los cambios.</p>
        <a
          href={prUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 no-underline"
        >
          Ver Pull Request →
        </a>
      </div>
    );
  }

  const camposExtra = plantillaActual?.campos.filter((c) => !CAMPOS_BASE.has(c.nombre)) ?? [];
  const camposTextoPlantilla = camposExtra.filter((c) => c.tipo !== 'lista');
  const camposListaPlantilla = camposExtra.filter((c) => c.tipo === 'lista');

  const tabClass = (tab: 'editar' | 'previa') =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      pestana === tab
        ? 'border-rio-600 text-rio-700'
        : 'border-transparent text-tierra-500 hover:text-tierra-800'
    }`;

  return (
    <div>
      {/* Pestañas */}
      <div className="mb-6 flex gap-1 border-b border-tierra-200">
        <button type="button" className={tabClass('editar')} onClick={() => setPestana('editar')}>
          Editar
        </button>
        <button type="button" className={tabClass('previa')} onClick={() => setPestana('previa')}>
          Vista previa
        </button>
      </div>

      {/* Vista previa */}
      {pestana === 'previa' && (
        <div>
          <h1 className="font-serif text-3xl font-bold leading-tight text-tierra-900 mb-2">
            {estado.titulo || <span className="text-tierra-300">Sin título</span>}
          </h1>
          {estado.resumen && (
            <p className="mt-2 mb-6 text-lg leading-relaxed text-tierra-700">{estado.resumen}</p>
          )}
          <RenderizadorMarkdown contenido={estado.cuerpo} />
        </div>
      )}

    <form
      style={{ display: pestana === 'editar' ? undefined : 'none' }}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="space-y-6"
    >
      {/* Tipo */}
      {!modoEdicion && (
        <div>
          <label className="mb-1 block text-sm font-medium text-tierra-800">Tipo de recurso *</label>
          <select
            value={estado.tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm focus:border-rio-500 focus:outline-none"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.tipo} value={c.tipo}>{c.etiqueta}</option>
            ))}
          </select>
        </div>
      )}

      {/* Slug */}
      {!modoEdicion && (
        <div>
          <label className="mb-1 block text-sm font-medium text-tierra-800">
            Identificador (slug) *
            <span className="ml-1 text-xs font-normal text-tierra-500">solo letras, números y guiones</span>
          </label>
          <input
            type="text"
            value={estado.slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            pattern="[a-z0-9-]+"
            required
            placeholder="nombre-del-recurso"
            className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm focus:border-rio-500 focus:outline-none"
          />
        </div>
      )}

      {/* Título */}
      <div>
        <label className="mb-1 block text-sm font-medium text-tierra-800">Título *</label>
        <input
          type="text"
          value={estado.titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm focus:border-rio-500 focus:outline-none"
        />
      </div>

      {/* Resumen */}
      <div>
        <label className="mb-1 block text-sm font-medium text-tierra-800">Resumen</label>
        <textarea
          value={estado.resumen}
          onChange={(e) => setResumen(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm focus:border-rio-500 focus:outline-none"
        />
      </div>

      {/* Cuerpo */}
      <div>
        <label className="mb-1 block text-sm font-medium text-tierra-800">
          Contenido (Markdown)
        </label>
        <textarea
          value={estado.cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          rows={20}
          className="w-full rounded-md border border-tierra-300 px-3 py-2 font-mono text-sm focus:border-rio-500 focus:outline-none"
          placeholder="Escribe el contenido en formato Markdown…"
        />
      </div>

      {/* Campos de texto del tipo */}
      {camposTextoPlantilla.length > 0 && (
        <div className="space-y-4 rounded-lg border border-tierra-100 bg-tierra-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-tierra-500">
            Metadatos de {estado.tipo}
          </p>
          {camposTextoPlantilla.map((campo) => (
            <div key={campo.nombre}>
              <label className="mb-1 block text-sm font-medium text-tierra-700">
                {campo.nombre}{campo.requerido ? ' *' : ''}
              </label>
              {campo.tipo === 'textarea' ? (
                <textarea
                  value={estado.camposTexto[campo.nombre] ?? ''}
                  onChange={(e) => setCampoTexto(campo.nombre, e.target.value)}
                  rows={3}
                  required={campo.requerido}
                  className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type={campo.tipo === 'fecha' ? 'date' : 'text'}
                  value={estado.camposTexto[campo.nombre] ?? ''}
                  onChange={(e) => setCampoTexto(campo.nombre, e.target.value)}
                  required={campo.requerido}
                  className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Campos de lista del tipo */}
      {camposListaPlantilla.length > 0 && (
        <div className="space-y-4 rounded-lg border border-tierra-100 bg-tierra-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-tierra-500">
            Listas de {estado.tipo}
          </p>
          {camposListaPlantilla.map((campo) => (
            <div key={campo.nombre}>
              <label className="mb-1 block text-sm font-medium text-tierra-700">
                {campo.nombre}
              </label>
              <CampoLista
                nombre={campo.nombre}
                valores={estado.camposLista[campo.nombre] ?? []}
                onChange={(v) => setCampoLista(campo.nombre, v)}
                sugerencias={CAMPOS_TEMAS.has(campo.nombre) ? temasExistentes : []}
              />
            </div>
          ))}
        </div>
      )}

      {/* Recursos relacionados */}
      <div className="rounded-lg border border-tierra-100 bg-tierra-50 p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-tierra-500">
          Recursos relacionados
        </label>
        <SelectorRelacionados
          seleccionados={estado.relacionados}
          onChange={setRelacionados}
        />
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-rio-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rio-700 disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : modoEdicion ? 'Guardar cambios' : 'Crear recurso'}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="rounded-md border border-tierra-300 px-6 py-2.5 text-sm font-semibold text-tierra-600 hover:border-tierra-400 hover:text-tierra-800 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
    </div>
  );
}