import { useEffect, useState, type ReactNode } from 'react';
import type { Sesion } from '@/types/sesion';
import { obtenerSesion, cerrarSesion } from '@/services/sesion';
import { SesionContext } from './sesionContexto';

const CLAVE = 'sesion_cache';

function leerCache(): Sesion | null {
  try {
    const raw = sessionStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

function escribirCache(s: Sesion | null) {
  try {
    if (s) sessionStorage.setItem(CLAVE, JSON.stringify(s));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    // sessionStorage puede no estar disponible
  }
}

export default function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerCache);
  const [cargando, setCargando] = useState(() => leerCache() === null);

  useEffect(() => {
    obtenerSesion()
      .then((s) => {
        escribirCache(s);
        setSesion(s);
      })
      .finally(() => setCargando(false));
  }, []);

  async function logout() {
    await cerrarSesion();
    escribirCache(null);
    window.location.href = '/';
  }

  return (
    <SesionContext.Provider value={{ sesion, cargando, logout }}>
      {children}
    </SesionContext.Provider>
  );
}