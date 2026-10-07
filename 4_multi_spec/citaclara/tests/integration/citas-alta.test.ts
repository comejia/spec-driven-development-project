import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { cita } from '@/src/db/schema';
import { horaEnMadrid, instanteEnMadrid } from '@/src/domain/tiempo';
import { crearCita } from '@/src/services/crear-cita';
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
 * US1 — alta de cita válida contra PostgreSQL real (FR-005, FR-005a, FR-006, FR-007).
 * El fin NO se acepta como entrada: se deriva de la duración del servicio.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

describe('crear cita — alta válida (FR-005/005a/006/007)', () => {
  it('FR-006: una sesión de fisioterapia (45 min) a las 10:00 termina a las 10:45', async () => {
    const inicio = instanteFuturo('10:00');
    const creada = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.ana,
        inicio: inicio.toISOString(),
      },
      db,
    );

    expect(horaEnMadrid(creada.inicio)).toBe('10:00');
    expect(horaEnMadrid(creada.fin)).toBe('10:45');
    expect(creada.fin.getTime() - creada.inicio.getTime()).toBe(45 * 60 * 1000);
  });

  it('FR-007: la cita nace en estado reservada', async () => {
    const creada = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.ana,
        inicio: instanteFuturo('11:00').toISOString(),
      },
      db,
    );
    expect(creada.estado).toBe('reservada');

    const [guardada] = await db.select().from(cita).where(eq(cita.id, creada.id));
    expect(guardada.estado).toBe('reservada');
  });

  it('FR-006: el fin guardado corresponde a la duración de cada servicio', async () => {
    const casos = [
      { servicio: escenario.servicios.primeraFisio, inicio: '08:00', fin: '09:00' },
      { servicio: escenario.servicios.consultaNutricion, inicio: '12:00', fin: '12:30' },
      { servicio: escenario.servicios.primeraNutricion, inicio: '16:15', fin: '17:00' },
    ];

    for (const caso of casos) {
      const creada = await crearCita(
        escenario.clinicaId,
        {
          profesional_id:
            caso.servicio === escenario.servicios.primeraFisio
              ? escenario.profesionales.jorge
              : escenario.profesionales.lucia,
          servicio_id: caso.servicio,
          paciente_id: escenario.pacientes.bruno,
          inicio: instanteFuturo(caso.inicio).toISOString(),
        },
        db,
      );
      expect(horaEnMadrid(creada.inicio)).toBe(caso.inicio);
      expect(horaEnMadrid(creada.fin)).toBe(caso.fin);
    }
  });

  it('FR-005a: acepta cualquier inicio en tramos de 5 minutos', async () => {
    const horas = ['08:00', '08:05', '09:35', '20:55'];
    for (const [indice, hora] of horas.entries()) {
      const creada = await crearCita(
        escenario.clinicaId,
        {
          profesional_id: escenario.profesionales.maria,
          servicio_id: escenario.servicios.consultaNutricion,
          paciente_id: escenario.pacientes.carla,
          // Un día distinto por caso: así se prueba la granularidad sin provocar solapes.
          inicio: instanteEnMadrid(fechaFutura(60 + indice), hora).toISOString(),
        },
        db,
      );
      expect(horaEnMadrid(creada.inicio)).toBe(hora);
    }
  });

  it('FR-005: la cita queda asociada a la clínica, el profesional, el servicio y el paciente', async () => {
    const creada = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.lucia,
        servicio_id: escenario.servicios.consultaNutricion,
        paciente_id: escenario.pacientes.carla,
        inicio: instanteFuturo('09:30').toISOString(),
      },
      db,
    );

    const [guardada] = await db.select().from(cita).where(eq(cita.id, creada.id));
    expect(guardada).toMatchObject({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.lucia,
      servicioId: escenario.servicios.consultaNutricion,
      pacienteId: escenario.pacientes.carla,
    });
  });

  it('dos profesionales pueden atender a la misma hora a pacientes distintos', async () => {
    const inicio = instanteFuturo('10:00').toISOString();

    const deMaria = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.ana,
        inicio,
      },
      db,
    );
    const deLucia = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.lucia,
        servicio_id: escenario.servicios.consultaNutricion,
        paciente_id: escenario.pacientes.bruno,
        inicio,
      },
      db,
    );

    expect(deMaria.id).not.toBe(deLucia.id);
  });
});
