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
 * T013 (US1): idempotencia por cita (V3/FR-003/SC-001). Reejecutar el proceso con la misma
 * referencia, o al día siguiente mientras la cita sigue en ventana, no genera duplicados.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

class EmisorContador implements EmisorCorreo {
  emisiones = 0;
  emitir(_mensaje: MensajeCorreo): Promise<ResultadoEmision> {
    this.emisiones += 1;
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

async function citaElegible() {
  const pacienteId = await crearPacienteCon(escenario.clinicaId, {
    nombre: 'Diana Elegible',
    telefono: '600900900',
    email: 'diana@ejemplo.es',
  });
  return crearCitaDirecta({
    clinicaId: escenario.clinicaId,
    profesionalId: escenario.profesionales.maria,
    servicioId: escenario.servicios.sesionFisio,
    pacienteId,
    inicio: instanteAHoras(REFERENCIA, 36),
  });
}

describe('idempotencia por cita (V3/FR-003)', () => {
  it('reejecutar con la misma fecha no genera recordatorios ni emisiones adicionales', async () => {
    await citaElegible();
    const emisor = new EmisorContador();

    const primera = await generarRecordatorios({ referencia: REFERENCIA, db, emisor, config: CONFIG });
    expect(primera.generados).toBe(1);
    expect(emisor.emisiones).toBe(1);

    const segunda = await generarRecordatorios({ referencia: REFERENCIA, db, emisor, config: CONFIG });
    expect(segunda.generados).toBe(0);
    expect(segunda.yaRecordados).toBe(1);
    expect(emisor.emisiones).toBe(1); // no vuelve a emitir

    const filas = await db.select().from(recordatorio);
    expect(filas).toHaveLength(1);
  });

  it('al día siguiente, con la cita aún en ventana, tampoco reenvía', async () => {
    await citaElegible();

    await generarRecordatorios({ referencia: REFERENCIA, db, config: CONFIG });
    // Referencia +24h: la cita (a 36h de REFERENCIA) queda a 12h → ya no elegible, pero
    // aunque lo fuera, la idempotencia por cita impide un segundo recordatorio.
    const diaSiguiente = new Date(REFERENCIA.getTime() + 24 * 60 * 60 * 1000);
    const segunda = await generarRecordatorios({ referencia: diaSiguiente, db, config: CONFIG });
    expect(segunda.generados).toBe(0);

    const filas = await db.select().from(recordatorio);
    expect(filas).toHaveLength(1);
  });
});
