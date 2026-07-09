export type Rol = 'admin' | 'editor' | 'militancia';

export const JERARQUIA: Rol[] = ['militancia', 'editor', 'admin'];

export function tienePermiso(rolUsuario: Rol, rolMinimo: Rol): boolean {
  return JERARQUIA.indexOf(rolUsuario) >= JERARQUIA.indexOf(rolMinimo);
}

export interface Sesion {
  login: string;
  nombre: string | null;
  avatarUrl: string;
  rol: Rol;
}
