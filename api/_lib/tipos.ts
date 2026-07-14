export type Rol = 'admin' | 'editor' | 'militancia';

const TIPO_A_SUBCARPETA: Record<string, string> = {
  argumentario: 'argumentarios',
  concepto: 'conceptos',
  campaña: 'campañas',
  territorio: 'territorios',
  cuenca: 'cuencas',
  ley: 'leyes',
  conflicto: 'conflictos',
  persona: 'personas',
  organizacion: 'organizaciones',
  evento: 'eventos',
  biblioteca: 'biblioteca',
};

export function subcarpetaDeTipo(tipo: string): string {
  return TIPO_A_SUBCARPETA[tipo] ?? tipo + 's';
}

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