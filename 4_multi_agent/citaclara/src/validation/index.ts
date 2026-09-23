import { z } from 'zod';

/**
 * Esquemas de validación compartidos entre la interfaz y los endpoints (contracts/).
 * Los mensajes están en español de España y sin jerga (Principios 7 y 8).
 */

export const uuidSchema = z.string().uuid('El identificador no es válido.');

export const fechaIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD.');

/** Instante en ISO 8601; el servidor lo interpreta en Europe/Madrid (D3). */
export const instanteIsoSchema = z
  .string()
  .min(1, 'Indica la fecha y la hora de inicio.')
  .refine((valor) => !Number.isNaN(Date.parse(valor)), {
    message: 'La fecha y la hora de inicio no son válidas.',
  });

/** Entrada de POST /api/citas. El fin NO se acepta: se deriva (FR-006). */
export const crearCitaSchema = z.object({
  profesional_id: uuidSchema,
  servicio_id: uuidSchema,
  paciente_id: uuidSchema,
  inicio: instanteIsoSchema,
});
export type CrearCitaEntrada = z.infer<typeof crearCitaSchema>;

/** Estados a los que la recepción puede llevar una cita reservada (FR-008). */
export const estadoDestinoSchema = z.enum(['completada', 'cancelada', 'no_asistida']);
export type EstadoDestino = z.infer<typeof estadoDestinoSchema>;

export const cambiarEstadoSchema = z.object({
  estado: estadoDestinoSchema,
});

/** Consulta de GET /api/agenda. */
export const consultarAgendaSchema = z.object({
  profesional_id: uuidSchema,
  fecha: fechaIsoSchema,
});
export type ConsultarAgendaEntrada = z.infer<typeof consultarAgendaSchema>;

/** Entrada de POST /api/pacientes (FR-004/004a). */
export const crearPacienteSchema = z.object({
  nombre: z.string().trim().min(1, 'Indica el nombre del paciente.'),
  telefono: z
    .string()
    .trim()
    .min(1, 'Indica el teléfono del paciente.')
    .regex(/^[0-9 +().-]{6,20}$/, 'El teléfono solo puede tener números y los signos + ( ) . -'),
  email: z.union([z.string().trim().email('El correo electrónico no tiene un formato válido.'), z.literal('')]).optional(),
});
export type CrearPacienteEntrada = z.infer<typeof crearPacienteSchema>;

export const buscarPacientesSchema = z.object({
  buscar: z.string().trim().optional(),
});

/** Entrada de POST /api/acceso (FR-018). */
export const accesoSchema = z.object({
  clinica_id: uuidSchema,
  clave: z.string().min(1, 'Introduce la clave de la clínica.'),
});
export type AccesoEntrada = z.infer<typeof accesoSchema>;

/**
 * Entrada de GET /api/analitica (004, contracts/analitica.md).
 *
 * `dia_referencia` es opcional: fija el "hoy" desde el que se cuentan las últimas 8
 * semanas y la semana en curso. En producción por defecto es hoy; en pruebas se fija a
 * 2026-09-16 para reproducir los números de la spec (FR-014).
 */
export const analiticaSchema = z.object({
  dia_referencia: fechaIsoSchema.optional(),
});
export type AnaliticaEntrada = z.infer<typeof analiticaSchema>;
