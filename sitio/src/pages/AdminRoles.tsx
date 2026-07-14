import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRolPermitido } from '@/controllers/useRolPermitido';
import { useSesion } from '@/controllers/useSesion';
import type { Rol } from '@/types/sesion';
import { obtenerRoles, cambiarRol } from '@/services/adminRoles';
import Cargando from '@/components/Cargando';
import ErrorMensaje from '@/components/ErrorMensaje';

type EntradaUsuario = { login: string; rol: Rol };

const ETIQUETA_ROL: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
};

const COLORES_ROL: Record<string, string> = {
  admin: 'bg-rio-100 text-rio-800 border-rio-200',
  editor: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function AdminRoles() {
  const esAdmin = useRolPermitido('admin');
  const { sesion, cargando: cargandoSesion } = useSesion();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<EntradaUsuario[]>([]);
  const [miembrosOrg, setMiembrosOrg] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);

  // Estado del formulario de agregar usuario
  const [busqueda, setBusqueda] = useState('');
  const [rolNuevo, setRolNuevo] = useState<Exclude<Rol, 'militancia'>>('editor');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cargandoSesion) return;
    if (!esAdmin) { navigate('/'); return; }

    obtenerRoles()
      .then(({ admins, editores, miembros }) => {
        const todos = new Map<string, Rol>();
        admins.forEach((u) => todos.set(u, 'admin'));
        editores.forEach((u) => todos.set(u, 'editor'));
        setUsuarios(Array.from(todos.entries()).map(([login, rol]) => ({ login, rol })));
        setMiembrosOrg(miembros);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setCargando(false));
  }, [esAdmin, cargandoSesion, navigate]);

  // Filtra sugerencias excluyendo usuarios ya en la tabla
  useEffect(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) { setSugerencias([]); return; }
    const enTabla = new Set(usuarios.map((u) => u.login.toLowerCase()));
    setSugerencias(
      miembrosOrg
        .filter((m) => m.toLowerCase().includes(q) && !enTabla.has(m.toLowerCase()))
        .slice(0, 8)
    );
    setSugerenciaActiva(-1);
  }, [busqueda, miembrosOrg, usuarios]);

  function seleccionarSugerencia(login: string) {
    setBusqueda(login);
    setSugerencias([]);
    inputRef.current?.focus();
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    const login = busqueda.trim();
    if (!login) return;

    const esMiembro = miembrosOrg.some((m) => m.toLowerCase() === login.toLowerCase());
    if (!esMiembro) {
      setErrorCambio(`@${login} no es miembro de la organización.`);
      return;
    }
    const loginReal = miembrosOrg.find((m) => m.toLowerCase() === login.toLowerCase())!;
    await ejecutarCambioRol(loginReal, rolNuevo, true);
  }

  async function handleCambioRol(login: string, nuevoRol: Rol) {
    await ejecutarCambioRol(login, nuevoRol, false);
  }

  async function ejecutarCambioRol(login: string, nuevoRol: Rol, esNuevo: boolean) {
    setGuardando(login);
    setPrUrl(null);
    setErrorCambio(null);
    try {
      const resultado = await cambiarRol(login, nuevoRol);
      setPrUrl(resultado.pr_url);
      setUsuarios((prev) => {
        const existe = prev.find((u) => u.login === login);
        if (nuevoRol === 'militancia') return prev.filter((u) => u.login !== login);
        if (existe) return prev.map((u) => (u.login === login ? { ...u, rol: nuevoRol } : u));
        return [...prev, { login, rol: nuevoRol }];
      });
      if (esNuevo) setBusqueda('');
    } catch (e) {
      setErrorCambio((e as Error).message);
    } finally {
      setGuardando(null);
    }
  }

  if (cargandoSesion || cargando) return <Cargando texto="Cargando gestión de roles…" />;
  if (error) return <ErrorMensaje mensaje={error} />;

  const loginsBusquedaNormalizado = busqueda.trim().toLowerCase();
  const coincideExacto = miembrosOrg.some(
    (m) => m.toLowerCase() === loginsBusquedaNormalizado
  );
  const yaEnTabla = usuarios.some(
    (u) => u.login.toLowerCase() === loginsBusquedaNormalizado
  );

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-tierra-900">Gestión de roles</h1>
        <p className="mt-2 text-tierra-600">
          Los cambios crean un Pull Request en GitHub que debe ser mergeado para tener efecto.
        </p>
      </header>

      {/* Formulario para agregar usuario */}
      <form
        onSubmit={handleAgregar}
        className="mb-8 rounded-xl border border-tierra-200 bg-tierra-50 p-5"
      >
        <p className="mb-3 text-sm font-medium text-tierra-800">Agregar miembro de la organización</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (sugerencias.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSugerenciaActiva((i) => Math.min(i + 1, sugerencias.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSugerenciaActiva((i) => Math.max(i - 1, -1));
                } else if (e.key === 'Enter' && sugerenciaActiva >= 0) {
                  e.preventDefault();
                  seleccionarSugerencia(sugerencias[sugerenciaActiva]);
                } else if (e.key === 'Escape') {
                  setSugerencias([]);
                }
              }}
              placeholder="Buscar por nombre de usuario…"
              autoComplete="off"
              className="w-full rounded-md border border-tierra-200 bg-white px-3 py-2 text-sm text-tierra-900 placeholder:text-tierra-400 focus:border-rio-400 focus:outline-none"
            />
            {sugerencias.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-tierra-200 bg-white shadow-lg">
                {sugerencias.map((s, i) => (
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); seleccionarSugerencia(s); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                        i === sugerenciaActiva
                          ? 'bg-rio-50 text-rio-800'
                          : 'text-tierra-800 hover:bg-tierra-50'
                      }`}
                    >
                      <img
                        src={`https://github.com/${s}.png?size=24`}
                        alt=""
                        className="h-5 w-5 rounded-full shrink-0"
                      />
                      @{s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select
            value={rolNuevo}
            onChange={(e) => setRolNuevo(e.target.value as Exclude<Rol, 'militancia'>)}
            className="rounded-md border border-tierra-200 bg-white px-2 py-2 text-sm text-tierra-700 focus:border-rio-400 focus:outline-none"
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={
              !busqueda.trim() ||
              !coincideExacto ||
              yaEnTabla ||
              guardando === busqueda.trim()
            }
            className="rounded-md bg-rio-600 px-4 py-2 text-sm font-medium text-white hover:bg-rio-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {guardando === busqueda.trim() ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
        {busqueda.trim() && !coincideExacto && sugerencias.length === 0 && (
          <p className="mt-2 text-xs text-red-600">
            @{busqueda.trim()} no es miembro de la organización.
          </p>
        )}
        {busqueda.trim() && yaEnTabla && (
          <p className="mt-2 text-xs text-tierra-500">
            @{busqueda.trim()} ya tiene un rol asignado. Usa el selector en la tabla para cambiarlo.
          </p>
        )}
      </form>

      {prUrl && (
        <div className="mb-6 rounded-xl border border-rio-200 bg-rio-50 p-4 text-sm">
          <p className="font-medium text-rio-800">Pull Request creado correctamente.</p>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-rio-700 underline hover:text-rio-900"
          >
            {prUrl}
          </a>
        </div>
      )}

      {errorCambio && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorCambio}
        </div>
      )}

      {usuarios.length === 0 ? (
        <p className="text-tierra-500">
          No hay usuarios con rol explícito. Los miembros de la organización sin asignación tienen rol{' '}
          <strong>Militancia</strong> por defecto.
        </p>
      ) : (
        <ul className="divide-y divide-tierra-100 rounded-xl border border-tierra-200 bg-white">
          {usuarios.map(({ login, rol }) => {
            const esMismoUsuario = login === sesion?.login;
            return (
              <li key={login} className="flex items-center gap-4 px-5 py-4">
                <img
                  src={`https://github.com/${login}.png?size=40`}
                  alt={login}
                  className="h-9 w-9 rounded-full shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://github.com/${login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-tierra-900 hover:text-rio-700 no-underline"
                  >
                    @{login}
                  </a>
                  {esMismoUsuario && (
                    <span className="ml-2 text-xs text-tierra-400">(tú)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLORES_ROL[rol]}`}
                  >
                    {ETIQUETA_ROL[rol]}
                  </span>
                  {!esMismoUsuario && (
                    <select
                      value={rol}
                      disabled={guardando === login}
                      onChange={(e) => handleCambioRol(login, e.target.value as Rol)}
                      className="rounded-md border border-tierra-200 bg-white px-2 py-1 text-sm text-tierra-700 hover:border-tierra-300 focus:border-rio-400 focus:outline-none disabled:opacity-50"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {guardando === login && (
                    <span className="text-xs text-tierra-400 animate-pulse">Guardando…</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-tierra-400">
        Los miembros de la organización que no aparecen en esta tabla tienen rol{' '}
        <strong>Militancia</strong> por defecto.
      </p>
    </div>
  );
}