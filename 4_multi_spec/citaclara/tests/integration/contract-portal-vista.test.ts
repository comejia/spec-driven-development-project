import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/portal/[token]/route';
import { cita } from '@/src/db/schema';
import { calcularFin } from '@/src/domain/tiempo';
import {
  cerrarConexion,
  crearTokenPaciente,
  crearEscenario,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * T015 [US1] — Contrato de la vista del portal (contracts/portal-vista.md; FR-005..FR-008,
 * SC-001). GET /api/portal/[token] devuelve { paciente, proximas[], historial[] } con solo
 * las citas del paciente resuelto por el token.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

async function insertarCita(opciones: {
  pacienteId: string;
  inicio: Date;
  estado: 'reservada' | 'completada' | 'cancelada' | 'no_asistida';
}) {
  const [fila] = await db
    .insert(cita)
    .values({
      clinicaId: escenario.clinicaId,
      profesionalId: escenario.profesionales.maria,
      servicioId: escenario.servicios.sesionFisio,
      pacienteId: opciones.pacienteId,
      inicio: opciones.inicio,
      fin: calcularFin(opciones.inicio, 45),
      estado: opciones.estado,
    })
    .returning({ id: cita.id });
  return fila.id;
}

function llamarGet(token: string) {
  const peticion = new Request(`http://localhost/api/portal/${token}`);
  return GET(peticion, { params: Promise.resolve({ token }) });
}

/** Trunca un instante al tramo de 5 minutos exacto (sin segundos ni ms). */
function alinear5min(fecha: Date): Date {
  const ms = 5 * 60 * 1000;
  return new Date(Math.floor(fecha.getTime() / ms) * ms);
}

describe('GET /api/portal/[token] — vista (T015, US1)', () => {
  it('200: separa próximas e historial, solo del paciente (SC-001)', async () => {
    const futuraLejana = instanteFuturo('10:00', 5); // +5 días
    // Instante pasado alineado a tramos de 5 minutos (restricción cita_granularidad_5min).
    const pasada = alinear5min(new Date(Date.now() - 10 * 24 * 3600_000));

    await insertarCita({ pacienteId: escenario.pacientes.ana, inicio: futuraLejana, estado: 'reservada' });
    await insertarCita({ pacienteId: escenario.pacientes.ana, inicio: pasada, estado: 'completada' });
    // Cita de otro paciente (a otra hora, para no solapar al profesional): no debe aparecer.
    const otraHora = instanteFuturo('12:00', 5);
    await insertarCita({ pacienteId: escenario.pacientes.bruno, inicio: otraHora, estado: 'reservada' });

    const respuesta = await llamarGet(await crearTokenPaciente(escenario.pacientes.ana));
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();

    expect(cuerpo.proximas).toHaveLength(1);
    expect(cuerpo.historial).toHaveLength(1);
    expect(cuerpo.proximas[0].cancelable).toBe(true);
    expect(cuerpo.historial[0].estado).toBe('Completada');
    expect(cuerpo.proximas[0].fechaHoraTexto).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it('200: estados vacíos cuando el paciente no tiene citas (FR-008)', async () => {
    const respuesta = await llamarGet(await crearTokenPaciente(escenario.pacientes.carla));
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.proximas).toEqual([]);
    expect(cuerpo.historial).toEqual([]);
  });
});
