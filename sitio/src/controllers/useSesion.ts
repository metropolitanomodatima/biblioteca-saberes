import { useContext } from 'react';
import { SesionContext, type ContextoSesion } from './sesionContexto';

export function useSesion(): ContextoSesion {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return ctx;
}