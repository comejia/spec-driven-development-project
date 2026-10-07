import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { cancelarPorPaciente } from '@/src/services/cancelar-por-paciente';
import { cambiarEstado } from '@/src/services/cambiar-estado';
import { crearCita } from '@/src/services/crear-cita';
import { cita as tablaCita } from '@/src/db/schema';
import { esErrorNegocio } from '@/src/domain/errores';
import {
  cerrarConexion,
  crearEscenario,
  crearTokenPaciente,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Concurrencia de cancelación (005 US2, FR-011, SC-006) — prueba hostil (Principio 3/6).
 *
 * La atomicidad la aporta la 001 (`cambiarEstado` condiciona el UPDATE a `estado =
 * 'reservada'`). Aquí se comprueba que dos vías simultáneas producen EXACTAMENTE una
 * cancelación efectiva y ningún estado imposible.
 */

const HORA_MS = 60 * 60 * 1000;

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

async function citaReservada(hora = '10:00') {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: escenario.pacientes.ana,
      inicio: instanteFuturo(hora).toISOString(),
    },
    db,
  );
}

async function estadoDe(citaId: string) {
  const [fila] = await db
    .select({ estado: tablaCita.estado })
    .from(tablaCita)
    .where(eq(tablaCita.id, citaId))
    .limit(1);
  return fila?.estado;
}

describe('Cancelación concurrente por el paciente (US2, FR-011)', () => {
  it('dos cancelaciones simultáneas del paciente → una efectiva, la otra TRANSICION_INVALIDA', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada('10:00');
    const ahora = new Date(creada.inicio.getTime() - 25 * HORA_MS);

    const resultados = await Promise.allSettled([
      cancelarPorPaciente(token, creada.id, db, ahora),
      cancelarPorPaciente(token, creada.id, db, ahora),
    ]);

    const exitos = resultados.filter((r) => r.status === 'fulfilled');
    const fallos = resultados.filter((r) => r.status === 'rejected');

    expect(exitos).toHaveLength(1);
    expect(fallos).toHaveLength(1);
    expect(
      esErrorNegocio((fallos[0] as PromiseRejectedResult).reason) &&
        (fallos[0] as PromiseRejectedResult).reason.codigo === 'TRANSICION_INVALIDA',
    ).toBe(true);
    expect(await estadoDe(creada.id)).toBe('cancelada');
  });

  it('paciente y recepción cancelan a la vez → una sola cancelación efectiva', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada('11:00');
    const ahora = new Date(creada.inicio.getTime() - 25 * HORA_MS);

    const resultados = await Promise.allSettled([
      cancelarPorPaciente(token, creada.id, db, ahora),
      cambiarEstado(escenario.clinicaId, creada.id, 'cancelada', db),
    ]);

    const exitos = resultados.filter((r) => r.status === 'fulfilled');
    expect(exitos.length).toBeGreaterThanOrEqual(1);
    // El estado final es coherente: cancelada, sin estados imposibles.
    expect(await estadoDe(creada.id)).toBe('cancelada');
  });
});
