import { useEffect, useState } from 'react';
import type { Sesion } from '@/types/sesion';
import { obtenerSesion, cerrarSesion } from '@/services/sesion';

export function useSesion() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerSesion()
      .then(setSesion)
      .finally(() => setCargando(false));
  }, []);

  async function logout() {
    await cerrarSesion();
    setSesion(null);
  }

  return { sesion, cargando, logout };
}
