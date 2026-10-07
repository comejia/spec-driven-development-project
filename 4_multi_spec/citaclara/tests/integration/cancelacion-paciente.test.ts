import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { cancelarPorPaciente } from '@/src/services/cancelar-por-paciente';
import { crearCita } from '@/src/services/crear-cita';
import { cambiarEstado } from '@/src/services/cambiar-estado';
import { cita as tablaCita } from '@/src/db/schema';
import { esErrorNegocio, ErrorNegocio } from '@/src/domain/errores';
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
 * Cancelación por el paciente (005 US2/US3, FR-008/009/010, SC-004/005).
 *
 * La cita se crea 30 días en el futuro (RN2 de 001). Para probar dentro/fuera de la
 * ventana se pasa un `ahora` simulado relativo al inicio de la cita.
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

async function citaReservada(pacienteId: string, hora = '10:00') {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: pacienteId,
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

describe('Cancelación por el paciente dentro de plazo (US2)', () => {
  it('cancela una reservada con ≥ 24 h y la deja en cancelada (FR-010, SC-004)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada(escenario.pacientes.ana);

    const ahora = new Date(creada.inicio.getTime() - 25 * HORA_MS);
    const resultado = await cancelarPorPaciente(token, creada.id, db, ahora);

    expect(resultado.estado).toBe('cancelada');
    expect(await estadoDe(creada.id)).toBe('cancelada');
  });

  it('el hueco liberado admite una nueva cita en el mismo profesional y franja (SC-005)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada(escenario.pacientes.ana, '10:00');
    const ahora = new Date(creada.inicio.getTime() - 25 * HORA_MS);
    await cancelarPorPaciente(token, creada.id, db, ahora);

    // Reutilizar el hueco no debe provocar solape (el hueco quedó libre).
    const nueva = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.bruno,
        inicio: creada.inicio.toISOString(),
      },
      db,
    );
    expect(nueva.id).toBeTruthy();
    expect(nueva.estado).toBe('reservada');
  });

  it('cancelar de nuevo una cita ya cancelada no procede (FR-009/011)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada(escenario.pacientes.ana);
    const ahora = new Date(creada.inicio.getTime() - 25 * HORA_MS);
    await cancelarPorPaciente(token, creada.id, db, ahora);

    await expect(cancelarPorPaciente(token, creada.id, db, ahora)).rejects.toSatisfy(
      (e: unknown) => esErrorNegocio(e) && (e as ErrorNegocio).codigo === 'TRANSICION_INVALIDA',
    );
  });
});

describe('Bloqueo de cancelación dentro de la ventana (US3)', () => {
  it('rechaza cancelar a < 24 h con FUERA_DE_PLAZO y no cambia nada (FR-008)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada(escenario.pacientes.ana);

    const ahora = new Date(creada.inicio.getTime() - 23 * HORA_MS);
    await expect(cancelarPorPaciente(token, creada.id, db, ahora)).rejects.toSatisfy(
      (e: unknown) => esErrorNegocio(e) && (e as ErrorNegocio).codigo === 'FUERA_DE_PLAZO',
    );
    expect(await estadoDe(creada.id)).toBe('reservada');
  });

  it('rechaza cancelar una cita ya iniciada/pasada con FUERA_DE_PLAZO (FR-008)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada(escenario.pacientes.ana);

    const ahora = new Date(creada.inicio.getTime() + 1 * HORA_MS);
    await expect(cancelarPorPaciente(token, creada.id, db, ahora)).rejects.toSatisfy(
      (e: unknown) => esErrorNegocio(e) && (e as ErrorNegocio).codigo === 'FUERA_DE_PLAZO',
    );
    expect(await estadoDe(creada.id)).toBe('reservada');
  });

  it('rechaza cancelar una cita en estado no reservada con TRANSICION_INVALIDA (FR-009)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const creada = await citaReservada(escenario.pacientes.ana);
    // Recepción la marca completada (001).
    await cambiarEstado(escenario.clinicaId, creada.id, 'completada', db);

    const ahora = new Date(creada.inicio.getTime() - 25 * HORA_MS);
    await expect(cancelarPorPaciente(token, creada.id, db, ahora)).rejects.toSatisfy(
      (e: unknown) => esErrorNegocio(e) && (e as ErrorNegocio).codigo === 'TRANSICION_INVALIDA',
    );
    expect(await estadoDe(creada.id)).toBe('completada');
  });

  it('un token no da acceso a cancelar la cita de otro paciente (FR-003)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const ajena = await citaReservada(escenario.pacientes.bruno);

    const ahora = new Date(ajena.inicio.getTime() - 25 * HORA_MS);
    await expect(cancelarPorPaciente(token, ajena.id, db, ahora)).rejects.toSatisfy((e: unknown) =>
      esErrorNegocio(e),
    );
    expect(await estadoDe(ajena.id)).toBe('reservada');
  });
});
