import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/controllers/useSesion';
import { urlLogin } from '@/services/sesion';
import Dialogo from '@/components/Dialogo';

const ETIQUETA_ROL: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  militancia: 'Militancia',
};

export default function UsuarioMenu() {
  const { sesion, cargando, logout } = useSesion();
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  if (cargando) return <div className="h-8 w-8 rounded-full bg-tierra-200 animate-pulse" />;

  if (!sesion) {
    return (
      <a
        href={urlLogin()}
        className="flex items-center gap-2 rounded-md border border-tierra-300 px-3 py-1.5 text-sm text-tierra-700 hover:border-rio-400 hover:text-rio-700 no-underline"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Iniciar sesión con GitHub
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {sesion.rol !== 'militancia' && (
        <Link
          to="/nuevo"
          className="rounded-md bg-rio-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rio-700 no-underline"
        >
          + Nuevo recurso
        </Link>
      )}
      <div className="flex items-center gap-2 rounded-md border border-tierra-200 px-2 py-1">
        <img
          src={sesion.avatarUrl}
          alt={sesion.login}
          className="h-6 w-6 rounded-full"
        />
        <span className="hidden text-sm text-tierra-700 sm:block">
          {sesion.nombre ?? sesion.login}
        </span>
        <span className="rounded bg-tierra-100 px-1.5 py-0.5 text-xs text-tierra-500">
          {ETIQUETA_ROL[sesion.rol]}
        </span>
        <button
          onClick={() => setMostrarConfirm(true)}
          className="ml-1 text-xs text-tierra-400 hover:text-tierra-700"
          title="Cerrar sesión"
        >
          ✕
        </button>
      </div>

      {mostrarConfirm && (
        <Dialogo
          titulo="Cerrar sesión"
          mensaje="¿Seguro que quieres cerrar sesión?"
          labelConfirmar="Cerrar sesión"
          labelCancelar="Cancelar"
          onConfirmar={() => { setMostrarConfirm(false); logout(); }}
          onCancelar={() => setMostrarConfirm(false)}
        />
      )}
    </div>
  );
}