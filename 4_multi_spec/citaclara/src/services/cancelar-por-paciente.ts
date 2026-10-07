import { and, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { cita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { decidirCancelacion } from '@/src/domain/politica-cancelacion';
import { cambiarEstado, type CitaActualizada } from '@/src/services/cambiar-estado';
import { accesoDenegado, resolverToken } from '@/src/services/acceso-paciente';

/**
 * Cancelación por el paciente (005 US2, FR-009/010/011, contracts/cancelacion.md).
 *
 * Autoriza por token (posesión), comprueba que la cita es del paciente (FR-003), aplica la
 * política única de 24 h (FR-007/008/009) y **delega** la transición en `cambiarEstado` de
 * la 001 (research D6). NO reimplementa la transición ni la liberación del hueco: la
 * atomicidad/idempotencia ante concurrencia la aporta 001 (FR-011).
 */

export async function cancelarPorPaciente(
  token: string,
  citaId: string,
  db: BaseDatos = obtenerDb(),
  ahora: Date = new Date(),
): Promise<CitaActualizada> {
  const { pacienteId, clinicaId } = await resolverToken(token, db);

  // La cita debe existir y pertenecer a este paciente (FR-003). Si no, denegación neutra:
  // no se distingue "no existe" de "no es tuya" para no filtrar información (D4).
  const [suya] = await db
    .select({ inicio: cita.inicio, estado: cita.estado })
    .from(cita)
    .where(and(eq(cita.id, citaId), eq(cita.pacienteId, pacienteId)))
    .limit(1);

  if (!suya) throw accesoDenegado();

  // Política única de cancelación (FR-007/008/009).
  const decision = decidirCancelacion(suya.inicio, suya.estado, ahora);
  if (!decision.permitirCancelar) {
    if (decision.motivoBloqueo === 'estado_no_cancelable') {
      // La cita no está reservada: mismo mensaje que 001 para transiciones inválidas.
      throw new ErrorNegocio('TRANSICION_INVALIDA');
    }
    // Fuera de plazo o ya iniciada: remite al teléfono de la clínica (FR-008).
    throw new ErrorNegocio('FUERA_DE_PLAZO');
  }

  // Delegación en la 001: transición atómica `reservada → cancelada` que libera el hueco.
  return cambiarEstado(clinicaId, citaId, 'cancelada', db);
}
