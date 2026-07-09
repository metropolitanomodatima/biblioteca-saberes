import { Link } from 'react-router-dom';
import { useSesion } from '@/controllers/useSesion';
import { tienePermiso } from '@/types/sesion';
import { urlLogin } from '@/services/sesion';
import FormularioRecurso from '@/components/FormularioRecurso';
import Cargando from '@/components/Cargando';

export default function Nuevo() {
  const { sesion, cargando } = useSesion();

  if (cargando) return <Cargando texto="Verificando sesión…" />;

  if (!sesion) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="mb-4 text-tierra-700">Debes iniciar sesión con GitHub para agregar recursos.</p>
        <a
          href={urlLogin()}
          className="inline-block rounded-md bg-rio-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rio-700 no-underline"
        >
          Iniciar sesión con GitHub
        </a>
      </div>
    );
  }

  if (!tienePermiso(sesion.rol, 'editor')) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-tierra-700">
          Tu rol <strong>{sesion.rol}</strong> no tiene permisos para agregar recursos.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-rio-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-tierra-500">
        <Link to="/" className="hover:text-rio-700">Inicio</Link>
        <span className="mx-2">›</span>
        <span>Nuevo recurso</span>
      </nav>
      <h1 className="mb-8 font-serif text-3xl font-bold text-tierra-900">Nuevo recurso</h1>
      <FormularioRecurso />
    </div>
  );
}