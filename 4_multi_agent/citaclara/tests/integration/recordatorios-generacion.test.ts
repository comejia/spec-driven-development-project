import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { recordatorio } from '@/src/db/schema';
import { generarRecordatorios } from '@/src/services/generar-recordatorios';
import type { ConfigCorreo } from '@/src/validation/recordatorios';
import type { EmisorCorreo, MensajeCorreo, ResultadoEmision } from '@/src/services/correo/emisor';
import {
  cerrarConexion,
  crearCitaDirecta,
  crearEscenario,
  crearPacienteCon,
  db,
  instanteAHoras,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * T012 (US1): generación en ventana 24-48 h (V1/FR-001/FR-012) y exclusión por estado
 * (V2/FR-002). Emisor en memoria: US1 no necesita el `.eml` real.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

class EmisorEnMemoria implements EmisorCorreo {
  readonly emitidos: MensajeCorreo[] = [];
  emitir(mensaje: MensajeCorreo): Promise<ResultadoEmision> {
    this.emitidos.push(mensaje);
    return Promise.resolve({});
  }
}

const REFERENCIA = new Date('2026-10-01T09:00:00.000Z');
let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

async function pacienteConEmail() {
  return crearPacienteCon(escenario.clinicaId, {
    nombre: 'Diana Elegible',
    telefono: '600900900',
    email: 'diana@ejemplo.es',
  });
}

describe('generación de recordatorios en ventana (V1) y exclusión por estado (V2)', () => {
  it('genera exactamente un recordatorio por cita reservada dentro de la ventana', async () => {
    const pacienteId = await pacienteConEmail();
    await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId,
      inicio: instanteAHoras(REFERENCIA, 36),
    });

    const emisor = new EmisorEnMemoria();
    const resumen = await generarRecordatorios({ referencia: REFERENCIA, db, emisor, config: CONFIG });

    expect(resumen.elegibles).toBe(1);
    expect(resumen.generados).toBe(1);
    expect(emisor.emitidos).toHaveLength(1);

    const filas = await db.select().from(recordatorio);
    expect(filas).toHaveLength(1);
    expect(filas[0].resultado).toBe('simulado');
  });

  it('no genera para citas fuera de la ventana (antes de 24h o desde 48h)', async () => {
    const pacienteId = await pacienteConEmail();
    await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId,
      inicio: instanteAHoras(REFERENCIA, 12),
    });
    await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.jorge,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId,
      inicio: instanteAHoras(REFERENCIA, 60),
    });

    const resumen = await generarRecordatorios({ referencia: REFERENCIA, db, config: CONFIG });
    expect(resumen.elegibles).toBe(0);
    expect(resumen.generados).toBe(0);
  });

  it('excluye citas en estado cancelada, completada o no_asistida (FR-002)', async () => {
    const pacienteId = await pacienteConEmail();
    for (const estado of ['cancelada', 'completada', 'no_asistida'] as const) {
      await crearCitaDirecta({
        clinicaId: escenario.clinicaId,
        profesionalId: escenario.profesionales.maria,
        servicioId: escenario.servicios.sesionFisio,
        pacienteId,
        inicio: instanteAHoras(REFERENCIA, 30),
        estado,
      });
    }

    const resumen = await generarRecordatorios({ referencia: REFERENCIA, db, config: CONFIG });
    expect(resumen.elegibles).toBe(0);
    const filas = await db.select().from(recordatorio);
    expect(filas).toHaveLength(0);
  });

  it('genera un recordatorio por cada cita elegible sin mezclar datos', async () => {
    const ana = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Ana Uno',
      telefono: '600111000',
      email: 'ana@ejemplo.es',
    });
    const beto = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Beto Dos',
      telefono: '600222000',
      email: 'beto@ejemplo.es',
    });
    const citaAna = await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId: ana,
      inicio: instanteAHoras(REFERENCIA, 30),
    });
    const citaBeto = await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.jorge,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId: beto,
      inicio: instanteAHoras(REFERENCIA, 40),
    });

    const emisor = new EmisorEnMemoria();
    const resumen = await generarRecordatorios({ referencia: REFERENCIA, db, emisor, config: CONFIG });

    expect(resumen.generados).toBe(2);
    const destinos = emisor.emitidos.map((m) => m.destinoEmail).sort();
    expect(destinos).toEqual(['ana@ejemplo.es', 'beto@ejemplo.es']);

    const filasAna = await db.select().from(recordatorio).where(eq(recordatorio.citaId, citaAna));
    const filasBeto = await db.select().from(recordatorio).where(eq(recordatorio.citaId, citaBeto));
    expect(filasAna).toHaveLength(1);
    expect(filasBeto).toHaveLength(1);
  });
});
