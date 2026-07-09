import { Routes, Route } from 'react-router-dom';
import Menu from '@/components/Menu';
import Portada from '@/pages/Portada';
import Categoria from '@/pages/Categoria';
import Recurso from '@/pages/Recurso';
import Busqueda from '@/pages/Busqueda';
import NoEncontrado from '@/pages/NoEncontrado';
import Nuevo from '@/pages/Nuevo';
import EditarRecurso from '@/pages/EditarRecurso';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Menu />
      <main className="contenedor flex-1 py-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Portada />} />
          <Route path="/buscar" element={<Busqueda />} />
          <Route path="/nuevo" element={<Nuevo />} />
          <Route path="/editar/:id" element={<EditarRecurso />} />
          <Route path="/recurso/:id" element={<Recurso />} />
          <Route path="/:slug" element={<Categoria />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      <footer className="border-t border-tierra-200 bg-white">
        <div className="contenedor py-8 text-sm text-tierra-600">
          <p className="font-serif text-base font-semibold text-tierra-900">
            Biblioteca de Saberes MODATIMA
          </p>
          <p className="mt-1">
            Movimiento por la Defensa del Acceso al Agua, la Tierra y la Protección del
            Medioambiente. Contenido publicado bajo licencias abiertas cuando así se indica.
          </p>
          <p className="mt-3 text-xs text-tierra-500">
            La fuente de verdad de este sitio son los archivos Markdown del repositorio{' '}
            <code className="rounded bg-tierra-100 px-1">https://github.com/metropolitanomodatima/biblioteca-saberes</code>.
          </p>
        </div>
      </footer>
    </div>
  );
}
