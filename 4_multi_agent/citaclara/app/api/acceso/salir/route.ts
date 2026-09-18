import { NextResponse } from 'next/server';
import { COOKIE_SESION, opcionesCookieSesion } from '@/src/services/session';

/** Contrato de `contracts/acceso.md` → POST /api/acceso/salir: cierra la sesión (204). */

export async function POST(): Promise<Response> {
  const respuesta = new NextResponse(null, { status: 204 });
  respuesta.cookies.set(COOKIE_SESION, '', { ...opcionesCookieSesion(), maxAge: 0 });
  return respuesta;
}
