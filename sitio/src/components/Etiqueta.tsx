import { Link } from 'react-router-dom';

interface Props {
  texto: string;
  tipo?: 'tema' | 'territorio' | 'etiqueta' | 'tipo';
  href?: string;
}

const estilos: Record<NonNullable<Props['tipo']>, string> = {
  tema: 'bg-alerce-100 text-alerce-800 border-alerce-200',
  territorio: 'bg-rio-100 text-rio-800 border-rio-200',
  etiqueta: 'bg-tierra-100 text-tierra-800 border-tierra-200',
  tipo: 'bg-tierra-900 text-tierra-50 border-tierra-900',
};

export default function Etiqueta({ texto, tipo = 'etiqueta', href }: Props) {
  const clases = [
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium no-underline',
    estilos[tipo],
    href ? 'hover:opacity-80 transition' : '',
  ].join(' ');

  if (href) {
    return (
      <Link to={href} className={clases}>
        {texto}
      </Link>
    );
  }
  return <span className={clases}>{texto}</span>;
}
