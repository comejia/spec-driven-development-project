import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { inject } from 'vitest';
import { crearDb, type BaseDatos } from '@/src/db';
import { clinica, paciente, profesional, servicio } from '@/src/db/schema';
import { CLINICA_DEMO, PROFESIONALES_DEMO, SERVICIOS_DEMO } from '@/src/seed/datos';
import { fechaEnMadrid, instanteEnMadrid } from '@/src/domain/tiempo';
import { COOKIE_SESION, firmarSesion } from '@/src/services/session';

/**
 * Ayudas comunes de la suite de integración: conexión a la base efímera, limpieza entre
 * pruebas y un escenario de clínica con los datos del catálogo de demostración.
 */

// El entorno debe quedar listo antes de que cualquier servicio abra su conexión.
process.env.DATABASE_URL = inject('databaseUrl');
process.env.SESSION_SECRET ??= 'secreto-de-pruebas-citaclara-0123456789';

export const URL_BASE_DATOS = process.env.DATABASE_URL;

const { db, pool } = crearDb(URL_BASE_DATOS);

export { db, pool };

export async function cerrarConexion(): Promise<void> {
  await pool.end();
}

/** Vacía todas las tablas conservando el esquema y sus invariantes. */
export async function limpiarBase(cliente: BaseDatos = db): Promise<void> {
  await cliente.execute(
    sql`TRUNCATE TABLE cita, paciente, servicio, profesional, clinica RESTART IDENTITY CASCADE`,
  );
}

export interface EscenarioClinica {
  clinicaId: string;
  claveEnClaro: string;
  profesionales: { maria: string; jorge: string; lucia: string };
  servicios: {
    /** 45 min, 40,00 € */
    sesionFisio: string;
    /** 60 min, 50,00 € */
    primeraFisio: string;
    /** 30 min, 35,00 € */
    consultaNutricion: string;
    /** 45 min, 45,00 € */
    primeraNutricion: string;
  };
  pacientes: { ana: string; bruno: string; carla: string };
}

/**
 * Crea la Clínica Eleva con sus 3 profesionales, sus 4 servicios y 3 pacientes.
 * Devuelve los identificadores necesarios para las pruebas.
 */
export async function crearEscenario(cliente: BaseDatos = db): Promise<EscenarioClinica> {
  const [filaClinica] = await cliente
    .insert(clinica)
    .values({
      nombre: CLINICA_DEMO.nombre,
      claveHash: bcrypt.hashSync(CLINICA_DEMO.clavePorDefecto, 8),
    })
    .returning({ id: clinica.id });

  const profesionalesInsertados = await cliente
    .insert(profesional)
    .values(PROFESIONALES_DEMO.map((p) => ({ ...p, clinicaId: filaClinica.id })))
    .returning({ id: profesional.id, nombre: profesional.nombre });

  const serviciosInsertados = await cliente
    .insert(servicio)
    .values(SERVICIOS_DEMO.map((s) => ({ ...s, clinicaId: filaClinica.id })))
    .returning({ id: servicio.id, nombre: servicio.nombre });

  const pacientesInsertados = await cliente
    .insert(paciente)
    .values([
      { clinicaId: filaClinica.id, nombre: 'Ana Belmonte', telefono: '600111222' },
      { clinicaId: filaClinica.id, nombre: 'Bruno Cañas', telefono: '600333444' },
      { clinicaId: filaClinica.id, nombre: 'Carla Duarte', telefono: '600555666' },
    ])
    .returning({ id: paciente.id, nombre: paciente.nombre });

  const idProfesional = (nombre: string) =>
    profesionalesInsertados.find((p) => p.nombre === nombre)!.id;
  const idServicio = (nombre: string) => serviciosInsertados.find((s) => s.nombre === nombre)!.id;
  const idPaciente = (nombre: string) => pacientesInsertados.find((p) => p.nombre === nombre)!.id;

  return {
    clinicaId: filaClinica.id,
    claveEnClaro: CLINICA_DEMO.clavePorDefecto,
    profesionales: {
      maria: idProfesional('María Ferrer'),
      jorge: idProfesional('Jorge Nieto'),
      lucia: idProfesional('Lucía Prados'),
    },
    servicios: {
      sesionFisio: idServicio('Sesión de fisioterapia'),
      primeraFisio: idServicio('Primera visita de fisioterapia'),
      consultaNutricion: idServicio('Consulta de nutrición'),
      primeraNutricion: idServicio('Primera visita de nutrición'),
    },
    pacientes: {
      ana: idPaciente('Ana Belmonte'),
      bruno: idPaciente('Bruno Cañas'),
      carla: idPaciente('Carla Duarte'),
    },
  };
}

/** Fecha futura estable (30 días) para no chocar con RN2 (FR-013). */
export function fechaFutura(diasDesdeHoy = 30): string {
  const instante = new Date(Date.now() + diasDesdeHoy * 24 * 60 * 60 * 1000);
  return fechaEnMadrid(instante);
}

/** Instante futuro en hora de Madrid, en tramos válidos de 5 minutos. */
export function instanteFuturo(hora: string, diasDesdeHoy = 30): Date {
  return instanteEnMadrid(fechaFutura(diasDesdeHoy), hora);
}

/** Fecha pasada estable para probar RN2 (FR-013). */
export function fechaPasada(diasAtras = 30): string {
  return fechaEnMadrid(new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000));
}

/** Cabecera `Cookie` con una sesión de clínica válida (FR-018). */
export function cabeceraSesion(clinicaId: string): Record<string, string> {
  return { cookie: `${COOKIE_SESION}=${encodeURIComponent(firmarSesion(clinicaId))}` };
}
