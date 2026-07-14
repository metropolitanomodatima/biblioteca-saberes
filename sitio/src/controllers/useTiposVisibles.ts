import type { TipoRecurso } from '@/types/recurso';
import { useSesion } from './useSesion';

const TIPOS_PUBLICOS: TipoRecurso[] = ['concepto', 'territorio', 'cuenca', 'ley', 'conflicto'];

export function useTiposVisibles(): TipoRecurso[] | null | undefined {
  const { sesion, cargando } = useSesion();
  if (cargando) return undefined;
  if (sesion) return null;
  return TIPOS_PUBLICOS;
}