import { useEffect, useRef } from 'react';

interface Props {
  titulo: string;
  mensaje: string;
  labelConfirmar?: string;
  labelCancelar?: string;
  variante?: 'peligro' | 'normal';
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function Dialogo({
  titulo,
  mensaje,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  variante = 'normal',
  onConfirmar,
  onCancelar,
}: Props) {
  const refConfirmar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    refConfirmar.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancelar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancelar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-tierra-200 bg-white p-6 shadow-xl">
        <h2 className="font-serif text-lg font-bold text-tierra-900">{titulo}</h2>
        <p className="mt-2 text-sm text-tierra-600">{mensaje}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancelar}
            className="rounded-md border border-tierra-300 px-4 py-2 text-sm text-tierra-700 hover:bg-tierra-50"
          >
            {labelCancelar}
          </button>
          <button
            ref={refConfirmar}
            onClick={onConfirmar}
            className={[
              'rounded-md px-4 py-2 text-sm font-semibold text-white',
              variante === 'peligro'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-rio-600 hover:bg-rio-700',
            ].join(' ')}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}