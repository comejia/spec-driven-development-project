import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { recordatorio } from '@/src/db/schema';
import { generarRecordatorios } from '@/src/services/generar-recordatorios';
import { ejecutarCli } from '@/src/scripts/generar-recordatorios';
import type { ConfigCorreo } from '@/src/validation/recordatorios';
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
 * T032 (Polish): día sin citas elegibles. El proceso termina sin errores y sin generar
 * recordatorios (edge case de la spec). El código de salida del CLI es 0.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

const REFERENCIA = new Date('2026-10-01T09:00:00.000Z');
let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

describe('día sin citas elegibles', () => {
  it('no genera recordatorios y no falla cuando no hay nada en la ventana', async () => {
    // Una cita fuera de la ventana (a 100h) para que exista pero no sea elegible.
    const pacienteId = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Fuera Ventana',
      telefono: '600999999',
      email: 'fuera@ejemplo.es',
    });
    await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId,
      inicio: instanteAHoras(REFERENCIA, 100),
    });

    const resumen = await generarRecordatorios({ referencia: REFERENCIA, db, config: CONFIG });
    expect(resumen.elegibles).toBe(0);
    expect(resumen.generados).toBe(0);

    const filas = await db.select().from(recordatorio);
    expect(filas).toHaveLength(0);
  });

  it('el CLI con --fecha inválida termina con código distinto de 0', async () => {
    const codigo = await ejecutarCli(['--fecha=no-es-una-fecha']);
    expect(codigo).toBe(1);
  });
});
