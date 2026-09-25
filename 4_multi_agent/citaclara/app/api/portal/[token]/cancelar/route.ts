import { respuestaOk, manejarError, leerJson } from '@/app/api/_lib/respuestas';
import { cancelarPortalSchema } from '@/src/validation';
import { cancelarDesdePortal } from '@/src/portal/cancelar-desde-portal';

/**
 * Cancelación desde el portal — POST /api/portal/[token]/cancelar
 * (contracts/portal-cancelacion.md).
 *
 * T025 [US2]: valida el cuerpo con Zod (`citaId`) → DATOS_INCOMPLETOS si falta/es inválido;
 * delega en `cancelarDesdePortal` (acceso 005 + política 005 + transición 001); traduce los
 * errores de negocio a HTTP mediante `manejarError`. El token nunca se registra.
 */

export const dynamic = 'force-dynamic';

export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const cuerpo = await leerJson(peticion);
    const { citaId } = cancelarPortalSchema.parse(cuerpo);

    const resultado = await cancelarDesdePortal(token ?? '', citaId);
    return respuestaOk(resultado);
  } catch (error) {
    return manejarError(error);
  }
}
