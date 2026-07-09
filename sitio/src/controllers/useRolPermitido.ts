import type { Rol } from '@/types/sesion';
import { tienePermiso } from '@/types/sesion';
import { useSesion } from './useSesion';

export function useRolPermitido(rolMinimo: Rol): boolean {
  const { sesion } = useSesion();
  if (!sesion) return false;
  return tienePermiso(sesion.rol, rolMinimo);
}
