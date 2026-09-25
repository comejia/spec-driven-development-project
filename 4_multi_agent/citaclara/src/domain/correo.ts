import { formatInTimeZone } from 'date-fns-tz';
import { formatearFechaHora, ZONA_NEGOCIO } from '@/src/domain/tiempo';
import type { ConfigCorreo } from '@/src/validation/recordatorios';

/**
 * Composición del recordatorio por email (002), en español de España (Principio 8) y con
 * fecha/hora inequívocas `dd/MM/yyyy HH:mm` en Europe/Madrid (Principio 2, FR-006).
 *
 * El texto de política de cancelación DERIVA de 005 (umbral único de 24 h; dentro de la
 * ventana, teléfono de la clínica). 002 NO fija un umbral propio (FR-008/FR-009).
 */

/** Umbral de cancelación, PROPIEDAD DE 005; 002 solo lo comunica (no lo redefine). */
export const HORAS_CANCELACION_005 = 24;

export interface DatosRecordatorio {
  pacienteNombre: string;
  profesionalNombre: string;
  servicioNombre: string;
  clinicaNombre: string;
  inicioCita: Date;
  /** Enlace `/p/[token]` del paciente (propiedad de 005). */
  enlaceAcceso: string;
}

/** Asunto claro en es-ES (contracts/correo-eml.md). */
export function componerAsunto(datos: DatosRecordatorio): string {
  const fecha = formatInTimeZone(datos.inicioCita, ZONA_NEGOCIO, 'dd/MM/yyyy');
  const hora = formatInTimeZone(datos.inicioCita, ZONA_NEGOCIO, 'HH:mm');
  return `Recordatorio de tu cita en ${datos.clinicaNombre} el ${fecha} a las ${hora}`;
}

/**
 * Cuerpo del recordatorio (texto plano, es-ES). Incluye paciente, profesional, servicio,
 * fecha/hora, clínica, enlace de 005 y el texto de política de 24 h con el teléfono de la
 * clínica (FR-005/FR-006/FR-007/FR-008/FR-009).
 */
export function componerCuerpo(datos: DatosRecordatorio, telefonoClinica: string): string {
  return [
    `Hola ${datos.pacienteNombre}:`,
    '',
    `Te recordamos tu cita en ${datos.clinicaNombre}:`,
    '',
    `  • Profesional: ${datos.profesionalNombre}`,
    `  • Servicio: ${datos.servicioNombre}`,
    `  • Fecha y hora: ${formatearFechaHora(datos.inicioCita)}`,
    '',
    'Para ver tu cita o cancelarla, entra en tu acceso personal:',
    `  ${datos.enlaceAcceso}`,
    '',
    `Puedes cancelar hasta ${HORAS_CANCELACION_005} horas antes del inicio. Si faltan menos de ${HORAS_CANCELACION_005} horas,`,
    `llámanos al ${telefonoClinica} y lo gestionamos por teléfono.`,
    '',
    'Un saludo,',
    datos.clinicaNombre,
  ].join('\n');
}

export interface CorreoCompuesto {
  asunto: string;
  cuerpo: string;
}

/** Compone asunto + cuerpo del recordatorio a partir de los datos y la configuración. */
export function componerRecordatorio(
  datos: DatosRecordatorio,
  config: ConfigCorreo,
): CorreoCompuesto {
  return {
    asunto: componerAsunto(datos),
    cuerpo: componerCuerpo(datos, config.telefonoClinica),
  };
}
