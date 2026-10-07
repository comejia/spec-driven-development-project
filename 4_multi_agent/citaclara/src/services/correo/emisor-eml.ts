import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { formatInTimeZone } from 'date-fns-tz';
import { ZONA_NEGOCIO } from '@/src/domain/tiempo';
import type { EmisorCorreo, MensajeCorreo, ResultadoEmision } from './emisor';

/**
 * Adaptador de salida SIMULADA a fichero `.eml` (D3, FR-013): sin SMTP, cada recordatorio
 * produce un mensaje MIME RFC 5322 en `datos/salida-correo/`. Sin dependencias nuevas
 * (Principio 4): el MIME se compone con utilidades propias mínimas.
 */

export const DIRECTORIO_SALIDA_POR_DEFECTO = 'datos/salida-correo';

/** Nombre determinista y legible: `<yyyyMMdd-HHmm>-<cita_id>.eml` (contracts/correo-eml.md). */
export function nombreFicheroEml(inicioCita: Date, citaId: string): string {
  const sello = formatInTimeZone(inicioCita, ZONA_NEGOCIO, 'yyyyMMdd-HHmm');
  return `${sello}-${citaId}.eml`;
}

/** Fecha en formato RFC 5322 para la cabecera `Date` (p. ej. "Wed, 01 Oct 2026 09:00:00 +0200"). */
export function fechaRfc5322(instante: Date): string {
  return formatInTimeZone(instante, ZONA_NEGOCIO, "EEE, dd MMM yyyy HH:mm:ss xx");
}

/** Compone el texto completo del `.eml` (cabeceras + cuerpo). */
export function componerEml(mensaje: MensajeCorreo): string {
  const cabeceras = [
    `From: ${mensaje.remitenteNombre} <${mensaje.remitenteEmail}>`,
    `To: ${mensaje.destinoEmail}`,
    `Subject: ${mensaje.asunto}`,
    `Date: ${fechaRfc5322(mensaje.generadoEn)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
  ];
  return `${cabeceras.join('\r\n')}\r\n\r\n${mensaje.cuerpo}\r\n`;
}

export class EmisorCorreoEml implements EmisorCorreo {
  constructor(private readonly directorioSalida: string = DIRECTORIO_SALIDA_POR_DEFECTO) {}

  async emitir(mensaje: MensajeCorreo): Promise<ResultadoEmision> {
    await mkdir(this.directorioSalida, { recursive: true });
    const nombre = nombreFicheroEml(mensaje.inicioCita, mensaje.citaId);
    const ruta = join(this.directorioSalida, nombre);
    await writeFile(ruta, componerEml(mensaje), 'utf8');
    return { artefacto: ruta };
  }
}
