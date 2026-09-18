import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET, POST } from '@/app/api/pacientes/route';
import {
  cabeceraSesion,
  cerrarConexion,
  crearEscenario,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Contract test de `contracts/pacientes.md` (FR-004, FR-004a).
 * Las fichas de paciente son requisito del alta de cita (US1).
 */

const URL_PACIENTES = 'http://localhost/api/pacientes';

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function peticionCrear(cuerpo: unknown, conSesion = true) {
  return new Request(URL_PACIENTES, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(conSesion ? cabeceraSesion(escenario.clinicaId) : {}),
    },
    body: JSON.stringify(cuerpo),
  });
}

describe('POST /api/pacientes (FR-004/004a)', () => {
  it('201: crea la ficha con nombre y teléfono', async () => {
    const respuesta = await POST(
      peticionCrear({ nombre: 'Elena Ríos', telefono: '600777888', email: 'elena@ejemplo.es' }),
    );
    expect(respuesta.status).toBe(201);

    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({
      nombre: 'Elena Ríos',
      telefono: '600777888',
      email: 'elena@ejemplo.es',
    });
    expect(cuerpo.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('201: el correo electrónico es opcional', async () => {
    const respuesta = await POST(peticionCrear({ nombre: 'Óscar Vidal', telefono: '611222333' }));
    expect(respuesta.status).toBe(201);
    expect((await respuesta.json()).email).toBeNull();
  });

  it('400 DATOS_INCOMPLETOS: falta el nombre o el teléfono (FR-004)', async () => {
    const sinNombre = await POST(peticionCrear({ telefono: '600999888' }));
    expect(sinNombre.status).toBe(400);
    expect((await sinNombre.json()).error.codigo).toBe('DATOS_INCOMPLETOS');

    const sinTelefono = await POST(peticionCrear({ nombre: 'Sin Teléfono' }));
    expect(sinTelefono.status).toBe(400);
    expect((await sinTelefono.json()).error.codigo).toBe('DATOS_INCOMPLETOS');
  });

  it('409 TELEFONO_DUPLICADO: el teléfono es único por clínica (FR-004a)', async () => {
    const primera = await POST(peticionCrear({ nombre: 'Rosa Marín', telefono: '622111000' }));
    expect(primera.status).toBe(201);

    const repetida = await POST(peticionCrear({ nombre: 'Otra Persona', telefono: '622111000' }));
    expect(repetida.status).toBe(409);

    const cuerpo = await repetida.json();
    expect(cuerpo.error.codigo).toBe('TELEFONO_DUPLICADO');
    // El mensaje va en español de España y sin jerga técnica (Principios 7 y 8).
    expect(cuerpo.error.mensaje).toMatch(/teléfono/i);
    expect(cuerpo.error.mensaje).not.toMatch(/constraint|unique|SQL/i);
  });

  it('422 EMAIL_INVALIDO: el correo aportado debe tener formato válido', async () => {
    const respuesta = await POST(
      peticionCrear({ nombre: 'Correo Roto', telefono: '633444555', email: 'no-es-un-correo' }),
    );
    expect(respuesta.status).toBe(422);
    expect((await respuesta.json()).error.codigo).toBe('EMAIL_INVALIDO');
  });

  it('401 NO_AUTORIZADO: sin sesión de clínica no se puede fichar (FR-018)', async () => {
    const respuesta = await POST(
      peticionCrear({ nombre: 'Anónima', telefono: '644555666' }, false),
    );
    expect(respuesta.status).toBe(401);
    expect((await respuesta.json()).error.codigo).toBe('NO_AUTORIZADO');
  });
});

describe('GET /api/pacientes?buscar= (FR-004)', () => {
  function peticionBuscar(buscar?: string, conSesion = true) {
    const url = new URL(URL_PACIENTES);
    if (buscar !== undefined) url.searchParams.set('buscar', buscar);
    return new Request(url, {
      headers: conSesion ? cabeceraSesion(escenario.clinicaId) : {},
    });
  }

  it('200: sin criterio devuelve las fichas de la clínica ordenadas por nombre', async () => {
    const respuesta = await GET(peticionBuscar());
    expect(respuesta.status).toBe(200);

    const fichas = await respuesta.json();
    expect(fichas.map((f: { nombre: string }) => f.nombre)).toEqual([
      'Ana Belmonte',
      'Bruno Cañas',
      'Carla Duarte',
    ]);
    expect(fichas[0]).toMatchObject({ telefono: '600111222' });
  });

  it('200: busca por nombre sin distinguir mayúsculas ni acentos del criterio', async () => {
    const respuesta = await GET(peticionBuscar('bruno'));
    const fichas = await respuesta.json();
    expect(fichas).toHaveLength(1);
    expect(fichas[0].nombre).toBe('Bruno Cañas');
  });

  it('200: busca por teléfono', async () => {
    const respuesta = await GET(peticionBuscar('600555'));
    const fichas = await respuesta.json();
    expect(fichas).toHaveLength(1);
    expect(fichas[0].nombre).toBe('Carla Duarte');
  });

  it('200: un criterio sin coincidencias devuelve una lista vacía', async () => {
    const respuesta = await GET(peticionBuscar('zzzz'));
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual([]);
  });

  it('no devuelve fichas de otra clínica', async () => {
    const otra = await crearEscenario();
    const respuesta = await GET(
      new Request(URL_PACIENTES, { headers: cabeceraSesion(otra.clinicaId) }),
    );
    const fichas = await respuesta.json();
    // La otra clínica tiene sus propias tres fichas, no seis.
    expect(fichas).toHaveLength(3);
  });

  it('401 NO_AUTORIZADO: sin sesión no se listan fichas (FR-018)', async () => {
    const respuesta = await GET(peticionBuscar(undefined, false));
    expect(respuesta.status).toBe(401);
  });
});
