/**
 * Errores de negocio con mensajes en español de España, sin jerga técnica
 * (Principios 7 y 8; contracts/README.md).
 *
 * Cada código lleva asociado su estado HTTP y el texto que ve la recepción.
 */

export const CATALOGO_ERRORES = {
  DATOS_INCOMPLETOS: {
    estado: 400,
    mensaje: 'Faltan datos obligatorios para completar la operación.',
  },
  ESTADO_INVALIDO: {
    estado: 400,
    mensaje: 'El estado indicado para la cita no es válido.',
  },
  NO_AUTORIZADO: {
    estado: 401,
    mensaje: 'Introduce la clave de la clínica para ver la agenda.',
  },
  CLAVE_INVALIDA: {
    estado: 401,
    mensaje: 'La clave no es correcta.',
  },
  PACIENTE_NO_EXISTE: {
    estado: 404,
    mensaje: 'Ese paciente no tiene ficha en la clínica.',
  },
  PROFESIONAL_NO_EXISTE: {
    estado: 404,
    mensaje: 'Ese profesional no existe en la clínica.',
  },
  SERVICIO_NO_EXISTE: {
    estado: 404,
    mensaje: 'Ese servicio no existe en la clínica.',
  },
  CITA_NO_EXISTE: {
    estado: 404,
    mensaje: 'Esa cita no existe en la clínica.',
  },
  SOLAPE_PROFESIONAL: {
    estado: 409,
    mensaje: 'El profesional ya tiene otra cita a esa hora. Elige un hueco libre.',
  },
  SOLAPE_PACIENTE: {
    estado: 409,
    mensaje: 'El paciente ya tiene otra cita a esa hora con otro profesional.',
  },
  TRANSICION_INVALIDA: {
    estado: 409,
    mensaje: 'Esta cita ya está cerrada, así que su estado no se puede volver a cambiar.',
  },
  FUERA_DE_PLAZO: {
    estado: 403,
    mensaje:
      'Esta cita ya no se puede cancelar por internet porque faltan menos de 24 horas. Llama a la clínica para gestionarlo.',
  },
  TELEFONO_DUPLICADO: {
    estado: 409,
    mensaje: 'Ya hay una ficha con ese teléfono en la clínica.',
  },
  GRANULARIDAD_INVALIDA: {
    estado: 422,
    mensaje: 'La hora de inicio debe ir en tramos de 5 minutos, por ejemplo 10:00, 10:05 o 10:10.',
  },
  CITA_EN_PASADO: {
    estado: 422,
    mensaje: 'No se puede crear una cita en una fecha y hora que ya han pasado.',
  },
  EMAIL_INVALIDO: {
    estado: 422,
    mensaje: 'El correo electrónico no tiene un formato válido.',
  },
  FECHA_INVALIDA: {
    estado: 422,
    mensaje: 'La fecha indicada no es válida.',
  },
} as const;

export type CodigoError = keyof typeof CATALOGO_ERRORES;

/** Error de negocio que los servicios lanzan y los endpoints traducen a HTTP. */
export class ErrorNegocio extends Error {
  readonly codigo: CodigoError;
  readonly estado: number;

  constructor(codigo: CodigoError, mensaje?: string) {
    const entrada = CATALOGO_ERRORES[codigo];
    super(mensaje ?? entrada.mensaje);
    this.name = 'ErrorNegocio';
    this.codigo = codigo;
    this.estado = entrada.estado;
  }

  /** Cuerpo de respuesta acordado en los contratos: `{ error: { codigo, mensaje } }`. */
  aRespuesta(): { error: { codigo: CodigoError; mensaje: string } } {
    return { error: { codigo: this.codigo, mensaje: this.message } };
  }
}

export function esErrorNegocio(error: unknown): error is ErrorNegocio {
  return error instanceof ErrorNegocio;
}
