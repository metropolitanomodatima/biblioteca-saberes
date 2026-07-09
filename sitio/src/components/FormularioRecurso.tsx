import { CATEGORIAS } from '@/types/recurso';
import type { PayloadRecurso } from '@/services/recursoEditor';
import { useFormularioRecurso } from '@/controllers/useFormularioRecurso';

const CAMPOS_BASE = new Set(['id', 'titulo', 'tipo', 'resumen']);

interface Props {
  modoEdicion?: PayloadRecurso;
}

export default function FormularioRecurso({ modoEdicion }: Props) {
  const {
    estado, plantillaActual,
    setTipo, setSlug, setTitulo, setResumen, setCuerpo, setCampoExtra,
    enviando, error, prUrl, submit,
  } = useFormularioRecurso(modoEdicion);

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

  const camposExtras = plantillaActual?.campos.filter((c) => !CAMPOS_BASE.has(c.nombre)) ?? [];

  return (
    <form
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

      {/* Campos extra del tipo */}
      {camposExtras.length > 0 && (
        <div className="space-y-4 rounded-lg border border-tierra-100 bg-tierra-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-tierra-500">
            Metadatos de {estado.tipo}
          </p>
          {camposExtras.map((campo) => (
            <div key={campo.nombre}>
              <label className="mb-1 block text-sm font-medium text-tierra-700">
                {campo.nombre}{campo.requerido ? ' *' : ''}
              </label>
              {campo.tipo === 'textarea' ? (
                <textarea
                  value={estado.camposExtra[campo.nombre] ?? ''}
                  onChange={(e) => setCampoExtra(campo.nombre, e.target.value)}
                  rows={3}
                  required={campo.requerido}
                  className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type={campo.tipo === 'fecha' ? 'date' : 'text'}
                  value={estado.camposExtra[campo.nombre] ?? ''}
                  onChange={(e) => setCampoExtra(campo.nombre, e.target.value)}
                  required={campo.requerido}
                  className="w-full rounded-md border border-tierra-300 px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

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

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-rio-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rio-700 disabled:opacity-50"
      >
        {enviando ? 'Enviando…' : modoEdicion ? 'Guardar cambios' : 'Crear recurso'}
      </button>
    </form>
  );
}