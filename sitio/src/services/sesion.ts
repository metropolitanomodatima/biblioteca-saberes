import type { Sesion } from '@/types/sesion';

export function urlLogin(): string {
  const params = new URLSearchParams(window.location.search);
  params.delete('error');
  const qs = params.toString();
  const returnTo = window.location.pathname + (qs ? `?${qs}` : '');
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
