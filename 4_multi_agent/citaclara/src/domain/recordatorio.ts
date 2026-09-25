import type { EstadoCita } from '@/src/db/schema';

/**
 * Lógica pura de 002: ventana de antelación y elegibilidad de recordatorio (FR-002, FR-012).
 *
 * No toca base de datos ni reloj del sistema: recibe el instante de referencia, de modo que
 * el proceso sea reproducible (FR-015, D6). El estado y la transición de la cita son
 * PROPIEDAD DE 001; aquí solo se decide la elegibilidad para el aviso.
 *
 * FR-011 (cita movida = nuevo recordatorio) DEPENDE de FR-017a de 001 (mover = cancelar la
 * original + crear una nueva): la cita nueva tiene otro `cita_id`, por lo que es elegible por
 * sí misma. Si 001 cambiara esa semántica, 002 debe revisarse.
 */

/** Amplitud de la ventana de antelación (FR-012): entre 24 y 48 horas por delante. */
export const HORAS_ANTELACION_MIN = 24;
export const HORAS_ANTELACION_MAX = 48;

const HORA_EN_MS = 60 * 60 * 1000;

/** Estado en el que una cita es elegible para recordatorio (FR-002). */
export const ESTADO_ELEGIBLE: EstadoCita = 'reservada';

export interface VentanaAntelacion {
  /** Límite inferior inclusivo: `referencia + 24h`. */
  desde: Date;
  /** Límite superior exclusivo: `referencia + 48h`. */
  hasta: Date;
}

/** Calcula la ventana `[referencia + 24h, referencia + 48h)` (FR-012). */
export function calcularVentana(referencia: Date): VentanaAntelacion {
  return {
    desde: new Date(referencia.getTime() + HORAS_ANTELACION_MIN * HORA_EN_MS),
    hasta: new Date(referencia.getTime() + HORAS_ANTELACION_MAX * HORA_EN_MS),
  };
}

/** true si el `inicio` cae dentro de la ventana `[desde, hasta)`. */
export function inicioEnVentana(inicio: Date, ventana: VentanaAntelacion): boolean {
  const t = inicio.getTime();
  return t >= ventana.desde.getTime() && t < ventana.hasta.getTime();
}

/** Datos mínimos de una cita para decidir su elegibilidad. */
export interface CitaElegibilidad {
  estado: EstadoCita;
  inicio: Date;
}

/**
 * Elegibilidad de una cita para recordatorio respecto a un instante de referencia:
 * debe estar en estado `reservada` (FR-002) y su inicio dentro de la ventana 24-48 h (FR-012).
 */
export function esElegible(cita: CitaElegibilidad, referencia: Date): boolean {
  if (cita.estado !== ESTADO_ELEGIBLE) return false;
  return inicioEnVentana(cita.inicio, calcularVentana(referencia));
}

/**
 * Eficacia del recordatorio (SC-008, métrica PROPIA de 002, distinta de la tasa oficial de
 * no asistencia de 004). Porcentaje de citas recordadas (denominador) que terminan en
 * `no_asistida` (numerador). Devuelve 0 si no hay citas recordadas.
 *
 * NOTA: la tasa oficial de no asistencia de la clínica es PROPIEDAD DE 004
 * (no_asistida ÷ (completada + cancelada + no_asistida), FR-006 de 004). Además, debe leerse
 * teniendo en cuenta el efecto "la cancelación sustituye al no-show".
 */
export function eficaciaRecordatorio(citasRecordadas: { estado: EstadoCita }[]): number {
  const total = citasRecordadas.length;
  if (total === 0) return 0;
  const noAsistidas = citasRecordadas.filter((c) => c.estado === 'no_asistida').length;
  return noAsistidas / total;
}
