import { z } from 'zod';

/**
 * Validación de los argumentos del proceso diario de recordatorios (002) y de la
 * configuración de correo. Mensajes en español de España, sin jerga (Principios 7 y 8).
 *
 * Ver contracts/proceso-diario.md (parámetros `--fecha`, `--clinica`).
 */

/** Instante de referencia (ISO 8601). Inyectable para reproducibilidad (FR-015, D6). */
export const fechaReferenciaSchema = z
  .string()
  .min(1, 'Indica la fecha de referencia.')
  .refine((valor) => !Number.isNaN(Date.parse(valor)), {
    message: 'La fecha indicada no es válida.',
  });

/** Argumentos del proceso: `--fecha` opcional (por defecto, ahora) y `--clinica` opcional. */
export const argumentosProcesoSchema = z.object({
  /** Instante de referencia; si falta, el proceso usa el reloj del sistema. */
  fecha: fechaReferenciaSchema.optional(),
  /** Limita el proceso a una clínica concreta. */
  clinica: z.string().uuid('El identificador de clínica no es válido.').optional(),
});
export type ArgumentosProceso = z.infer<typeof argumentosProcesoSchema>;

/**
 * Configuración de correo de la clínica que el `.eml` necesita y que el esquema de 001
 * NO aporta (la tabla `clinica` solo tiene id/nombre). Se resuelve desde entorno (T007).
 */
export const configCorreoSchema = z.object({
  /** Nombre visible del remitente (p. ej. la propia clínica). */
  remitenteNombre: z.string().trim().min(1),
  /** Dirección de correo del remitente. */
  remitenteEmail: z.string().trim().email(),
  /** Teléfono de la clínica para el mensaje dentro de la ventana de 24 h (FR-009). */
  telefonoClinica: z.string().trim().min(1),
  /** URL base del portal del paciente de 005 para componer `/p/[token]`. */
  urlBaseAcceso: z.string().trim().url(),
});
export type ConfigCorreo = z.infer<typeof configCorreoSchema>;
