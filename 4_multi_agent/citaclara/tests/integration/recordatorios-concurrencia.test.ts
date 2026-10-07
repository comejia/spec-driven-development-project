import { afterAll, beforeEach, describe, expect, it } from 'vitest';
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
 * T014 (US1): concurrencia (V4/D2). Dos ejecuciones simultáneas sobre la misma ventana
 * generan como máximo un recordatorio por cita: lo garantiza el índice único
 * `recordatorio_cita_unico` + `ON CONFLICT DO NOTHING`.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

class EmisorNulo implements EmisorCorreo {
  emitir(_mensaje: MensajeCorreo): Promise<ResultadoEmision> {
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

describe('concurrencia: una sola cancelación... digo, un solo recordatorio (V4/D2)', () => {
  it('dos ejecuciones simultáneas no duplican el recordatorio de una cita', async () => {
    const cantidad = 5;
    for (let i = 0; i < cantidad; i += 1) {
      const pacienteId = await crearPacienteCon(escenario.clinicaId, {
        nombre: `Paciente ${i}`,
        telefono: `6000000${String(i).padStart(2, '0')}`,
        email: `paciente${i}@ejemplo.es`,
      });
      await crearCitaDirecta({
        clinicaId: escenario.clinicaId,
        profesionalId: i % 2 === 0 ? escenario.profesionales.maria : escenario.profesionales.jorge,
        servicioId: escenario.servicios.sesionFisio,
        pacienteId,
        inicio: instanteAHoras(REFERENCIA, 30 + i),
      });
    }

    const [a, b] = await Promise.all([
      generarRecordatorios({ referencia: REFERENCIA, db, emisor: new EmisorNulo(), config: CONFIG }),
      generarRecordatorios({ referencia: REFERENCIA, db, emisor: new EmisorNulo(), config: CONFIG }),
    ]);

    // Entre las dos ejecuciones se generan exactamente `cantidad` recordatorios.
    expect(a.generados + b.generados).toBe(cantidad);

    const filas = await db.select().from(recordatorio);
    expect(filas).toHaveLength(cantidad);
    const citasUnicas = new Set(filas.map((f) => f.citaId));
    expect(citasUnicas.size).toBe(cantidad);
  });
});
