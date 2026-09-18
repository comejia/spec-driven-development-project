import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/citas/[id]/estado/route';
import { crearCita } from '@/src/services/crear-cita';
import {
  cabeceraSesion,
  cerrarConexion,
  crearEscenario,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Contract test de `POST /api/citas/{id}/estado` (contracts/citas.md, FR-008/017).
 */

const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

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

function llamar(citaId: string, cuerpo: unknown, conSesion = true) {
  const peticion = new Request(`http://localhost/api/citas/${citaId}/estado`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(conSesion ? cabeceraSesion(escenario.clinicaId) : {}),
    },
    body: JSON.stringify(cuerpo),
  });
  return POST(peticion, { params: Promise.resolve({ id: citaId }) });
}

describe('POST /api/citas/{id}/estado — contrato (contracts/citas.md)', () => {
  it('200: marca la cita como completada (FR-008/017)', async () => {
    const creada = await citaReservada();
    const respuesta = await llamar(creada.id, { estado: 'completada' });

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ id: creada.id, estado: 'completada' });
  });

  it('200: marca la cita como cancelada', async () => {
    const creada = await citaReservada('11:00');
    const respuesta = await llamar(creada.id, { estado: 'cancelada' });

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).estado).toBe('cancelada');
  });

  it('200: marca la cita como no asistida (FR-009)', async () => {
    const creada = await citaReservada('12:00');
    const respuesta = await llamar(creada.id, { estado: 'no_asistida' });

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).estado).toBe('no_asistida');
  });

  it('409 TRANSICION_INVALIDA: la cita ya está en un estado final (FR-008)', async () => {
    const creada = await citaReservada('13:00');
    expect((await llamar(creada.id, { estado: 'completada' })).status).toBe(200);

    const segunda = await llamar(creada.id, { estado: 'cancelada' });
    expect(segunda.status).toBe(409);

    const cuerpo = await segunda.json();
    expect(cuerpo.error.codigo).toBe('TRANSICION_INVALIDA');
    expect(cuerpo.error.mensaje).not.toMatch(/SQL|constraint|enum/i);
  });

  it('409 TRANSICION_INVALIDA: no se puede repetir la misma transición', async () => {
    const creada = await citaReservada('14:00');
    expect((await llamar(creada.id, { estado: 'cancelada' })).status).toBe(200);
    expect((await llamar(creada.id, { estado: 'cancelada' })).status).toBe(409);
  });

  it('400 ESTADO_INVALIDO: el estado pedido no está permitido', async () => {
    const creada = await citaReservada('15:00');

    const inventado = await llamar(creada.id, { estado: 'pendiente' });
    expect(inventado.status).toBe(400);
    expect((await inventado.json()).error.codigo).toBe('ESTADO_INVALIDO');

    // `reservada` no es un destino válido: es el estado de partida.
    const aReservada = await llamar(creada.id, { estado: 'reservada' });
    expect(aReservada.status).toBe(400);
  });

  it('404 CITA_NO_EXISTE: la cita no existe en la clínica', async () => {
    const respuesta = await llamar(UUID_INEXISTENTE, { estado: 'completada' });
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error.codigo).toBe('CITA_NO_EXISTE');
  });

  it('404 CITA_NO_EXISTE: no se puede cambiar el estado de una cita de otra clínica', async () => {
    const otra = await crearEscenario();
    const ajena = await crearCita(
      otra.clinicaId,
      {
        profesional_id: otra.profesionales.maria,
        servicio_id: otra.servicios.sesionFisio,
        paciente_id: otra.pacientes.ana,
        inicio: instanteFuturo('10:00').toISOString(),
      },
      db,
    );

    const respuesta = await llamar(ajena.id, { estado: 'completada' });
    expect(respuesta.status).toBe(404);
  });

  it('401 NO_AUTORIZADO: sin sesión no se cambian estados (FR-018)', async () => {
    const creada = await citaReservada('16:00');
    const respuesta = await llamar(creada.id, { estado: 'completada' }, false);
    expect(respuesta.status).toBe(401);
  });

  it('con dos peticiones simultáneas solo una transición se aplica', async () => {
    const creada = await citaReservada('17:00');
    const [primera, segunda] = await Promise.all([
      llamar(creada.id, { estado: 'completada' }),
      llamar(creada.id, { estado: 'cancelada' }),
    ]);

    expect([primera.status, segunda.status].sort()).toEqual([200, 409]);
  });
});
