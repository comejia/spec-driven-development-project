import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { cita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
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
 * RN1 — El solape es el fallo capital (Principio 3, FR-010, FR-012).
 *
 * Pruebas hostiles que intentan provocar activamente un solape en el mismo profesional:
 * solape parcial por ambos lados, solape total, contención y el caso frontera de citas
 * adyacentes (que NO deben solapar). La garantía la aplica la restricción de exclusión
 * de PostgreSQL, no una comprobación de aplicación.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

/** Cita de María de 10:00 a 10:45 (sesión de fisioterapia, 45 min). */
async function citaDeReferencia() {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: escenario.pacientes.ana,
      inicio: instanteFuturo('10:00').toISOString(),
    },
    db,
  );
}

/** Intento de alta para María con otro paciente, para aislar el solape del profesional. */
function intentarConMaria(hora: string, servicioId = escenario.servicios.sesionFisio) {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: servicioId,
      paciente_id: escenario.pacientes.bruno,
      inicio: instanteFuturo(hora).toISOString(),
    },
    db,
  );
}

describe('anti-solape del profesional (RN1, FR-010/012)', () => {
  it('FR-010: rechaza el solape parcial que empieza dentro de la cita existente', async () => {
    await citaDeReferencia();
    // 10:30–11:15 pisa el tramo 10:30–10:45.
    await expect(intentarConMaria('10:30')).rejects.toMatchObject({
      codigo: 'SOLAPE_PROFESIONAL',
    });
  });

  it('FR-010: rechaza el solape parcial que termina dentro de la cita existente', async () => {
    await citaDeReferencia();
    // 09:30–10:15 pisa el tramo 10:00–10:15.
    await expect(intentarConMaria('09:30')).rejects.toMatchObject({
      codigo: 'SOLAPE_PROFESIONAL',
    });
  });

  it('FR-010: rechaza el solape exacto (mismo inicio y misma duración)', async () => {
    await citaDeReferencia();
    await expect(intentarConMaria('10:00')).rejects.toBeInstanceOf(ErrorNegocio);
  });

  it('FR-010: rechaza la contención (una cita corta dentro de otra más larga)', async () => {
    // Primera visita de Jorge: 10:00–11:00 (60 min).
    await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.jorge,
        servicio_id: escenario.servicios.primeraFisio,
        paciente_id: escenario.pacientes.ana,
        inicio: instanteFuturo('10:00').toISOString(),
      },
      db,
    );

    // Consulta de 30 min de 10:15 a 10:45: contenida por completo.
    await expect(
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.jorge,
          servicio_id: escenario.servicios.consultaNutricion,
          paciente_id: escenario.pacientes.bruno,
          inicio: instanteFuturo('10:15').toISOString(),
        },
        db,
      ),
    ).rejects.toMatchObject({ codigo: 'SOLAPE_PROFESIONAL' });
  });

  it('FR-010: rechaza una cita que contiene por completo a la existente', async () => {
    // Consulta de 30 min de María: 10:00–10:30.
    await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.consultaNutricion,
        paciente_id: escenario.pacientes.ana,
        inicio: instanteFuturo('10:00').toISOString(),
      },
      db,
    );

    // Primera visita de 60 min de 09:45 a 10:45: engloba la anterior.
    await expect(intentarConMaria('09:45', escenario.servicios.primeraFisio)).rejects.toMatchObject({
      codigo: 'SOLAPE_PROFESIONAL',
    });
  });

  it('FR-012: acepta la cita adyacente que empieza justo al terminar la anterior', async () => {
    await citaDeReferencia();
    const adyacente = await intentarConMaria('10:45');
    expect(adyacente.id).toBeDefined();
  });

  it('FR-012: acepta la cita adyacente que termina justo al empezar la existente', async () => {
    await citaDeReferencia();
    // Consulta de 30 min de 09:30 a 10:00.
    const adyacente = await intentarConMaria('09:30', escenario.servicios.consultaNutricion);
    expect(adyacente.id).toBeDefined();
  });

  it('el solape solo afecta al mismo profesional: otro profesional puede usar el hueco', async () => {
    await citaDeReferencia();
    const deJorge = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.jorge,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.bruno,
        inicio: instanteFuturo('10:00').toISOString(),
      },
      db,
    );
    expect(deJorge.id).toBeDefined();
  });

  it('FR-010: una cita cancelada libera el hueco y la nueva se acepta', async () => {
    const referencia = await citaDeReferencia();
    await db.update(cita).set({ estado: 'cancelada' }).where(eq(cita.id, referencia.id));

    const nueva = await intentarConMaria('10:00');
    expect(nueva.id).not.toBe(referencia.id);
  });

  it('FR-010: una cita completada sigue bloqueando el hueco', async () => {
    const referencia = await citaDeReferencia();
    await db.update(cita).set({ estado: 'completada' }).where(eq(cita.id, referencia.id));

    await expect(intentarConMaria('10:00')).rejects.toMatchObject({
      codigo: 'SOLAPE_PROFESIONAL',
    });
  });

  it('tras rechazar un solape, la agenda conserva exactamente una cita', async () => {
    await citaDeReferencia();
    await expect(intentarConMaria('10:30')).rejects.toThrow();

    const citas = await db.select().from(cita);
    expect(citas).toHaveLength(1);
  });
});
