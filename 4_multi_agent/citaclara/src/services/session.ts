import { createHmac, timingSafeEqual } from 'node:crypto';
import { ErrorNegocio } from '@/src/domain/errores';

/**
 * Sesión de clínica (FR-018, D5).
 *
 * Tras validar la clave contra su hash se emite una cookie HTTP-only firmada con
 * HMAC-SHA256 que contiene solo el identificador de la clínica. Sin cookie válida no se
 * devuelve ninguna agenda.
 *
 * Este módulo es puro (sin dependencias del entorno de Next) para que los endpoints y
 * las pruebas puedan resolver la sesión a partir de la propia petición.
 */

export const COOKIE_SESION = 'citaclara_sesion';

/** Duración de la sesión: una jornada de mostrador. */
export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;

function secreto(): string {
  const valor = process.env.SESSION_SECRET;
  if (!valor || valor.length < 16) {
    throw new Error(
      'Falta la variable de entorno SESSION_SECRET (mínimo 16 caracteres) para firmar la sesión.',
    );
  }
  return valor;
}

function firma(clinicaId: string): string {
  return createHmac('sha256', secreto()).update(clinicaId).digest('base64url');
}

/** Valor de cookie firmado para una clínica. */
export function firmarSesion(clinicaId: string): string {
  return `${clinicaId}.${firma(clinicaId)}`;
}

/** Devuelve el identificador de clínica si la firma es válida; en caso contrario, null. */
export function verificarSesion(valor: string | undefined | null): string | null {
  if (!valor) return null;
  const separador = valor.lastIndexOf('.');
  if (separador <= 0) return null;
  const clinicaId = valor.slice(0, separador);
  const recibida = Buffer.from(valor.slice(separador + 1));
  const esperada = Buffer.from(firma(clinicaId));
  if (recibida.length !== esperada.length) return null;
  return timingSafeEqual(recibida, esperada) ? clinicaId : null;
}

/** Opciones de la cookie de sesión: HTTP-only y no accesible desde JavaScript. */
export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_SESION_SEGUNDOS,
  };
}

/** Extrae el valor de una cookie de la cabecera `Cookie` de la petición. */
export function leerCookie(peticion: Request, nombre: string): string | null {
  const cabecera = peticion.headers.get('cookie');
  if (!cabecera) return null;
  for (const trozo of cabecera.split(';')) {
    const separador = trozo.indexOf('=');
    if (separador === -1) continue;
    if (trozo.slice(0, separador).trim() === nombre) {
      return decodeURIComponent(trozo.slice(separador + 1).trim());
    }
  }
  return null;
}

/** Clínica de la sesión de esta petición, o null si no hay sesión válida. */
export function clinicaDeSesion(peticion: Request): string | null {
  return verificarSesion(leerCookie(peticion, COOKIE_SESION));
}

/** Igual que `clinicaDeSesion`, pero exige sesión: lanza NO_AUTORIZADO si falta (FR-018). */
export function exigirClinicaDeSesion(peticion: Request): string {
  const clinicaId = clinicaDeSesion(peticion);
  if (!clinicaId) throw new ErrorNegocio('NO_AUTORIZADO');
  return clinicaId;
}
