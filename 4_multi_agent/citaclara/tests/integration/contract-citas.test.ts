import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/citas/route';
import { instanteEnMadrid } from '@/src/domain/tiempo';
import {
  cabeceraSesion,
  cerrarConexion,
  crearEscenario,
  fechaPasada,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Contract test de `POST /api/citas` (contracts/citas.md).
 * Verifica los códigos 201, 400, 404, 409 y 422 y el formato de error
 * `{ error: { codigo, mensaje } }` con mensajes en es-ES.
 */

const URL_CITAS = 'http://localhost/api/citas';
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function peticion(cuerpo: unknown, conSesion = true) {
  return new Request(URL_CITAS, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(conSesion ? cabeceraSesion(escenario.clinicaId) : {}),
    },
    body: JSON.stringify(cuerpo),
  });
}

function cuerpoValido(sobrescribir: Record<string, unknown> = {}) {
  return {
    profesional_id: escenario.profesionales.maria,
    servicio_id: escenario.servicios.sesionFisio,
    paciente_id: escenario.pacientes.ana,
    inicio: instanteFuturo('10:00').toISOString(),
    ...sobrescribir,
  };
}

describe('POST /api/citas — contrato (contracts/citas.md)', () => {
  it('201: devuelve id, inicio, fin derivado y estado reservada', async () => {
    const respuesta = await POST(peticion(cuerpoValido()));
    expect(respuesta.status).toBe(201);

    const cuerpo = await respuesta.json();
    expect(cuerpo.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(cuerpo.estado).toBe('reservada');
    // El fin no se envía: lo deriva el servidor (FR-006).
    expect(new Date(cuerpo.fin).getTime() - new Date(cuerpo.inicio).getTime()).toBe(45 * 60 * 1000);
  });

  it('201: ignora cualquier "fin" enviado por el cliente (FR-006)', async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ fin: instanteFuturo('20:00').toISOString() })),
    );
    expect(respuesta.status).toBe(201);

    const cuerpo = await respuesta.json();
    expect(new Date(cuerpo.fin).getTime() - new Date(cuerpo.inicio).getTime()).toBe(45 * 60 * 1000);
  });

  it('400 DATOS_INCOMPLETOS: falta un campo obligatorio (FR-014)', async () => {
    const sinPaciente = cuerpoValido();
    delete (sinPaciente as Record<string, unknown>).paciente_id;

    const respuesta = await POST(peticion(sinPaciente));
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error.codigo).toBe('DATOS_INCOMPLETOS');
  });

  it('404 PACIENTE_NO_EXISTE: el paciente no está fichado en la clínica (FR-014)', async () => {
    const respuesta = await POST(peticion(cuerpoValido({ paciente_id: UUID_INEXISTENTE })));
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error.codigo).toBe('PACIENTE_NO_EXISTE');
  });

  it('422 GRANULARIDAD_INVALIDA: el inicio no va en tramos de 5 minutos (FR-005a)', async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ inicio: instanteFuturo('10:07').toISOString() })),
    );
    expect(respuesta.status).toBe(422);

    const cuerpo = await respuesta.json();
    expect(cuerpo.error.codigo).toBe('GRANULARIDAD_INVALIDA');
    expect(cuerpo.error.mensaje).toMatch(/5 minutos/);
  });

  it('422 CITA_EN_PASADO: el inicio es anterior a ahora (RN2, FR-013)', async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ inicio: instanteEnMadrid(fechaPasada(2), '10:00').toISOString() })),
    );
    expect(respuesta.status).toBe(422);
    expect((await respuesta.json()).error.codigo).toBe('CITA_EN_PASADO');
  });

  it('409 SOLAPE_PROFESIONAL: el hueco choca con una cita activa (RN1, FR-010)', async () => {
    expect((await POST(peticion(cuerpoValido()))).status).toBe(201);

    const respuesta = await POST(
      peticion(
        cuerpoValido({
          paciente_id: escenario.pacientes.bruno,
          inicio: instanteFuturo('10:30').toISOString(),
        }),
      ),
    );
    expect(respuesta.status).toBe(409);

    const cuerpo = await respuesta.json();
    expect(cuerpo.error.codigo).toBe('SOLAPE_PROFESIONAL');
    // Mensaje en es-ES, sin jerga técnica (Principios 7 y 8).
    expect(cuerpo.error.mensaje).not.toMatch(/constraint|gist|SQL|exclusion/i);
  });

  it('409 SOLAPE_PACIENTE: el paciente ya tiene otra cita activa solapada (FR-012a)', async () => {
    expect((await POST(peticion(cuerpoValido()))).status).toBe(201);

    const respuesta = await POST(
      peticion(
        cuerpoValido({
          profesional_id: escenario.profesionales.lucia,
          servicio_id: escenario.servicios.consultaNutricion,
          inicio: instanteFuturo('10:15').toISOString(),
        }),
      ),
    );
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).error.codigo).toBe('SOLAPE_PACIENTE');
  });

  it('FR-011: ante dos peticiones simultáneas del mismo hueco, una 201 y otra 409', async () => {
    const cuerpo = cuerpoValido({ inicio: instanteFuturo('12:00').toISOString() });
    const [primera, segunda] = await Promise.all([
      POST(peticion(cuerpo)),
      POST(peticion({ ...cuerpo, paciente_id: escenario.pacientes.bruno })),
    ]);

    const estados = [primera.status, segunda.status].sort();
    expect(estados).toEqual([201, 409]);
  });

  it('401 NO_AUTORIZADO: sin sesión de clínica no se crean citas (FR-018)', async () => {
    const respuesta = await POST(peticion(cuerpoValido(), false));
    expect(respuesta.status).toBe(401);
    expect((await respuesta.json()).error.codigo).toBe('NO_AUTORIZADO');
  });

  it('400 DATOS_INCOMPLETOS: el cuerpo no es JSON válido', async () => {
    const respuesta = await POST(
      new Request(URL_CITAS, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...cabeceraSesion(escenario.clinicaId) },
        body: 'esto-no-es-json',
      }),
    );
    expect(respuesta.status).toBe(400);
  });
});
