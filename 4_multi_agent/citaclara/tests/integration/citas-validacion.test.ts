import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { cita } from '@/src/db/schema';
import { instanteEnMadrid } from '@/src/domain/tiempo';
import { crearCita } from '@/src/services/crear-cita';
import {
  cerrarConexion,
  crearEscenario,
  db,
  fechaPasada,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * RN2 (FR-013): no se pueden crear citas en el pasado.
 * FR-014: se rechazan las altas con datos incompletos o con paciente inexistente.
 * FR-005a: la hora de inicio debe ir en tramos de 5 minutos.
 */

let escenario: EscenarioClinica;

const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function entradaValida(sobrescribir: Record<string, unknown> = {}) {
  return {
    profesional_id: escenario.profesionales.maria,
    servicio_id: escenario.servicios.sesionFisio,
    paciente_id: escenario.pacientes.ana,
    inicio: instanteFuturo('10:00').toISOString(),
    ...sobrescribir,
  };
}

describe('RN2 — no hay citas en el pasado (FR-013)', () => {
  it('FR-013: rechaza una cita con inicio anterior a ahora', async () => {
    await expect(
      crearCita(
        escenario.clinicaId,
        entradaValida({ inicio: instanteEnMadrid(fechaPasada(1), '10:00').toISOString() }),
        db,
      ),
    ).rejects.toMatchObject({ codigo: 'CITA_EN_PASADO' });
  });

  it('FR-013: rechaza una cita de hace un minuto', async () => {
    const haceUnMinuto = new Date(Math.floor((Date.now() - 60_000) / 300_000) * 300_000);
    await expect(
      crearCita(escenario.clinicaId, entradaValida({ inicio: haceUnMinuto.toISOString() }), db),
    ).rejects.toMatchObject({ codigo: 'CITA_EN_PASADO' });
  });

  it('FR-013: no deja rastro en la agenda cuando rechaza por pasado', async () => {
    await expect(
      crearCita(
        escenario.clinicaId,
        entradaValida({ inicio: instanteEnMadrid(fechaPasada(3), '09:00').toISOString() }),
        db,
      ),
    ).rejects.toThrow();
    expect(await db.select().from(cita)).toHaveLength(0);
  });
});

describe('FR-005a — granularidad de 5 minutos', () => {
  it('FR-005a: rechaza un inicio a las 10:07', async () => {
    await expect(
      crearCita(
        escenario.clinicaId,
        entradaValida({ inicio: instanteFuturo('10:07').toISOString() }),
        db,
      ),
    ).rejects.toMatchObject({ codigo: 'GRANULARIDAD_INVALIDA' });
  });

  it('FR-005a: rechaza un inicio con segundos', async () => {
    const conSegundos = new Date(instanteFuturo('10:00').getTime() + 30_000);
    await expect(
      crearCita(escenario.clinicaId, entradaValida({ inicio: conSegundos.toISOString() }), db),
    ).rejects.toMatchObject({ codigo: 'GRANULARIDAD_INVALIDA' });
  });
});

describe('FR-014 — datos incompletos o inexistentes', () => {
  it('FR-014: rechaza el alta sin profesional, servicio, paciente o inicio', async () => {
    for (const campo of ['profesional_id', 'servicio_id', 'paciente_id', 'inicio']) {
      const entrada = entradaValida();
      delete (entrada as Record<string, unknown>)[campo];
      await expect(crearCita(escenario.clinicaId, entrada as never, db)).rejects.toThrow();
    }
  });

  it('FR-014: rechaza el alta con un paciente que no está fichado', async () => {
    await expect(
      crearCita(escenario.clinicaId, entradaValida({ paciente_id: UUID_INEXISTENTE }), db),
    ).rejects.toMatchObject({ codigo: 'PACIENTE_NO_EXISTE' });
  });

  it('FR-014: rechaza el alta con un profesional que no existe', async () => {
    await expect(
      crearCita(escenario.clinicaId, entradaValida({ profesional_id: UUID_INEXISTENTE }), db),
    ).rejects.toMatchObject({ codigo: 'PROFESIONAL_NO_EXISTE' });
  });

  it('FR-014: rechaza el alta con un servicio que no existe', async () => {
    await expect(
      crearCita(escenario.clinicaId, entradaValida({ servicio_id: UUID_INEXISTENTE }), db),
    ).rejects.toMatchObject({ codigo: 'SERVICIO_NO_EXISTE' });
  });

  it('aísla las clínicas: no se puede citar a un paciente de otra clínica', async () => {
    const otraClinica = await crearEscenario();
    await expect(
      crearCita(escenario.clinicaId, entradaValida({ paciente_id: otraClinica.pacientes.ana }), db),
    ).rejects.toMatchObject({ codigo: 'PACIENTE_NO_EXISTE' });
  });

  it('aísla las clínicas: no se puede citar con un profesional de otra clínica', async () => {
    const otraClinica = await crearEscenario();
    await expect(
      crearCita(
        escenario.clinicaId,
        entradaValida({ profesional_id: otraClinica.profesionales.maria }),
        db,
      ),
    ).rejects.toMatchObject({ codigo: 'PROFESIONAL_NO_EXISTE' });
  });
});
