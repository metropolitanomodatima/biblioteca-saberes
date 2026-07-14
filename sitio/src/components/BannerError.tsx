import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const MENSAJES: Record<string, { texto: string; color: 'rojo' | 'verde' }> = {
  'no-miembro': {
    texto: 'Tu cuenta de GitHub no pertenece a la organización MODATIMA. Contacta a un administrador para solicitar acceso.',
    color: 'rojo',
  },
  'solicitud-enviada': {
    texto: 'Tu solicitud de acceso fue recibida. Un administrador la revisará y te enviará una invitación si es aprobada.',
    color: 'verde',
  },
  'solicitud-pendiente': {
    texto: 'Ya tienes una solicitud de acceso pendiente. Un administrador la revisará pronto.',
    color: 'verde',
  },
};

export default function BannerError() {
  const [params] = useSearchParams();
  const clave = params.get('error');
  const mensaje = clave ? MENSAJES[clave] : null;
  const [visible, setVisible] = useState(!!mensaje);

  useEffect(() => {
    setVisible(!!mensaje);
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mensaje || !visible) return null;

  const esVerde = mensaje.color === 'verde';

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-xl border px-5 py-4 text-sm mb-6',
        esVerde
          ? 'border-alerce-200 bg-alerce-50 text-alerce-800'
          : 'border-red-200 bg-red-50 text-red-800',
      ].join(' ')}
    >
      <span className={['mt-0.5 shrink-0', esVerde ? 'text-alerce-500' : 'text-red-500'].join(' ')} aria-hidden>
        {esVerde ? '✓' : '⚠'}
      </span>
      <p className="flex-1">{mensaje.texto}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className={['shrink-0', esVerde ? 'text-alerce-400 hover:text-alerce-600' : 'text-red-400 hover:text-red-600'].join(' ')}
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}