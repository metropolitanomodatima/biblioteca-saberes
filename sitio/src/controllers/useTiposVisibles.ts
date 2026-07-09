import type { TipoRecurso } from '@/types/recurso';
import { useSesion } from './useSesion';

const TIPOS_PUBLICOS: TipoRecurso[] = ['concepto', 'territorio', 'cuenca', 'ley', 'caso'];

export function useTiposVisibles(): TipoRecurso[] | null {
  const { sesion, cargando } = useSesion();
  // Mientras carga asumimos usuario anónimo (más restrictivo)
  if (cargando) return TIPOS_PUBLICOS;
  // Usuario logueado ve todo
  if (sesion) return null;
  return TIPOS_PUBLICOS;
}