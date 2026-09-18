import { NextResponse } from 'next/server';
import { leerJson, manejarError } from '@/app/api/_lib/respuestas';
import { validarAcceso } from '@/src/services/acceso';
import { COOKIE_SESION, firmarSesion, opcionesCookieSesion } from '@/src/services/session';
import { accesoSchema } from '@/src/validation';

/** Contrato de `contracts/acceso.md` → POST /api/acceso (FR-018). */

export async function POST(peticion: Request): Promise<Response> {
  try {
    const entrada = accesoSchema.parse(await leerJson(peticion));
    const clinicaAutenticada = await validarAcceso(entrada);

    const respuesta = NextResponse.json({ clinica: clinicaAutenticada }, { status: 200 });
    respuesta.cookies.set(
      COOKIE_SESION,
      firmarSesion(clinicaAutenticada.id),
      opcionesCookieSesion(),
    );
    return respuesta;
  } catch (error) {
    return manejarError(error);
  }
}
