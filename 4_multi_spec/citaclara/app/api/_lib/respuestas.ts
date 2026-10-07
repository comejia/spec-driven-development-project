import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { CATALOGO_ERRORES, ErrorNegocio, esErrorNegocio, type CodigoError } from '@/src/domain/errores';

/**
 * Utilidades comunes de los Route Handlers: respuestas JSON y traducción de errores al
 * formato de los contratos `{ error: { codigo, mensaje } }` con mensajes en es-ES.
 */

export function respuestaOk<T>(datos: T, estado = 200): NextResponse {
  return NextResponse.json(datos, { status: estado });
}

export function respuestaError(codigo: CodigoError, mensaje?: string): NextResponse {
  const error = new ErrorNegocio(codigo, mensaje);
  return NextResponse.json(error.aRespuesta(), { status: error.estado });
}

/** Traduce un fallo de validación Zod al código de error de contrato correspondiente. */
export function respuestaErrorValidacion(error: ZodError): NextResponse {
  const rutas = error.issues.map((issue) => issue.path.join('.'));
  if (rutas.some((ruta) => ruta === 'email')) return respuestaError('EMAIL_INVALIDO');
  if (rutas.some((ruta) => ruta === 'estado')) return respuestaError('ESTADO_INVALIDO');
  if (rutas.some((ruta) => ruta === 'fecha')) return respuestaError('FECHA_INVALIDA');
  return respuestaError('DATOS_INCOMPLETOS');
}

/** Convierte cualquier error en la respuesta HTTP acordada, sin filtrar detalles técnicos. */
export function manejarError(error: unknown): NextResponse {
  if (esErrorNegocio(error)) {
    return NextResponse.json(error.aRespuesta(), { status: error.estado });
  }
  if (error instanceof ZodError) {
    return respuestaErrorValidacion(error);
  }
  console.error('[citaclara] error no previsto:', error);
  return NextResponse.json(
    {
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'No hemos podido completar la operación. Vuelve a intentarlo en unos segundos.',
      },
    },
    { status: 500 },
  );
}

/** Lee y valida el cuerpo JSON de la petición; si no es JSON, error de datos. */
export async function leerJson(peticion: Request): Promise<unknown> {
  try {
    return await peticion.json();
  } catch {
    throw new ErrorNegocio('DATOS_INCOMPLETOS');
  }
}

export { CATALOGO_ERRORES, ErrorNegocio };
