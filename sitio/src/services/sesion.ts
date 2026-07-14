import type { Sesion } from '@/types/sesion';

export function urlLogin(): string {
  const returnTo = window.location.pathname + window.location.search;
  return `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function obtenerSesion(): Promise<Sesion | null> {
  try {
    const r = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (r.status === 401) return null;
    if (!r.ok) throw new Error(`Error al obtener sesión: ${r.status}`);
    return (await r.json()) as Sesion;
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}
