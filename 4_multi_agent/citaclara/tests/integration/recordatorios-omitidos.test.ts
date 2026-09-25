import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
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
 * T022 (US2): paciente sin email válido (V5/FR-014). Se registra `resultado = omitido`,
 * NO se escribe `.eml`, y el proceso continúa con el resto sin fallar.
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
  dirSalida = await mkdtemp(join(tmpdir(), 'eml-omit-'));
});

afterEach(async () => {
  await rm(dirSalida, { recursive: true, force: true });
});

afterAll(async () => {
  await cerrarConexion();
});

describe('paciente sin email (V5/FR-014)', () => {
  it('registra omitido sin .eml y continúa con las demás citas', async () => {
    const sinEmail = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Sin Email',
      telefono: '600333333',
      email: null,
    });
    const conEmail = await crearPacienteCon(escenario.clinicaId, {
      nombre: 'Con Email',
      telefono: '600444444',
      email: 'con@ejemplo.es',
    });

    const citaSin = await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId: sinEmail,
      inicio: instanteAHoras(REFERENCIA, 30),
    });
    await crearCitaDirecta({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.jorge,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId: conEmail,
      inicio: instanteAHoras(REFERENCIA, 32),
    });

    const resumen = await generarRecordatorios({
      referencia: REFERENCIA,
      db,
      emisor: new EmisorCorreoEml(dirSalida),
      config: CONFIG,
    });

    expect(resumen.elegibles).toBe(2);
    expect(resumen.generados).toBe(1);
    expect(resumen.omitidos).toBe(1);

    const [filaOmitida] = await db
      .select()
      .from(recordatorio)
      .where(eq(recordatorio.citaId, citaSin));
    expect(filaOmitida.resultado).toBe('omitido');
    expect(filaOmitida.destinoEmail).toBeNull();

    const ficheros = (await readdir(dirSalida)).filter((f) => f.endsWith('.eml'));
    expect(ficheros).toHaveLength(1); // solo la cita con email
  });
});
