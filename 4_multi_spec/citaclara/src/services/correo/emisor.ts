/**
 * Interfaz del emisor de correo (T008). Abstrae el envío para permitir un adaptador `.eml`
 * simulado (por defecto, D3) y, en el futuro, uno SMTP real sin tocar el proceso.
 */

/** Mensaje ya compuesto, listo para emitir (cabeceras + cuerpo de texto). */
export interface MensajeCorreo {
  /** Nombre y dirección del remitente (`From`). */
  remitenteNombre: string;
  remitenteEmail: string;
  /** Destinatario (`To`): email del paciente. */
  destinoEmail: string;
  asunto: string;
  cuerpo: string;
  /** Instante de generación (para la cabecera `Date`). */
  generadoEn: Date;
  /** Inicio de la cita: base del nombre de fichero determinista `<yyyyMMdd-HHmm>`. */
  inicioCita: Date;
  /** UUID de la cita: parte del nombre de fichero y correspondencia 1:1. */
  citaId: string;
}

/** Resultado de una emisión: identifica el artefacto producido (p. ej. la ruta del `.eml`). */
export interface ResultadoEmision {
  /** Ruta del artefacto generado, si aplica (p. ej. el fichero `.eml`). */
  artefacto?: string;
}

export interface EmisorCorreo {
  emitir(mensaje: MensajeCorreo): Promise<ResultadoEmision>;
}
