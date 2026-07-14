import type { Rol } from '@/types/sesion';

export interface ConfigRoles {
  admins: string[];
  editores: string[];
  miembros: string[];
}

export interface ResultadoCambioRol {
  pr_url: string;
}

export async function obtenerRoles(): Promise<ConfigRoles> {
  const r = await fetch('/api/admin/roles', { credentials: 'same-origin' });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error((err as { error: string }).error);
  }
  return r.json() as Promise<ConfigRoles>;
}

export async function cambiarRol(login: string, rol: Rol): Promise<ResultadoCambioRol> {
  const r = await fetch('/api/admin/roles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ login, rol }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error((err as { error: string }).error);
  }
  return r.json() as Promise<ResultadoCambioRol>;
}