import { formatInTimeZone } from 'date-fns-tz';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addWeeks } from 'date-fns';
import { ZONA_NEGOCIO } from './tiempo';

/**
 * Dominio puro de analítica (004). Sin dependencias de UI ni de base de datos: solo
 * cálculo, para que sea testeable de forma aislada (Principio 6).
 *
 * Todo se razona en la zona de negocio `Europe/Madrid` (D3, FR-013). Las semanas se
 * identifican por su semana ISO-8601 (lunes–domingo), etiqueta inequívoca para una clínica
 * española (FR-009).
 *
 * Convención "sin datos" (FR-010): cuando un denominador es cero (jornada nula, sin citas
 * pasadas), la función devuelve `null` en vez de 0 o de un error; la capa de presentación
 * pinta "sin datos".
 */

/** Estados que ocupan hueco, CONSUMIDOS POR REFERENCIA a la 001 (FR-010, RN1): la regla
 * anti-solape de la 001 define que solo "reservada" y "completada" bloquean el hueco;
 * "cancelada" y "no_asistida" lo liberan.
 *
 * NOTA DE DEPENDENCIA (FR-007b): este conjunto es propiedad de la 001. Si la 001 cambiara
 * qué estados ocupan hueco, hay que revisar FR-007 de la 004. La 004 NO publica una
 * constante con nombre propia para atribuírsela (S5); esta lista privada solo evita
 * repetir literales dentro del cálculo de ocupación. */
const ESTADOS_QUE_OCUPAN = ['reservada', 'completada'] as const;

export type EstadoQueOcupa = (typeof ESTADOS_QUE_OCUPAN)[number];

/** true si el estado ocupa hueco según la 001 (FR-010/RN1). */
export function ocupaHueco(estado: string): estado is EstadoQueOcupa {
  return (ESTADOS_QUE_OCUPAN as readonly string[]).includes(estado);
}

// ---------------------------------------------------------------------------
// Semanas ISO en Europe/Madrid (T004, FR-009/FR-013)
// ---------------------------------------------------------------------------

/** Identificador estable de una semana ISO: año ISO + número de semana ISO. */
export interface SemanaIso {
  isoAnio: number;
  isoSemana: number;
}

const MESES_CORTOS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/**
 * Fecha civil (mediodía) de Madrid para un instante. Se usa el mediodía para que el
 * cálculo de la semana ISO no dependa de saltos de hora ni de la zona del proceso.
 */
function fechaCivilMadrid(instante: Date): Date {
  const iso = formatInTimeZone(instante, ZONA_NEGOCIO, 'yyyy-MM-dd');
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
}

/** Semana ISO (año + número) a la que pertenece un instante, en Europe/Madrid. */
export function semanaIso(instante: Date): SemanaIso {
  const civil = fechaCivilMadrid(instante);
  return { isoAnio: getISOWeekYear(civil), isoSemana: getISOWeek(civil) };
}

/** Clave comparable/ordenable de una semana ISO: "2026-W31". */
export function claveSemana(semana: SemanaIso): string {
  return `${semana.isoAnio}-W${String(semana.isoSemana).padStart(2, '0')}`;
}

/** Fecha civil (UTC mediodía) del lunes de una semana ISO. */
function lunesDeSemana(semana: SemanaIso): Date {
  // 4 de enero siempre cae en la semana ISO 1; a partir de ahí se avanza en semanas.
  const cuatroEnero = new Date(Date.UTC(semana.isoAnio, 0, 4, 12, 0, 0));
  const lunesSemana1 = startOfISOWeek(cuatroEnero);
  return addWeeks(lunesSemana1, semana.isoSemana - 1);
}

/**
 * Etiqueta inequívoca de una semana para una clínica española (FR-009):
 * "Semana 33 · 11–17 ago". Incluye el rango de días para no depender solo del número.
 */
export function etiquetaSemana(semana: SemanaIso): string {
  const lunes = lunesDeSemana(semana);
  const domingo = endOfISOWeek(lunes);
  const diaLunes = lunes.getUTCDate();
  const diaDomingo = domingo.getUTCDate();
  const mesLunes = MESES_CORTOS_ES[lunes.getUTCMonth()];
  const mesDomingo = MESES_CORTOS_ES[domingo.getUTCMonth()];
  const rango =
    mesLunes === mesDomingo
      ? `${diaLunes}–${diaDomingo} ${mesDomingo}`
      : `${diaLunes} ${mesLunes}–${diaDomingo} ${mesDomingo}`;
  return `Semana ${semana.isoSemana} · ${rango}`;
}

/**
 * Las últimas `n` semanas ISO hasta la semana en curso del día de referencia, en orden
 * cronológico ascendente (FR-007a/FR-008). No incluye semanas futuras.
 */
export function ultimasNSemanas(diaReferencia: Date, n: number): SemanaIso[] {
  const actual = semanaIso(diaReferencia);
  const lunesActual = lunesDeSemana(actual);
  const semanas: SemanaIso[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const lunes = addWeeks(lunesActual, -i);
    semanas.push({ isoAnio: getISOWeekYear(lunes), isoSemana: getISOWeek(lunes) });
  }
  return semanas;
}

/** true si la semana de `instante` es posterior a la semana en curso de `diaReferencia`. */
export function esSemanaFutura(instante: Date, diaReferencia: Date): boolean {
  return claveSemana(semanaIso(instante)) > claveSemana(semanaIso(diaReferencia));
}

// ---------------------------------------------------------------------------
// Ocupación (T006, FR-007/FR-010)
// ---------------------------------------------------------------------------

/** Jornada de actividad de la clínica: 09:00–19:00 = 600 min por día laborable. */
export const MINUTOS_JORNADA_DIARIA = (19 - 9) * 60;

/** Días laborables (L–V) de una semana ISO. Por defecto son 5; útil parametrizar en tests. */
export const DIAS_LABORABLES_POR_SEMANA = 5;

/** Minutos de jornada de una semana = 600 min × días laborables. */
export function minutosLaborablesDeSemana(diasLaborables = DIAS_LABORABLES_POR_SEMANA): number {
  return MINUTOS_JORNADA_DIARIA * diasLaborables;
}

/**
 * Porcentaje de ocupación (FR-007). Devuelve `null` = "sin datos" si no hay jornada
 * (denominador 0, FR-010). Nunca supera el 100 % ni baja de 0 (SC-008).
 */
export function porcentajeOcupacion(
  minutosOcupados: number,
  minutosJornada: number,
): number | null {
  if (minutosJornada <= 0) return null;
  const bruto = (minutosOcupados / minutosJornada) * 100;
  const acotado = Math.min(100, Math.max(0, bruto));
  return redondearUnDecimal(acotado);
}

// ---------------------------------------------------------------------------
// Tasa de no asistencia — Definición A (T007, FR-006/FR-006a)
// ---------------------------------------------------------------------------

/** Conteos por estado de las citas de un profesional (pasadas y futuras). */
export interface ConteosPorEstado {
  reservada?: number;
  completada?: number;
  cancelada?: number;
  no_asistida?: number;
}

/**
 * Tasa de no asistencia, Definición A (FR-006), métrica propiedad de la 004:
 * no_asistida ÷ (completada + cancelada + no_asistida) en porcentaje.
 *
 * El denominador son las citas PASADAS CON DESENLACE (estado ≠ reservada, FR-006a). Si el
 * denominador es 0 devuelve `null` = "sin datos" (FR-010, SC-008); nunca divide por cero.
 */
export function tasaNoAsistenciaDefA(conteos: ConteosPorEstado): number | null {
  const completada = conteos.completada ?? 0;
  const cancelada = conteos.cancelada ?? 0;
  const noAsistida = conteos.no_asistida ?? 0;
  const denominador = completada + cancelada + noAsistida;
  if (denominador <= 0) return null;
  return redondearUnDecimal((noAsistida / denominador) * 100);
}

/** Citas pasadas con desenlace (denominador de la Definición A). */
export function citasPasadasConDesenlace(conteos: ConteosPorEstado): number {
  return (conteos.completada ?? 0) + (conteos.cancelada ?? 0) + (conteos.no_asistida ?? 0);
}

// ---------------------------------------------------------------------------
// Presentación de porcentajes en es-ES
// ---------------------------------------------------------------------------

/** Redondeo a un decimal, estable (evita -0). */
export function redondearUnDecimal(valor: number): number {
  const redondeado = Math.round(valor * 10) / 10;
  return redondeado === 0 ? 0 : redondeado;
}

/** Texto de un porcentaje en es-ES ("11,3 %") o "sin datos" si es null (FR-010/FR-011). */
export function formatearPorcentaje(porcentaje: number | null): string {
  if (porcentaje === null) return 'sin datos';
  return `${porcentaje.toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}
