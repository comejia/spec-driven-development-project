import { leerJson, manejarError, respuestaError, respuestaOk } from '@/app/api/_lib/respuestas';
import { cancelarPorPaciente } from '@/src/services/cancelar-por-paciente';
import { cancelarPorPacienteSchema, tokenSchema } from '@/src/validation';

/**
 * Contrato de `contracts/cancelacion.md` → POST /api/p/[token]/cancelar (005, US2).
 *
 * La autorización es la posesión del token (research D7): no hay sesión de clínica. El
 * servicio delega la transición en la 001 y aplica la política única de 24 h.
 */
export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    const { token } = await params;

    const tokenValidado = tokenSchema.safeParse(token);
    if (!tokenValidado.success) return respuestaError('PACIENTE_NO_EXISTE', 'El enlace no es válido o ha caducado.');

    const { citaId } = cancelarPorPacienteSchema.parse(await leerJson(peticion));
    const actualizada = await cancelarPorPaciente(tokenValidado.data, citaId);

    return respuestaOk({ cita: actualizada });
  } catch (error) {
    return manejarError(error);
  }
}
