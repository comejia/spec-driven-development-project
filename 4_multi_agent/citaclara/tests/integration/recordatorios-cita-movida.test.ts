import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { recordatorio } from '@/src/db/schema';
import { cambiarEstado } from '@/src/services/cambiar-estado';
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
 * T027 (US3): cita movida = nuevo recordatorio (V7/FR-011, DEPENDE de FR-017a de 001).
 * Mover = cancelar la original (vía servicio de 001) + crear una nueva. La nueva (otro
 * cita_id) es elegible por sí misma y recibe su propio y único recordatorio; la original
 * cancelada no genera nada.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

class EmisorNulo implements EmisorCorreo {
  emitir(_m: MensajeCorreo): Promise<ResultadoEmision> {
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

describe('cita movida = nuevo recordatorio (V7/FR-011)', () => {
  it('la cita nueva recibe recordatorio propio; la original cancelada no', async () => {
    const pacienteId = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Diana Movida',
      telefono: '600900900',
      email: 'diana@ejemplo.es',
    });

    // Cita original elegible, ya recordada.
    const original = await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId,
      inicio: instanteAHoras(REFERENCIA, 30),
    });
    const primera = await generarRecordatorios({
      referencia: REFERENCIA,
      db,
      emisor: new EmisorNulo(),
      config: CONFIG,
    });
    expect(primera.generados).toBe(1);

    // "Mover" (FR-017a de 001): cancelar la original + crear una nueva en otro hueco.
    await cambiarEstado(escenario.clinicaId, original, 'cancelada', db);
    const nueva = await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId,
      inicio: instanteAHoras(REFERENCIA, 40),
    });

    const segunda = await generarRecordatorios({
      referencia: REFERENCIA,
      db,
      emisor: new EmisorNulo(),
      config: CONFIG,
    });

    // Solo la cita nueva genera; la original (cancelada) ya no es elegible.
    expect(segunda.generados).toBe(1);

    const deNueva = await db.select().from(recordatorio).where(eq(recordatorio.citaId, nueva));
    const deOriginal = await db
      .select()
      .from(recordatorio)
      .where(eq(recordatorio.citaId, original));
    expect(deNueva).toHaveLength(1);
    expect(deOriginal).toHaveLength(1); // el de la primera ejecución, no se reenvía
  });
});
