import type { EstadoCita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import type { EstadoDestino } from '@/src/validation';

/**
 * Máquina de estados de la cita (FR-007/008/009), según data-model.md:
 *
 *     (creación) → reservada → completada   (final; sigue bloqueando el hueco)
 *                            → cancelada    (final; libera el hueco)
 *                            → no_asistida  (final; libera el hueco)
 *
 * Solo se puede transitar DESDE `reservada`. Los estados finales no se reabren en la 001
 * (la reprogramación queda fuera de alcance: FR-017a).
 */

export const ESTADO_INICIAL = 'reservada' as const;

export const ESTADOS_FINALES: EstadoCita[] = ['completada', 'cancelada', 'no_asistida'];

/** Estados que liberan el hueco de la agenda (FR-010). */
export const ESTADOS_QUE_LIBERAN: EstadoCita[] = ['cancelada', 'no_asistida'];

/** Transiciones permitidas por estado de origen. */
const TRANSICIONES: Record<EstadoCita, EstadoDestino[]> = {
  reservada: ['completada', 'cancelada', 'no_asistida'],
  completada: [],
  cancelada: [],
  no_asistida: [],
};

/** Estados a los que se puede llevar una cita que está en el estado indicado. */
export function transicionesPosibles(actual: EstadoCita): EstadoDestino[] {
  return [...TRANSICIONES[actual]];
}

export function esTransicionValida(actual: EstadoCita, destino: EstadoDestino): boolean {
  return TRANSICIONES[actual].includes(destino);
}

/** Igual que `esTransicionValida`, pero lanza TRANSICION_INVALIDA si no se permite. */
export function exigirTransicionValida(actual: EstadoCita, destino: EstadoDestino): void {
  if (!esTransicionValida(actual, destino)) throw new ErrorNegocio('TRANSICION_INVALIDA');
}

/** true si el estado deja el hueco libre para una cita nueva (FR-010). */
export function estadoLiberaHueco(estado: EstadoCita): boolean {
  return ESTADOS_QUE_LIBERAN.includes(estado);
}

/** Etiquetas para la interfaz, en español de España y sin jerga (Principios 7 y 8). */
export const ETIQUETAS_ESTADO: Record<EstadoCita, string> = {
  reservada: 'Reservada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistida: 'No asistida',
};

/** Texto del botón de cada acción de estado. */
export const ETIQUETAS_ACCION: Record<EstadoDestino, string> = {
  completada: 'Marcar completada',
  cancelada: 'Cancelar cita',
  no_asistida: 'No ha asistido',
};
