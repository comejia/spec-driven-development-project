import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/portal/[token]/cancelar/route';
import { crearCita } from '@/src/services/crear-cita';
import { cambiarEstado } from '@/src/services/cambiar-estado';
import { tokenDeDesarrollo } from '@/src/portal/acceso-desarrollo';
import {
  cerrarConexion,
  crearEscenario,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * T023 [US2] — Idempotencia y concurrencia (FR-014, FR-015, SC-006; Principio 3).
 *
 * La garantía la aporta 001 (transición condicionada a estado='reservada'). El portal solo
 * la invoca: ante doble cancelación o carrera portal↔recepción, queda UNA sola cancelación
 * efectiva y la segunda recibe TRANSICION_INVALIDA.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

async function citaCancelable() {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: escenario.pacientes.ana,
      inicio: instanteFuturo('10:00', 30).toISOString(),
    },
    db,
  );
}

function llamarPost(token: string, citaId: string) {
  const peticion = new Request(`http://localhost/api/portal/${token}/cancelar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ citaId }),
  });
  return POST(peticion, { params: Promise.resolve({ token }) });
}

describe('POST /api/portal/[token]/cancelar — idempotencia/concurrencia (T023, US2)', () => {
  it('doble cancelación: la segunda devuelve 409 TRANSICION_INVALIDA', async () => {
    const creada = await citaCancelable();
    const token = tokenDeDesarrollo(escenario.pacientes.ana);

    const primera = await llamarPost(token, creada.id);
    expect(primera.status).toBe(200);

    const segunda = await llamarPost(token, creada.id);
    expect(segunda.status).toBe(409);
    expect((await segunda.json()).error.codigo).toBe('TRANSICION_INVALIDA');
  });

  it('cancelaciones simultáneas: exactamente una efectiva', async () => {
    const creada = await citaCancelable();
    const token = tokenDeDesarrollo(escenario.pacientes.ana);

    const [a, b] = await Promise.all([llamarPost(token, creada.id), llamarPost(token, creada.id)]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });

  it('carrera portal↔recepción: si recepción cancela antes, el portal ve TRANSICION_INVALIDA', async () => {
    const creada = await citaCancelable();
    // Recepción (001) cancela primero.
    await cambiarEstado(escenario.clinicaId, creada.id, 'cancelada', db);

    const respuesta = await llamarPost(tokenDeDesarrollo(escenario.pacientes.ana), creada.id);
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).error.codigo).toBe('TRANSICION_INVALIDA');
  });
});
