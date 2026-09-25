import { obtenerDb, type BaseDatos } from '@/src/db';
import { cambiarEstado } from '@/src/services/cambiar-estado';

/**
 * Consumo de la cancelación desde el recordatorio (US3, FR-010/FR-010a) — T030.
 *
 * 002 NO reimplementa la transición `reservada → cancelada` ni la liberación del hueco: son
 * PROPIEDAD DE 001 (servicio `cambiar-estado`). Este módulo solo DELEGA en 001, dejando el
 * punto de invocación anclado y trazable.
 *
 * DEPENDENCIA EXPLÍCITA — FR-011 ⟶ FR-017a de 001:
 *   "mover una cita" = cancelar la original + crear una nueva (FR-017a de 001). Por eso una
 *   cita movida es una cita nueva (otro `cita_id`) y recibe su propio y único recordatorio.
 *   Si 001 cambiara esa semántica, 002 debe revisarse (S6 de la revisión cruzada).
 *
 * Concurrencia (FR-010a): ante cancelaciones simultáneas (email/portal/recepción), la garantía
 * de "una sola cancelación efectiva" la aporta 001 (actualización condicionada al estado
 * origen). 002 solo muestra el mensaje adecuado si la cita ya no está `reservada`.
 */
export async function cancelarDesdeRecordatorio(
  clinicaId: string,
  citaId: string,
  db: BaseDatos = obtenerDb(),
): Promise<{ id: string; estado: string }> {
  // Delegación pura en 001: la transición y la liberación del hueco son suyas.
  return cambiarEstado(clinicaId, citaId, 'cancelada', db);
}
