import { createContext } from 'react';
import type { Sesion } from '@/types/sesion';

export interface ContextoSesion {
  sesion: Sesion | null;
  cargando: boolean;
  logout: () => Promise<void>;
}

export const SesionContext = createContext<ContextoSesion | null>(null);