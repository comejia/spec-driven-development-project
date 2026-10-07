import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * Tiempo inequívoco para una clínica española (Principio 2, FR-005a/019, D3).
 *
 * Los instantes se guardan en UTC y se interpretan y muestran SIEMPRE en la zona de
 * negocio fija `Europe/Madrid`, nunca en la zona del servidor ni del navegador.
 */

export const ZONA_NEGOCIO = 'Europe/Madrid';

/** Granularidad de la agenda: tramos de 5 minutos (FR-005a). */
export const GRANULARIDAD_MINUTOS = 5;
const GRANULARIDAD_MS = GRANULARIDAD_MINUTOS * 60 * 1000;

/** Franja horaria visible de la agenda del día (FR-016a). */
export const FRANJA_VISIBLE = { desde: '08:00', hasta: '21:00' } as const;

const FORMATO_FECHA_ISO = 'yyyy-MM-dd';

/** true si el instante cae en un tramo exacto de 5 minutos, sin segundos ni milisegundos. */
export function esGranularidadValida(instante: Date): boolean {
  return Number.isInteger(instante.getTime() / GRANULARIDAD_MS);
}

/** Calcula el fin de una cita a partir del inicio y la duración del servicio (FR-006). */
export function calcularFin(inicio: Date, duracionMin: number): Date {
  if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
    throw new Error(`Duración en minutos no válida: ${String(duracionMin)}`);
  }
  return new Date(inicio.getTime() + duracionMin * 60 * 1000);
}

/** Fecha del día ("YYYY-MM-DD") a la que pertenece el instante en Europe/Madrid. */
export function fechaEnMadrid(instante: Date): string {
  return formatInTimeZone(instante, ZONA_NEGOCIO, FORMATO_FECHA_ISO);
}

/** Hora local en Europe/Madrid en formato 24 h ("HH:mm"). */
export function horaEnMadrid(instante: Date): string {
  return formatInTimeZone(instante, ZONA_NEGOCIO, 'HH:mm');
}

/** Fecha en formato español ("dd/MM/yyyy"). */
export function formatearFecha(instante: Date): string {
  return formatInTimeZone(instante, ZONA_NEGOCIO, 'dd/MM/yyyy');
}

/** Fecha y hora en formato español 24 h, sin ambigüedad ("dd/MM/yyyy HH:mm"). */
export function formatearFechaHora(instante: Date): string {
  return formatInTimeZone(instante, ZONA_NEGOCIO, 'dd/MM/yyyy HH:mm');
}

/** Convierte una fecha y hora locales de Madrid en el instante absoluto correspondiente. */
export function instanteEnMadrid(fecha: string, hora: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error(`Fecha no válida (se espera YYYY-MM-DD): ${fecha}`);
  }
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    throw new Error(`Hora no válida (se espera HH:mm): ${hora}`);
  }
  return fromZonedTime(`${fecha}T${hora}:00`, ZONA_NEGOCIO);
}

/** Primer instante del día indicado en Europe/Madrid. */
export function inicioDelDia(fecha: string): Date {
  return instanteEnMadrid(fecha, '00:00');
}

/** Primer instante del día siguiente (límite superior exclusivo del día). */
export function inicioDelDiaSiguiente(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  // `Date.UTC` resuelve el cambio de mes y de año; solo se usa para calcular la fecha
  // civil siguiente, nunca como instante de negocio.
  const civilSiguiente = new Date(Date.UTC(anio, mes - 1, dia + 1));
  return instanteEnMadrid(formatInTimeZone(civilSiguiente, 'UTC', FORMATO_FECHA_ISO), '00:00');
}

/** Minutos transcurridos desde las 00:00 locales de Madrid. */
export function minutosDesdeMedianoche(instante: Date): number {
  const [horas, minutos] = horaEnMadrid(instante).split(':').map(Number);
  return horas * 60 + minutos;
}

/** Convierte "HH:mm" en minutos desde medianoche. */
export function horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

/** Genera los tramos de la franja visible en pasos de `GRANULARIDAD_MINUTOS`. */
export function tramosDeLaFranja(paso = GRANULARIDAD_MINUTOS): string[] {
  const desde = horaAMinutos(FRANJA_VISIBLE.desde);
  const hasta = horaAMinutos(FRANJA_VISIBLE.hasta);
  const tramos: string[] = [];
  for (let minuto = desde; minuto < hasta; minuto += paso) {
    const horas = String(Math.floor(minuto / 60)).padStart(2, '0');
    const minutos = String(minuto % 60).padStart(2, '0');
    tramos.push(`${horas}:${minutos}`);
  }
  return tramos;
}
