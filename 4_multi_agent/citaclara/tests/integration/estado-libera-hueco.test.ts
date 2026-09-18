import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { cambiarEstado } from '@/src/services/cambiar-estado';
import { crearCita } from '@/src/services/crear-cita';
import { consultarAgenda } from '@/src/services/consultar-agenda';
import {
  cerrarConexion,
  crearEscenario,
  db,
  fechaFutura,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * FR-010 (nota) y US1 §4: `cancelada` y `no_asistida` liberan el hueco, de modo que se
 * puede volver a citar en ese tramo; `completada` lo sigue ocupando.
 * Es también el camino de reprogramación de la 001 (FR-017a): cancelar y crear de nuevo.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function nuevaCitaDeMaria(hora: string, pacienteId: string) {
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

describe('los estados finales liberan (o no) el hueco (FR-010)', () => {
  it('cancelar libera el hueco y admite una cita nueva en el mismo tramo', async () => {
    const original = await nuevaCitaDeMaria('10:00', escenario.pacientes.ana);
    await cambiarEstado(escenario.clinicaId, original.id, 'cancelada', db);

    const nueva = await nuevaCitaDeMaria('10:00', escenario.pacientes.bruno);
    expect(nueva.id).not.toBe(original.id);
  });

  it('marcar no asistida libera el hueco y admite una cita nueva', async () => {
    const original = await nuevaCitaDeMaria('11:00', escenario.pacientes.ana);
    await cambiarEstado(escenario.clinicaId, original.id, 'no_asistida', db);

    const nueva = await nuevaCitaDeMaria('11:00', escenario.pacientes.bruno);
    expect(nueva.id).not.toBe(original.id);
  });

  it('completar NO libera el hueco: la cita sigue ocupando el tramo', async () => {
    const original = await nuevaCitaDeMaria('12:00', escenario.pacientes.ana);
    await cambiarEstado(escenario.clinicaId, original.id, 'completada', db);

    await expect(nuevaCitaDeMaria('12:00', escenario.pacientes.bruno)).rejects.toMatchObject({
      codigo: 'SOLAPE_PROFESIONAL',
    });
  });

  it('cancelar libera también al paciente para ese horario (FR-012a)', async () => {
    const original = await nuevaCitaDeMaria('13:00', escenario.pacientes.ana);
    await cambiarEstado(escenario.clinicaId, original.id, 'cancelada', db);

    const conOtroProfesional = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.lucia,
        servicio_id: escenario.servicios.consultaNutricion,
        paciente_id: escenario.pacientes.ana,
        inicio: instanteFuturo('13:00').toISOString(),
      },
      db,
    );
    expect(conOtroProfesional.id).toBeDefined();
  });

  it('FR-017a: reprogramar es cancelar y volver a crear, revalidando RN1', async () => {
    const original = await nuevaCitaDeMaria('10:00', escenario.pacientes.ana);
    // Otro paciente ocupa las 11:00 con María.
    await nuevaCitaDeMaria('11:00', escenario.pacientes.bruno);

    await cambiarEstado(escenario.clinicaId, original.id, 'cancelada', db);

    // Reprogramar a las 11:00 choca con la cita de Bruno: RN1 sigue vigente.
    await expect(nuevaCitaDeMaria('11:00', escenario.pacientes.ana)).rejects.toMatchObject({
      codigo: 'SOLAPE_PROFESIONAL',
    });

    // A las 12:00 sí hay hueco.
    const reprogramada = await nuevaCitaDeMaria('12:00', escenario.pacientes.ana);
    expect(reprogramada.id).toBeDefined();
  });

  it('la agenda del día refleja el nuevo estado y si el tramo sigue ocupado', async () => {
    const cancelada = await nuevaCitaDeMaria('10:00', escenario.pacientes.ana);
    await cambiarEstado(escenario.clinicaId, cancelada.id, 'cancelada', db);
    await nuevaCitaDeMaria('10:00', escenario.pacientes.bruno);

    const agenda = await consultarAgenda(
      escenario.clinicaId,
      { profesional_id: escenario.profesionales.maria, fecha: fechaFutura() },
      db,
    );

    expect(agenda.citas).toHaveLength(2);
    const porEstado = Object.fromEntries(agenda.citas.map((c) => [c.estado, c.ocupa_hueco]));
    expect(porEstado).toEqual({ cancelada: false, reservada: true });
  });
});
