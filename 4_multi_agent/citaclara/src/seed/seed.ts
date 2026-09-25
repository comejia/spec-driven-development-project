import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { crearDb, obtenerDb, type BaseDatos } from '@/src/db';
import { cita, clinica, paciente, profesional, servicio, accesoPaciente } from '@/src/db/schema';
import type { EstadoCita } from '@/src/db/schema';
import { calcularFin, fechaEnMadrid, instanteEnMadrid } from '@/src/domain/tiempo';
import {
  APELLIDOS_DEMO,
  CLINICA_DEMO,
  NOMBRES_DEMO,
  PROFESIONALES_DEMO,
  SERVICIOS_DEMO,
  SERVICIOS_POR_ESPECIALIDAD,
} from './datos';

/**
 * Semilla determinista (Principio 5, FR-021, D6).
 *
 * Con la misma semilla se obtiene siempre la misma historia: mismos pacientes, mismas
 * fechas relativas, mismos servicios, mismos importes y mismos estados. Así specs,
 * ejemplos y analítica pueden citar números que cualquiera puede reproducir.
 *
 * La generación respeta por construcción los invariantes de la agenda (Principio 3): las
 * citas de un profesional nunca se solapan (el cursor avanza siempre al fin de la última
 * cita) y un paciente no recibe más de una cita por día (evita el solape de paciente).
 */

export const SEMILLA_POR_DEFECTO = 'citaclara-eleva-2026';

/** Semanas de historia pasada y de reservas futuras que exige la spec. */
export const SEMANAS_PASADAS = 8;
export const SEMANAS_FUTURAS = 2;

/** Número de fichas de paciente (~40 según la spec). */
export const PACIENTES_DEMO = 40;

/** Proporciones de la historia pasada exigidas por la spec. */
const PROPORCION_NO_ASISTIDA = 0.1;
const PROPORCION_CANCELADA = 0.08;

/** Jornada de generación, dentro de la franja visible 08:00–21:00 (FR-016a). */
const JORNADA = { desde: 9 * 60, hasta: 19 * 60 };

/** Huecos posibles entre citas, en minutos (múltiplos de 5, FR-005a). */
const HUECOS_POSIBLES = [0, 15, 30, 45, 60];

// ---------------------------------------------------------------------------
// Generador pseudoaleatorio determinista (mulberry32 con semilla derivada del texto)
// ---------------------------------------------------------------------------

function semillaNumerica(texto: string): number {
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function crearPrng(semilla: string): () => number {
  let estado = semillaNumerica(semilla);
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function elegir<T>(prng: () => number, opciones: readonly T[]): T {
  return opciones[Math.floor(prng() * opciones.length)];
}

/** Alfabeto base64 de bcrypt, para construir una sal reproducible. */
const ALFABETO_BCRYPT = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Sal de bcrypt derivada de la semilla: hace que incluso el hash de la clave sea
 * reproducible, sin dejar de ser un hash real con coste de trabajo.
 */
function salDeterminista(prng: () => number, coste = 10): string {
  let sal = '';
  for (let i = 0; i < 22; i += 1) sal += elegir(prng, [...ALFABETO_BCRYPT]);
  return `$2b$${String(coste).padStart(2, '0')}$${sal}`;
}

/**
 * Token opaco reproducible para la semilla (005 FR-001, research D2/D9). Usa el PRNG
 * determinista en lugar de `node:crypto` para que la misma semilla produzca los mismos
 * tokens. La longitud (48 caracteres base64url) coincide con la forma de `generarToken`.
 */
const ALFABETO_TOKEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function tokenDeterminista(prng: () => number, longitud = 48): string {
  let token = '';
  for (let i = 0; i < longitud; i += 1) token += elegir(prng, [...ALFABETO_TOKEN]);
  return token;
}

// ---------------------------------------------------------------------------
// Semilla
// ---------------------------------------------------------------------------

export interface OpcionesSemilla {
  /** Texto de la semilla: fija la historia por completo. */
  semilla?: string;
  /** Clave de panel de la clínica de demostración (se guarda hasheada). */
  clave?: string;
  /** Día de referencia ("YYYY-MM-DD" en Europe/Madrid). Por defecto, hoy. */
  hoy?: string;
  db?: BaseDatos;
}

export interface ResumenSemilla {
  clinicaId: string;
  clinica: string;
  profesionales: number;
  servicios: number;
  pacientes: number;
  citas: number;
  citasPorEstado: Record<EstadoCita, number>;
  ingresosCompletadasCentimos: number;
  primeraFecha: string;
  ultimaFecha: string;
}

/** Borra todos los datos conservando el esquema y sus invariantes. */
export async function vaciarDatos(db: BaseDatos = obtenerDb()): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE acceso_paciente, cita, paciente, servicio, profesional, clinica RESTART IDENTITY CASCADE`,
  );
}

/** Genera la historia de demostración. Debe ejecutarse sobre una base vacía. */
export async function sembrar(opciones: OpcionesSemilla = {}): Promise<ResumenSemilla> {
  const db = opciones.db ?? obtenerDb();
  const semilla = opciones.semilla ?? process.env.SEED_SEMILLA ?? SEMILLA_POR_DEFECTO;
  const clave = opciones.clave ?? process.env.SEED_CLAVE_CLINICA ?? CLINICA_DEMO.clavePorDefecto;
  const hoy = opciones.hoy ?? fechaEnMadrid(new Date());
  const prng = crearPrng(semilla);

  // 1. Clínica, con la clave siempre hasheada (D5).
  const [clinicaCreada] = await db
    .insert(clinica)
    .values({
      nombre: CLINICA_DEMO.nombre,
      claveHash: bcrypt.hashSync(clave, salDeterminista(prng)),
      telefono: CLINICA_DEMO.telefono,
    })
    .returning({ id: clinica.id });

  // 2. Profesionales y 3. servicios (catálogo literal de la spec).
  const profesionalesCreados = await db
    .insert(profesional)
    .values(PROFESIONALES_DEMO.map((p) => ({ ...p, clinicaId: clinicaCreada.id })))
    .returning({
      id: profesional.id,
      nombre: profesional.nombre,
      especialidad: profesional.especialidad,
    });

  const serviciosCreados = await db
    .insert(servicio)
    .values(SERVICIOS_DEMO.map((s) => ({ ...s, clinicaId: clinicaCreada.id })))
    .returning({
      id: servicio.id,
      nombre: servicio.nombre,
      duracionMin: servicio.duracionMin,
      precioCentimos: servicio.precioCentimos,
    });

  const servicioPorNombre = new Map(serviciosCreados.map((s) => [s.nombre, s]));

  // 4. Pacientes con teléfono único por construcción (FR-004a).
  const fichas = Array.from({ length: PACIENTES_DEMO }, (_, indice) => {
    const nombre = `${elegir(prng, NOMBRES_DEMO)} ${elegir(prng, APELLIDOS_DEMO)}`;
    const telefono = `6${String(10_000_000 + indice * 137_017).padStart(8, '0')}`;
    return {
      clinicaId: clinicaCreada.id,
      nombre,
      telefono,
      email: `paciente${indice + 1}@ejemplo.es`,
    };
  });

  const pacientesCreados = await db
    .insert(paciente)
    .values(fichas)
    .returning({ id: paciente.id });

  // 4b. Un token opaco estable por paciente (005 FR-001). El token se deriva de la semilla
  // para que la historia sea reproducible (Principio 5): misma semilla → mismos tokens.
  await db.insert(accesoPaciente).values(
    pacientesCreados.map((p) => ({
      pacienteId: p.id,
      token: tokenDeterminista(prng),
    })),
  );

  // 5. Historia: 8 semanas pasadas + 2 semanas futuras, de lunes a viernes.
  const citasAInsertar: {
    clinicaId: string;
    profesionalId: string;
    servicioId: string;
    pacienteId: string;
    inicio: Date;
    fin: Date;
    estado: EstadoCita;
  }[] = [];

  const diaInicial = -SEMANAS_PASADAS * 7;
  const diaFinal = SEMANAS_FUTURAS * 7;

  for (let desplazamiento = diaInicial; desplazamiento <= diaFinal; desplazamiento += 1) {
    const fecha = fechaDesplazada(hoy, desplazamiento);
    if (esFinDeSemana(fecha)) continue;

    const esFuturo = desplazamiento > 0;
    // Un paciente como máximo una cita por día: evita el solape de paciente (FR-012a).
    const pacientesDelDia = new Set<string>();

    for (const profesionalDelDia of profesionalesCreados) {
      const nombresServicio = SERVICIOS_POR_ESPECIALIDAD[profesionalDelDia.especialidad] ?? [];
      let minuto = JORNADA.desde + elegir(prng, HUECOS_POSIBLES);

      while (minuto < JORNADA.hasta) {
        const servicioElegido = servicioPorNombre.get(elegir(prng, nombresServicio))!;
        if (minuto + servicioElegido.duracionMin > JORNADA.hasta) break;

        const pacienteElegido = elegirPacienteLibre(prng, pacientesCreados, pacientesDelDia);
        if (!pacienteElegido) break;
        pacientesDelDia.add(pacienteElegido);

        const inicio = instanteEnMadrid(fecha, minutosAHora(minuto));
        citasAInsertar.push({
          clinicaId: clinicaCreada.id,
          profesionalId: profesionalDelDia.id,
          servicioId: servicioElegido.id,
          pacienteId: pacienteElegido,
          inicio,
          fin: calcularFin(inicio, servicioElegido.duracionMin),
          estado: esFuturo ? 'reservada' : estadoPasado(prng),
        });

        // El cursor avanza al fin de la cita: por construcción no hay solapes (RN1).
        minuto += servicioElegido.duracionMin + elegir(prng, HUECOS_POSIBLES);
      }
    }
  }

  // Inserción por lotes para no exceder el límite de parámetros del controlador.
  for (let i = 0; i < citasAInsertar.length; i += 200) {
    await db.insert(cita).values(citasAInsertar.slice(i, i + 200));
  }

  return resumir(clinicaCreada.id, citasAInsertar, serviciosCreados, {
    profesionales: profesionalesCreados.length,
    servicios: serviciosCreados.length,
    pacientes: pacientesCreados.length,
  });
}

/** Vacía la base y vuelve a sembrar: reejecutable, misma semilla → misma historia. */
export async function reiniciarYSembrar(opciones: OpcionesSemilla = {}): Promise<ResumenSemilla> {
  const db = opciones.db ?? obtenerDb();
  await vaciarDatos(db);
  return sembrar({ ...opciones, db });
}

/** Crea un cliente propio a partir de la URL indicada y siembra. */
export async function sembrarEnUrl(
  url: string,
  opciones: Omit<OpcionesSemilla, 'db'> = {},
): Promise<ResumenSemilla> {
  const { db, pool } = crearDb(url);
  try {
    return await reiniciarYSembrar({ ...opciones, db });
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Apoyo
// ---------------------------------------------------------------------------

function estadoPasado(prng: () => number): EstadoCita {
  const sorteo = prng();
  if (sorteo < PROPORCION_NO_ASISTIDA) return 'no_asistida';
  if (sorteo < PROPORCION_NO_ASISTIDA + PROPORCION_CANCELADA) return 'cancelada';
  return 'completada';
}

function elegirPacienteLibre(
  prng: () => number,
  fichas: { id: string }[],
  yaCitados: Set<string>,
): string | undefined {
  for (let intento = 0; intento < 12; intento += 1) {
    const candidato = elegir(prng, fichas).id;
    if (!yaCitados.has(candidato)) return candidato;
  }
  return fichas.find((ficha) => !yaCitados.has(ficha.id))?.id;
}

function minutosAHora(minutos: number): string {
  const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
  return `${horas}:${String(minutos % 60).padStart(2, '0')}`;
}

function fechaDesplazada(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const desplazada = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return desplazada.toISOString().slice(0, 10);
}

function esFinDeSemana(fecha: string): boolean {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return diaSemana === 0 || diaSemana === 6;
}

function resumir(
  clinicaId: string,
  citas: { inicio: Date; servicioId: string; estado: EstadoCita }[],
  servicios: { id: string; precioCentimos: number }[],
  totales: { profesionales: number; servicios: number; pacientes: number },
): ResumenSemilla {
  const precioPorServicio = new Map(servicios.map((s) => [s.id, s.precioCentimos]));
  const citasPorEstado: Record<EstadoCita, number> = {
    reservada: 0,
    completada: 0,
    cancelada: 0,
    no_asistida: 0,
  };
  let ingresos = 0;

  for (const unaCita of citas) {
    citasPorEstado[unaCita.estado] += 1;
    if (unaCita.estado === 'completada') {
      ingresos += precioPorServicio.get(unaCita.servicioId) ?? 0;
    }
  }

  const fechas = citas.map((c) => fechaEnMadrid(c.inicio)).sort((a, b) => a.localeCompare(b));

  return {
    clinicaId,
    clinica: CLINICA_DEMO.nombre,
    profesionales: totales.profesionales,
    servicios: totales.servicios,
    pacientes: totales.pacientes,
    citas: citas.length,
    citasPorEstado,
    ingresosCompletadasCentimos: ingresos,
    primeraFecha: fechas[0] ?? '',
    ultimaFecha: fechas.at(-1) ?? '',
  };
}
