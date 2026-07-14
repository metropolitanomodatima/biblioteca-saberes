import { leerArchivoRepo, escribirArchivoRepo } from './github.js';

const RUTA = 'config/solicitudes-acceso.json';

interface Solicitud {
  login: string;
  nombre: string | null;
  fecha: string;
}

export type EstadoSolicitud = 'nueva' | 'ya-pendiente' | 'error';

export async function registrarSolicitud(login: string, nombre: string | null): Promise<EstadoSolicitud> {
  try {
    const { sha, contenido } = await leerArchivoRepo(RUTA);
    const solicitudes: Solicitud[] = contenido ? JSON.parse(contenido) : [];

    const yaExiste = solicitudes.some((s) => s.login.toLowerCase() === login.toLowerCase());
    if (yaExiste) return 'ya-pendiente';

    solicitudes.push({ login, nombre, fecha: new Date().toISOString() });
    await escribirArchivoRepo({
      ruta: RUTA,
      contenido: JSON.stringify(solicitudes, null, 2),
      mensaje: `chore: solicitud de acceso de @${login}`,
      rama: 'main',
      sha: sha ?? undefined,
    });
    return 'nueva';
  } catch (e) {
    console.error('[solicitudes] error:', e);
    return 'error';
  }
}