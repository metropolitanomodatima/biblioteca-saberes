import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSesion } from '@/controllers/useSesion';
import { tienePermiso } from '@/types/sesion';
import { urlLogin } from '@/services/sesion';
import { cargarRecurso } from '@/services/recurso';
import type { RecursoCompleto } from '@/types/recurso';
import type { PayloadRecurso } from '@/services/recursoEditor';
import FormularioRecurso from '@/components/FormularioRecurso';
import Cargando from '@/components/Cargando';
import ErrorMensaje from '@/components/ErrorMensaje';

export default function EditarRecurso() {
  const { id = '' } = useParams();
  const { sesion, cargando: cargandoSesion } = useSesion();
  const [recurso, setRecurso] = useState<RecursoCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    cargarRecurso(decodeURIComponent(id))
      .then(setRecurso)
      .catch((e) => setError(e.message));
  }, [id]);

  if (cargandoSesion) return <Cargando texto="Verificando sesión…" />;

  if (!sesion) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="mb-4 text-tierra-700">Debes iniciar sesión con GitHub para editar recursos.</p>
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
          Tu rol <strong>{sesion.rol}</strong> no tiene permisos para editar recursos.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-rio-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (error) return <ErrorMensaje mensaje={error} />;
  if (!recurso) return <Cargando texto="Cargando recurso…" />;

  const slug = recurso.ruta.split('/').pop()?.replace(/\.md$/, '') ?? id;

  const modoEdicion: PayloadRecurso = {
    tipo: recurso.tipo,
    slug,
    titulo: recurso.titulo,
    resumen: recurso.resumen,
    frontmatter: recurso.frontmatter as Record<string, unknown>,
    cuerpo: recurso.contenido,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-tierra-500">
        <Link to="/" className="hover:text-rio-700">Inicio</Link>
        <span className="mx-2">›</span>
        <Link to={`/recurso/${id}`} className="hover:text-rio-700">{recurso.titulo}</Link>
        <span className="mx-2">›</span>
        <span>Editar</span>
      </nav>
      <h1 className="mb-8 font-serif text-3xl font-bold text-tierra-900">
        Editar: {recurso.titulo}
      </h1>
      <FormularioRecurso modoEdicion={modoEdicion} />
    </div>
  );
}