import { and, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import {
  esViolacionCheck,
  esViolacionExclusion,
  RESTRICCION_GRANULARIDAD,
  RESTRICCION_SOLAPE_PACIENTE,
  RESTRICCION_SOLAPE_PROFESIONAL,
} from '@/src/db/errores-pg';
import { cita, paciente, profesional, servicio } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { calcularFin, esGranularidadValida } from '@/src/domain/tiempo';
import { crearCitaSchema, type CrearCitaEntrada } from '@/src/validation';

/**
 * US1 — Alta de cita sin solapes (FR-005..FR-014).
 *
 * Reglas que aplica este caso de uso:
 * - El `fin` NO se acepta del cliente: se deriva de la duración del servicio (FR-006).
 * - El inicio debe ir en tramos de 5 minutos (FR-005a) y no puede estar en el pasado
 *   (RN2, FR-013).
 * - El profesional, el servicio y el paciente deben existir en la clínica (FR-014).
 * - El anti-solape (RN1, FR-010/011 y FR-012a) NO se comprueba leyendo la agenda: se
 *   delega en las restricciones de exclusión de PostgreSQL y aquí solo se traduce su
 *   violación al error de negocio correspondiente. Así no existe ventana de carrera
 *   entre comprobar y escribir, ni siquiera con reservas simultáneas del mismo hueco.
 */

export interface CitaCreada {
  id: string;
  inicio: Date;
  fin: Date;
  estado: 'reservada';
}

export async function crearCita(
  clinicaId: string,
  entrada: CrearCitaEntrada,
  db: BaseDatos = obtenerDb(),
  ahora: Date = new Date(),
): Promise<CitaCreada> {
  const datos = crearCitaSchema.parse(entrada);
  const inicio = new Date(datos.inicio);

  // Existencia dentro de la clínica de la sesión (FR-014, aislamiento entre clínicas).
  const [profesionalDeLaCita] = await db
    .select({ id: profesional.id })
    .from(profesional)
    .where(and(eq(profesional.clinicaId, clinicaId), eq(profesional.id, datos.profesional_id)))
    .limit(1);
  if (!profesionalDeLaCita) throw new ErrorNegocio('PROFESIONAL_NO_EXISTE');

  const [servicioDeLaCita] = await db
    .select({ id: servicio.id, duracionMin: servicio.duracionMin })
    .from(servicio)
    .where(and(eq(servicio.clinicaId, clinicaId), eq(servicio.id, datos.servicio_id)))
    .limit(1);
  if (!servicioDeLaCita) throw new ErrorNegocio('SERVICIO_NO_EXISTE');

  const [pacienteDeLaCita] = await db
    .select({ id: paciente.id })
    .from(paciente)
    .where(and(eq(paciente.clinicaId, clinicaId), eq(paciente.id, datos.paciente_id)))
    .limit(1);
  if (!pacienteDeLaCita) throw new ErrorNegocio('PACIENTE_NO_EXISTE');

  // Granularidad de 5 minutos (FR-005a).
  if (!esGranularidadValida(inicio)) throw new ErrorNegocio('GRANULARIDAD_INVALIDA');

  // RN2: no se crean citas en el pasado (FR-013).
  if (inicio.getTime() < ahora.getTime()) throw new ErrorNegocio('CITA_EN_PASADO');

  const fin = calcularFin(inicio, servicioDeLaCita.duracionMin);

  try {
    const [creada] = await db
      .insert(cita)
      .values({
        clinicaId,
        profesionalId: datos.profesional_id,
        servicioId: datos.servicio_id,
        pacienteId: datos.paciente_id,
        inicio,
        fin,
        estado: 'reservada',
      })
      .returning({ id: cita.id, inicio: cita.inicio, fin: cita.fin, estado: cita.estado });

    return { id: creada.id, inicio: creada.inicio, fin: creada.fin, estado: 'reservada' };
  } catch (error) {
    throw traducirViolacionDeAgenda(error);
  }
}

/** Traduce las violaciones de invariantes de la agenda a errores de negocio en es-ES. */
export function traducirViolacionDeAgenda(error: unknown): unknown {
  if (esViolacionExclusion(error, RESTRICCION_SOLAPE_PROFESIONAL)) {
    return new ErrorNegocio('SOLAPE_PROFESIONAL');
  }
  if (esViolacionExclusion(error, RESTRICCION_SOLAPE_PACIENTE)) {
    return new ErrorNegocio('SOLAPE_PACIENTE');
  }
  if (esViolacionCheck(error, RESTRICCION_GRANULARIDAD)) {
    return new ErrorNegocio('GRANULARIDAD_INVALIDA');
  }
  return error;
}
