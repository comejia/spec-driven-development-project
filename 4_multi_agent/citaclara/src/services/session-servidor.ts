import { cookies } from 'next/headers';
import { COOKIE_SESION, verificarSesion } from './session';

/**
 * Resolución de la sesión en el servidor (páginas y Server Components).
 * Los Route Handlers usan `clinicaDeSesion(peticion)` de `session.ts`.
 */

/** Clínica de la sesión actual leída de la cookie HTTP-only, o null si no hay sesión. */
export async function clinicaDeSesionEnServidor(): Promise<string | null> {
  const almacen = await cookies();
  return verificarSesion(almacen.get(COOKIE_SESION)?.value);
}
