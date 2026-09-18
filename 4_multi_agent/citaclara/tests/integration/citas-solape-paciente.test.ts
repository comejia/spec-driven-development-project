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
 * FR-012a — Un paciente no puede tener dos citas activas solapadas, ni siquiera con
 * profesionales distintos: una persona no puede estar en dos consultas a la vez.
 * La garantía es la segunda restricción de exclusión (por paciente) del esquema.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

/** Cita de Ana con María de 10:00 a 10:45. */
async function citaDeAnaConMaria() {
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

/** Intento de cita de Ana con Lucía (otro profesional). */
function intentarAnaConLucia(hora: string, servicioId = escenario.servicios.consultaNutricion) {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.lucia,
      servicio_id: servicioId,
      paciente_id: escenario.pacientes.ana,
      inicio: instanteFuturo(hora).toISOString(),
    },
    db,
  );
}

describe('anti-solape del paciente entre profesionales (FR-012a)', () => {
  it('FR-012a: rechaza la cita del mismo paciente que solapa con otro profesional', async () => {
    await citaDeAnaConMaria();
    await expect(intentarAnaConLucia('10:15')).rejects.toMatchObject({
      codigo: 'SOLAPE_PACIENTE',
    });
  });

  it('FR-012a: rechaza el mismo inicio con otro profesional', async () => {
    await citaDeAnaConMaria();
    await expect(intentarAnaConLucia('10:00')).rejects.toMatchObject({
      codigo: 'SOLAPE_PACIENTE',
    });
  });

  it('FR-012a: rechaza el solape que termina dentro de la cita existente', async () => {
    await citaDeAnaConMaria();
    // Consulta de 30 min de 09:45 a 10:15.
    await expect(intentarAnaConLucia('09:45')).rejects.toMatchObject({
      codigo: 'SOLAPE_PACIENTE',
    });
  });

  it('FR-012a: el mensaje distingue el solape del paciente del solape del profesional', async () => {
    await citaDeAnaConMaria();
    await expect(intentarAnaConLucia('10:15')).rejects.toMatchObject({
      codigo: 'SOLAPE_PACIENTE',
      message: expect.stringContaining('paciente'),
    });
  });

  it('FR-012: acepta la cita adyacente del mismo paciente con otro profesional', async () => {
    await citaDeAnaConMaria();
    const seguida = await intentarAnaConLucia('10:45');
    expect(seguida.id).toBeDefined();
  });

  it('otro paciente sí puede ocupar ese hueco con el otro profesional', async () => {
    await citaDeAnaConMaria();
    const deBruno = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.lucia,
        servicio_id: escenario.servicios.consultaNutricion,
        paciente_id: escenario.pacientes.bruno,
        inicio: instanteFuturo('10:15').toISOString(),
      },
      db,
    );
    expect(deBruno.id).toBeDefined();
  });

  it('FR-012a: cancelar la primera cita libera al paciente para ese horario', async () => {
    const primera = await citaDeAnaConMaria();
    await db.update(cita).set({ estado: 'cancelada' }).where(eq(cita.id, primera.id));

    const nueva = await intentarAnaConLucia('10:15');
    expect(nueva.id).toBeDefined();
  });

  it('FR-012a: dos altas simultáneas del mismo paciente en el mismo horario dejan una', async () => {
    const resultados = await Promise.allSettled([
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.sesionFisio,
          paciente_id: escenario.pacientes.ana,
          inicio: instanteFuturo('16:00').toISOString(),
        },
        db,
      ),
      crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.lucia,
          servicio_id: escenario.servicios.consultaNutricion,
          paciente_id: escenario.pacientes.ana,
          inicio: instanteFuturo('16:00').toISOString(),
        },
        db,
      ),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await db.select().from(cita)).toHaveLength(1);
  });
});
