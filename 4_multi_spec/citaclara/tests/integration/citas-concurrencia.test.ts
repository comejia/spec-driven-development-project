import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { cita } from '@/src/db/schema';
import { crearCita } from '@/src/services/crear-cita';
import {
  cerrarConexion,
  crearEscenario,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * RN1 / FR-011 — Prueba hostil de concurrencia (Principio 3, INNEGOCIABLE).
 *
 * "Ni siquiera si dos reservas del mismo hueco llegan en el mismo instante": aquí se
 * lanzan altas simultáneas sobre el mismo hueco y se comprueba que exactamente una
 * queda registrada. La garantía la da la restricción de exclusión de PostgreSQL, que el
 * motor evalúa de forma atómica dentro de la transacción; no hay ventana de carrera
 * entre una comprobación previa y la inserción.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

describe('concurrencia sobre el mismo hueco (RN1, FR-011)', () => {
  it('FR-011: dos altas simultáneas del mismo hueco dejan exactamente una cita', async () => {
    const inicio = instanteFuturo('10:00').toISOString();

    const resultados = await Promise.allSettled([
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.ana,
          inicio,
        },
        db,
      ),
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.bruno,
          inicio,
        },
        db,
      ),
    ]);

    const aceptadas = resultados.filter((r) => r.status === 'fulfilled');
    const rechazadas = resultados.filter((r) => r.status === 'rejected');

    expect(aceptadas).toHaveLength(1);
    expect(rechazadas).toHaveLength(1);
    expect(rechazadas[0].reason).toMatchObject({ codigo: 'SOLAPE_PROFESIONAL' });

    const citas = await db.select().from(cita);
    expect(citas).toHaveLength(1);
  });

  it('FR-011: con seis intentos simultáneos del mismo hueco solo uno queda', async () => {
    const inicio = instanteFuturo('11:00').toISOString();
    const pacientes = [
      escenario.pacientes.ana,
      escenario.pacientes.bruno,
      escenario.pacientes.carla,
    ];

    const intentos = Array.from({ length: 6 }, (_, indice) =>
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: pacientes[indice % pacientes.length],
          inicio,
        },
        db,
      ),
    );

    const resultados = await Promise.allSettled(intentos);
    const aceptadas = resultados.filter((r) => r.status === 'fulfilled');

    expect(aceptadas).toHaveLength(1);
    for (const rechazada of resultados.filter((r) => r.status === 'rejected')) {
      expect(rechazada.reason).toMatchObject({
        codigo: expect.stringMatching(/^SOLAPE_(PROFESIONAL|PACIENTE)$/),
      });
    }

    const citas = await db.select().from(cita);
    expect(citas).toHaveLength(1);
    expect(citas[0].estado).toBe('reservada');
  });

  it('FR-011: altas simultáneas que se solapan parcialmente dejan solo una', async () => {
    // 10:00–10:45 y 10:30–11:15 se pisan en 10:30–10:45.
    const resultados = await Promise.allSettled([
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.ana,
          inicio: instanteFuturo('10:00').toISOString(),
        },
        db,
      ),
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.bruno,
          inicio: instanteFuturo('10:30').toISOString(),
        },
        db,
      ),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await db.select().from(cita)).toHaveLength(1);
  });

  it('FR-011: altas simultáneas en huecos adyacentes se aceptan las dos', async () => {
    const resultados = await Promise.allSettled([
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.ana,
          inicio: instanteFuturo('10:00').toISOString(),
        },
        db,
      ),
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.bruno,
          inicio: instanteFuturo('10:45').toISOString(),
        },
        db,
      ),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    expect(await db.select().from(cita)).toHaveLength(2);
  });

  it('FR-011: el hueco queda utilizable tras cancelar la cita que ganó la carrera', async () => {
    const inicio = instanteFuturo('12:00').toISOString();
    const resultados = await Promise.allSettled([
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.ana,
          inicio,
        },
        db,
      ),
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.bruno,
          inicio,
        },
        db,
      ),
    ]);

    const ganadora = resultados.find((r) => r.status === 'fulfilled');
    if (ganadora?.status !== 'fulfilled') throw new Error('Ninguna alta tuvo éxito.');

    await db.update(cita).set({ estado: 'cancelada' }).where(eq(cita.id, ganadora.value.id));

    const nueva = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.carla,
        inicio,
      },
      db,
    );
    expect(nueva.id).toBeDefined();
  });
});
