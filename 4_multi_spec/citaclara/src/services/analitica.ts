import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { cita, profesional, servicio } from '@/src/db/schema';
import { formatearEuros, sumarCentimos } from '@/src/domain/dinero';
import {
  citasPasadasConDesenlace,
  claveSemana,
  etiquetaSemana,
  formatearPorcentaje,
  minutosLaborablesDeSemana,
  porcentajeOcupacion,
  redondearUnDecimal,
  semanaIso,
  tasaNoAsistenciaDefA,
  ultimasNSemanas,
  type ConteosPorEstado,
} from '@/src/domain/analitica';
import { analiticaSchema, type AnaliticaEntrada } from '@/src/validation';

/**
 * Servicio de analítica (004) — SOLO LECTURA (FR-002).
 *
 * Agrega las entidades de la 001 (cita, servicio, profesional) para la clínica de la
 * sesión (FR-012). No escribe, no modifica, no borra: solo emite SELECT. Todos los cálculos
 * se hacen en la zona de negocio `Europe/Madrid` (FR-013) y los importes en céntimos
 * enteros para cuadrar al céntimo (Principio 2, FR-005).
 *
 * Los números son reproducibles con la semilla determinista (día ref. 2026-09-16, FR-014).
 */

const NUM_SEMANAS_EVOLUCION = 8;

// ---------------------------------------------------------------------------
// Tipos de salida (view models) — ver specs/004-panel-analitica/data-model.md
// ---------------------------------------------------------------------------

export interface IngresosPorServicio {
  servicios: {
    servicio_id: string;
    nombre: string;
    citas_completadas: number;
    ingresos_centimos: number;
    ingresos: string;
  }[];
  total_centimos: number;
  total: string;
  sin_datos: boolean;
}

export interface TasaNoAsistencia {
  profesionales: {
    profesional_id: string;
    nombre: string;
    especialidad: string;
    no_asistidas: number;
    citas_pasadas_con_desenlace: number;
    tasa_porcentaje: number | null;
    tasa_texto: string;
    lectura_literal: string;
  }[];
  nota_efecto_cancelacion: string;
}

export interface OcupacionSemanal {
  semanas: { iso_anio: number; iso_semana: number; etiqueta: string }[];
  series: {
    profesional_id: string;
    nombre: string;
    ocupacion_media: number | null;
    puntos: {
      iso_semana: number;
      iso_anio: number;
      ocupacion_porcentaje: number | null;
      minutos_ocupados: number;
      minutos_jornada: number;
    }[];
  }[];
}

export interface Evolucion {
  semanas: {
    iso_anio: number;
    iso_semana: number;
    etiqueta: string;
    citas_completadas: number;
    ingresos_centimos: number;
    ingresos: string;
  }[];
  sin_datos: boolean;
}

export interface Analitica {
  ingresos_por_servicio: IngresosPorServicio;
  tasa_no_asistencia: TasaNoAsistencia;
  ocupacion_semanal: OcupacionSemanal;
  evolucion: Evolucion;
}

const NOTA_EFECTO_CANCELACION =
  'Al facilitar la cancelación por el paciente, parte de la bajada de esta tasa puede ' +
  'deberse a citas que antes eran ausencias y ahora se cancelan (sube el denominador), no ' +
  'solo a menos ausencias.';

// ---------------------------------------------------------------------------
// Punto de entrada
// ---------------------------------------------------------------------------

/**
 * Calcula los cuatro bloques del panel para la clínica indicada. Solo lectura.
 */
export async function obtenerAnalitica(
  clinicaId: string,
  entrada: AnaliticaEntrada = {},
  db: BaseDatos = obtenerDb(),
): Promise<Analitica> {
  const datos = analiticaSchema.parse(entrada);
  const diaReferencia = resolverDiaReferencia(datos.dia_referencia);

  const [ingresos, tasa, ocupacion, evolucion] = await Promise.all([
    calcularIngresosPorServicio(clinicaId, db),
    calcularTasaNoAsistencia(clinicaId, db),
    calcularOcupacionSemanal(clinicaId, diaReferencia, db),
    calcularEvolucion(clinicaId, diaReferencia, db),
  ]);

  return {
    ingresos_por_servicio: ingresos,
    tasa_no_asistencia: tasa,
    ocupacion_semanal: ocupacion,
    evolucion,
  };
}

/** Día de referencia como instante (mediodía Madrid del día dado, o ahora). */
function resolverDiaReferencia(dia?: string): Date {
  if (!dia) return new Date();
  // Mediodía en Madrid para no depender de saltos de hora.
  const [anio, mes, diaMes] = dia.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, diaMes, 10, 0, 0));
}

// ---------------------------------------------------------------------------
// Bloque 1: Ingresos por servicio (FR-004/FR-005, SC-001) — solo completadas
// ---------------------------------------------------------------------------

async function calcularIngresosPorServicio(
  clinicaId: string,
  db: BaseDatos,
): Promise<IngresosPorServicio> {
  const filas = await db
    .select({
      servicioId: servicio.id,
      nombre: servicio.nombre,
      precioCentimos: servicio.precioCentimos,
      completadas: sql<number>`count(${cita.id})::int`,
    })
    .from(servicio)
    .leftJoin(
      cita,
      and(
        eq(cita.servicioId, servicio.id),
        eq(cita.clinicaId, clinicaId),
        eq(cita.estado, 'completada'),
      ),
    )
    .where(eq(servicio.clinicaId, clinicaId))
    .groupBy(servicio.id, servicio.nombre, servicio.precioCentimos);

  const servicios = filas
    .map((fila) => {
      const ingresosCentimos = fila.completadas * fila.precioCentimos;
      return {
        servicio_id: fila.servicioId,
        nombre: fila.nombre,
        citas_completadas: fila.completadas,
        ingresos_centimos: ingresosCentimos,
        ingresos: formatearEuros(ingresosCentimos),
      };
    })
    .filter((s) => s.citas_completadas > 0)
    .sort((a, b) => b.ingresos_centimos - a.ingresos_centimos);

  const totalCentimos = sumarCentimos(...servicios.map((s) => s.ingresos_centimos));

  return {
    servicios,
    total_centimos: totalCentimos,
    total: formatearEuros(totalCentimos),
    sin_datos: servicios.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Bloque 2: Tasa de no asistencia por profesional (FR-006/FR-006a, SC-004)
// ---------------------------------------------------------------------------

async function calcularTasaNoAsistencia(
  clinicaId: string,
  db: BaseDatos,
): Promise<TasaNoAsistencia> {
  const filas = await db
    .select({
      profesionalId: profesional.id,
      nombre: profesional.nombre,
      especialidad: profesional.especialidad,
      completadas: sql<number>`count(*) filter (where ${cita.estado} = 'completada')::int`,
      canceladas: sql<number>`count(*) filter (where ${cita.estado} = 'cancelada')::int`,
      noAsistidas: sql<number>`count(*) filter (where ${cita.estado} = 'no_asistida')::int`,
    })
    .from(profesional)
    // Solo citas pasadas con desenlace: estado ≠ reservada (FR-006a).
    .leftJoin(
      cita,
      and(
        eq(cita.profesionalId, profesional.id),
        eq(cita.clinicaId, clinicaId),
        ne(cita.estado, 'reservada'),
      ),
    )
    .where(eq(profesional.clinicaId, clinicaId))
    .groupBy(profesional.id, profesional.nombre, profesional.especialidad)
    .orderBy(asc(profesional.nombre));

  const profesionales = filas.map((fila) => {
    const conteos: ConteosPorEstado = {
      completada: fila.completadas,
      cancelada: fila.canceladas,
      no_asistida: fila.noAsistidas,
    };
    const denominador = citasPasadasConDesenlace(conteos);
    const tasa = tasaNoAsistenciaDefA(conteos);
    return {
      profesional_id: fila.profesionalId,
      nombre: fila.nombre,
      especialidad: fila.especialidad,
      no_asistidas: fila.noAsistidas,
      citas_pasadas_con_desenlace: denominador,
      tasa_porcentaje: tasa,
      tasa_texto: formatearPorcentaje(tasa),
      lectura_literal:
        tasa === null
          ? 'Sin citas pasadas todavía para calcular la tasa.'
          : `De cada 100 citas pasadas, unas ${Math.round(tasa)} terminaron en no asistida.`,
    };
  });

  return { profesionales, nota_efecto_cancelacion: NOTA_EFECTO_CANCELACION };
}

// ---------------------------------------------------------------------------
// Bloque 3: Ocupación semanal por profesional (FR-007/FR-007a, SC-005)
// ---------------------------------------------------------------------------

async function calcularOcupacionSemanal(
  clinicaId: string,
  diaReferencia: Date,
  db: BaseDatos,
): Promise<OcupacionSemanal> {
  const semanas = ultimasNSemanas(diaReferencia, NUM_SEMANAS_EVOLUCION);
  const clavesVisibles = new Set(semanas.map(claveSemana));

  const profesionales = await db
    .select({ id: profesional.id, nombre: profesional.nombre })
    .from(profesional)
    .where(eq(profesional.clinicaId, clinicaId))
    .orderBy(asc(profesional.nombre));

  // Minutos ocupados (citas reservada|completada) por profesional y semana ISO.
  const filas = await db
    .select({
      profesionalId: cita.profesionalId,
      inicio: cita.inicio,
      minutos: sql<number>`(extract(epoch from (${cita.fin} - ${cita.inicio})) / 60)::int`,
    })
    .from(cita)
    .where(
      and(
        eq(cita.clinicaId, clinicaId),
        sql`${cita.estado} in ('reservada', 'completada')`,
      ),
    );

  // Acumular minutos por (profesional, semana) solo para semanas visibles.
  const minutosPorClave = new Map<string, number>();
  for (const fila of filas) {
    const semana = semanaIso(fila.inicio);
    const clave = claveSemana(semana);
    if (!clavesVisibles.has(clave)) continue; // descarta semanas futuras y > 8 atrás (FR-007a)
    const clavePunto = `${fila.profesionalId}|${clave}`;
    minutosPorClave.set(clavePunto, (minutosPorClave.get(clavePunto) ?? 0) + fila.minutos);
  }

  const minutosJornada = minutosLaborablesDeSemana();

  const series = profesionales.map((prof) => {
    const puntos = semanas.map((semana) => {
      const minutosOcupados = minutosPorClave.get(`${prof.id}|${claveSemana(semana)}`) ?? 0;
      return {
        iso_anio: semana.isoAnio,
        iso_semana: semana.isoSemana,
        ocupacion_porcentaje: porcentajeOcupacion(minutosOcupados, minutosJornada),
        minutos_ocupados: minutosOcupados,
        minutos_jornada: minutosJornada,
      };
    });
    const validos = puntos
      .map((p) => p.ocupacion_porcentaje)
      .filter((v): v is number => v !== null);
    const media =
      validos.length > 0
        ? redondearUnDecimal(validos.reduce((a, b) => a + b, 0) / validos.length)
        : null;
    return {
      profesional_id: prof.id,
      nombre: prof.nombre,
      ocupacion_media: media,
      puntos,
    };
  });

  return {
    semanas: semanas.map((s) => ({
      iso_anio: s.isoAnio,
      iso_semana: s.isoSemana,
      etiqueta: etiquetaSemana(s),
    })),
    series,
  };
}

// ---------------------------------------------------------------------------
// Bloque 4: Evolución de las últimas 8 semanas (FR-008/FR-009, SC-006)
// ---------------------------------------------------------------------------

async function calcularEvolucion(
  clinicaId: string,
  diaReferencia: Date,
  db: BaseDatos,
): Promise<Evolucion> {
  const semanas = ultimasNSemanas(diaReferencia, NUM_SEMANAS_EVOLUCION);
  const clavesVisibles = new Set(semanas.map(claveSemana));

  const filas = await db
    .select({
      inicio: cita.inicio,
      precioCentimos: servicio.precioCentimos,
    })
    .from(cita)
    .innerJoin(servicio, eq(servicio.id, cita.servicioId))
    .where(and(eq(cita.clinicaId, clinicaId), eq(cita.estado, 'completada')));

  const completadasPorClave = new Map<string, number>();
  const ingresosPorClave = new Map<string, number>();
  for (const fila of filas) {
    const clave = claveSemana(semanaIso(fila.inicio));
    if (!clavesVisibles.has(clave)) continue;
    completadasPorClave.set(clave, (completadasPorClave.get(clave) ?? 0) + 1);
    ingresosPorClave.set(clave, sumarCentimos(ingresosPorClave.get(clave) ?? 0, fila.precioCentimos));
  }

  const semanasSalida = semanas
    .map((semana) => {
      const clave = claveSemana(semana);
      const centimos = ingresosPorClave.get(clave) ?? 0;
      return {
        iso_anio: semana.isoAnio,
        iso_semana: semana.isoSemana,
        etiqueta: etiquetaSemana(semana),
        citas_completadas: completadasPorClave.get(clave) ?? 0,
        ingresos_centimos: centimos,
        ingresos: formatearEuros(centimos),
      };
    })
    // Con menos de 8 semanas de historia, no se inventan semanas vacías (US5.3):
    // se omiten las semanas sin ninguna cita completada.
    .filter((s) => s.citas_completadas > 0);

  return {
    semanas: semanasSalida,
    sin_datos: semanasSalida.length === 0,
  };
}

export { NOTA_EFECTO_CANCELACION };
