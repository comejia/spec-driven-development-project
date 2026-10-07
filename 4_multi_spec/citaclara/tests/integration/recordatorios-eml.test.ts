import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { recordatorio } from '@/src/db/schema';
import { generarRecordatorios } from '@/src/services/generar-recordatorios';
import { EmisorCorreoEml } from '@/src/services/correo/emisor-eml';
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
 * T021 (US2): correspondencia 1:1 (V10/SC-005). El nº de ficheros `.eml` coincide con el
 * nº de filas `recordatorio` con resultado ∈ {simulado, enviado}; los `omitido` no crean `.eml`.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

const REFERENCIA = new Date('2026-10-01T09:00:00.000Z');
let escenario: EscenarioClinica;
let dirSalida: string;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
  dirSalida = await mkdtemp(join(tmpdir(), 'eml-'));
});

afterEach(async () => {
  await rm(dirSalida, { recursive: true, force: true });
});

afterAll(async () => {
  await cerrarConexion();
});

describe('correspondencia 1:1 entre .eml y recordatorio (V10/SC-005)', () => {
  it('genera un .eml por cada recordatorio simulado y ninguno para omitidos', async () => {
    // 2 con email (simulado) + 1 sin email (omitido).
    const conEmail1 = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Con Email Uno',
      telefono: '600111111',
      email: 'uno@ejemplo.es',
    });
    const conEmail2 = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Con Email Dos',
      telefono: '600222222',
      email: 'dos@ejemplo.es',
    });
    const sinEmail = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Sin Email',
      telefono: '600333333',
      email: null,
    });

    for (const [i, pacienteId] of [conEmail1, conEmail2, sinEmail].entries()) {
      await crearCitaDirecta({
        clinicaId: escenario.clinicaId,
        profesionalId: escenario.profesionales.maria,
        servicioId: escenario.servicios.sesionFisio,
        pacienteId,
        inicio: instanteAHoras(REFERENCIA, 30 + i),
      });
    }

    const resumen = await generarRecordatorios({
      referencia: REFERENCIA,
      db,
      emisor: new EmisorCorreoEml(dirSalida),
      config: CONFIG,
    });

    expect(resumen.generados).toBe(2);
    expect(resumen.omitidos).toBe(1);

    const ficheros = (await readdir(dirSalida)).filter((f) => f.endsWith('.eml'));
    const filasConEml = await db
      .select()
      .from(recordatorio)
      .where(inArray(recordatorio.resultado, ['simulado', 'enviado']));

    expect(ficheros).toHaveLength(filasConEml.length);
    expect(ficheros).toHaveLength(2);
  });
});
