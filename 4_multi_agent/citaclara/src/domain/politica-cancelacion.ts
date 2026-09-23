import type { EstadoCita } from '@/src/db/schema';
import { ESTADO_INICIAL } from '@/src/domain/cita';

/**
 * Política de cancelación por el paciente (005, FR-007/008/009, data-model.md, research D5).
 *
 * Fuente de verdad ÚNICA del umbral: el paciente puede cancelar **solo** una cita en estado
 * `reservada` cuando falten **24 horas o más** para su inicio. El límite de 24 h exactas SÍ
 * es cancelable; a 23 h 59 min ya no lo es.
 *
 * Es una función PURA (sin DB ni reloj propio): recibe el instante "ahora" para que la
 * misma decisión valga en la vista (¿ofrecer cancelar?) y en el servidor (¿permitir
 * cancelar?), garantizando coherencia (FR-012). El cálculo compara instantes absolutos,
 * de modo que el cambio de hora (DST) no introduce ambigüedad (Principio 2).
 */

/** Umbral único de cancelación por el paciente: 24 horas, en milisegundos. */
export const UMBRAL_CANCELACION_MS = 24 * 60 * 60 * 1000;

/** Motivo por el que no se ofrece/permite cancelar, para elegir el mensaje adecuado. */
export type MotivoBloqueo = 'fuera_de_plazo' | 'ya_iniciada' | 'estado_no_cancelable';

export interface DecisionCancelacion {
  /** La UI debe ofrecer el botón de cancelar (US1/US3). */
  ofrecerCancelar: boolean;
  /** El servidor debe aceptar la cancelación (US2/US3). Igual que `ofrecerCancelar`. */
  permitirCancelar: boolean;
  /** Presente solo cuando NO se permite cancelar. */
  motivoBloqueo?: MotivoBloqueo;
}

/**
 * Decide si una cita es cancelable por el paciente.
 *
 * @param inicio Instante de inicio de la cita.
 * @param estado Estado actual de la cita (solo `reservada` es cancelable, FR-009).
 * @param ahora  Instante de referencia ("ahora").
 */
export function decidirCancelacion(
  inicio: Date,
  estado: EstadoCita,
  ahora: Date,
): DecisionCancelacion {
  if (estado !== ESTADO_INICIAL) {
    return { ofrecerCancelar: false, permitirCancelar: false, motivoBloqueo: 'estado_no_cancelable' };
  }

  const margenMs = inicio.getTime() - ahora.getTime();

  if (margenMs <= 0) {
    // La cita ya empezó o ya pasó.
    return { ofrecerCancelar: false, permitirCancelar: false, motivoBloqueo: 'ya_iniciada' };
  }

  if (margenMs < UMBRAL_CANCELACION_MS) {
    // Dentro de la ventana: faltan menos de 24 h.
    return { ofrecerCancelar: false, permitirCancelar: false, motivoBloqueo: 'fuera_de_plazo' };
  }

  // 24 h o más: cancelable (el límite exacto de 24 h SÍ lo es).
  return { ofrecerCancelar: true, permitirCancelar: true };
}
