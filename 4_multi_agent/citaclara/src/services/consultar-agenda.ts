import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { cita, paciente, profesional, servicio, type EstadoCita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { formatearEuros } from '@/src/domain/dinero';
import { FRANJA_VISIBLE, inicioDelDia, inicioDelDiaSiguiente } from '@/src/domain/tiempo';
import { consultarAgendaSchema, type ConsultarAgendaEntrada } from '@/src/validation';

/**
 * US2 — Agenda del día por profesional (FR-015, FR-016, FR-016a).
 *
 * Devuelve únicamente las citas del profesional indicado para el día pedido, calculado
 * en la zona de negocio `Europe/Madrid` (D3), en orden cronológico. Las citas canceladas
 * o no asistidas siguen apareciendo con su estado (FR-015), pero se marcan con
 * `ocupa_hueco: false` porque liberan el tramo (FR-010): así la interfaz puede pintar
 * "libre" u "ocupado" con el mismo criterio que aplica la base de datos.
 */

const ESTADOS_QUE_OCUPAN: EstadoCita[] = ['reservada', 'completada'];

export interface CitaDeAgenda {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  ocupa_hueco: boolean;
  servicio: {
    id: string;
    nombre: string;
    duracion_min: number;
    precio_centimos: number;
    precio: string;
  };
  paciente: { id: string; nombre: string; telefono: string };
}

export interface AgendaDelDia {
  profesional: { id: string; nombre: string; especialidad: string };
  fecha: string;
  franja_visible: { desde: string; hasta: string };
  citas: CitaDeAgenda[];
}

export async function consultarAgenda(
  clinicaId: string,
  entrada: ConsultarAgendaEntrada,
  db: BaseDatos = obtenerDb(),
): Promise<AgendaDelDia> {
  const datos = consultarAgendaSchema.parse(entrada);

  const [profesionalDeLaAgenda] = await db
    .select({
      id: profesional.id,
      nombre: profesional.nombre,
      especialidad: profesional.especialidad,
    })
    .from(profesional)
    .where(and(eq(profesional.clinicaId, clinicaId), eq(profesional.id, datos.profesional_id)))
    .limit(1);
  if (!profesionalDeLaAgenda) throw new ErrorNegocio('PROFESIONAL_NO_EXISTE');

  const desde = inicioDelDia(datos.fecha);
  const hasta = inicioDelDiaSiguiente(datos.fecha);

  const filas = await db
    .select({
      id: cita.id,
      inicio: cita.inicio,
      fin: cita.fin,
      estado: cita.estado,
      servicioId: servicio.id,
      servicioNombre: servicio.nombre,
      duracionMin: servicio.duracionMin,
      precioCentimos: servicio.precioCentimos,
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      pacienteTelefono: paciente.telefono,
    })
    .from(cita)
    .innerJoin(servicio, eq(servicio.id, cita.servicioId))
    .innerJoin(paciente, eq(paciente.id, cita.pacienteId))
    .where(
      and(
        eq(cita.clinicaId, clinicaId),
        eq(cita.profesionalId, datos.profesional_id),
        gte(cita.inicio, desde),
        lt(cita.inicio, hasta),
      ),
    )
    .orderBy(asc(cita.inicio));

  return {
    profesional: profesionalDeLaAgenda,
    fecha: datos.fecha,
    franja_visible: { desde: FRANJA_VISIBLE.desde, hasta: FRANJA_VISIBLE.hasta },
    citas: filas.map((fila) => ({
      id: fila.id,
      inicio: fila.inicio.toISOString(),
      fin: fila.fin.toISOString(),
      estado: fila.estado,
      ocupa_hueco: ESTADOS_QUE_OCUPAN.includes(fila.estado),
      servicio: {
        id: fila.servicioId,
        nombre: fila.servicioNombre,
        duracion_min: fila.duracionMin,
        precio_centimos: fila.precioCentimos,
        precio: formatearEuros(fila.precioCentimos),
      },
      paciente: {
        id: fila.pacienteId,
        nombre: fila.pacienteNombre,
        telefono: fila.pacienteTelefono,
      },
    })),
  };
}

/** Profesionales de la clínica, para el selector de la agenda. */
export async function listarProfesionales(clinicaId: string, db: BaseDatos = obtenerDb()) {
  return db
    .select({
      id: profesional.id,
      nombre: profesional.nombre,
      especialidad: profesional.especialidad,
    })
    .from(profesional)
    .where(eq(profesional.clinicaId, clinicaId))
    .orderBy(asc(profesional.nombre));
}

/** Servicios de la clínica, para el formulario de alta. */
export async function listarServicios(clinicaId: string, db: BaseDatos = obtenerDb()) {
  return db
    .select({
      id: servicio.id,
      nombre: servicio.nombre,
      duracionMin: servicio.duracionMin,
      precioCentimos: servicio.precioCentimos,
    })
    .from(servicio)
    .where(eq(servicio.clinicaId, clinicaId))
    .orderBy(asc(servicio.nombre));
}
