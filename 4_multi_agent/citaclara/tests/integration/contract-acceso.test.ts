import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { POST as ACCEDER } from '@/app/api/acceso/route';
import { POST as SALIR } from '@/app/api/acceso/salir/route';
import { GET as AGENDA } from '@/app/api/agenda/route';
import { COOKIE_SESION, verificarSesion } from '@/src/services/session';
import {
  cerrarConexion,
  crearEscenario,
  fechaFutura,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Contract test de `contracts/acceso.md` (FR-018).
 * Sin clave correcta no se ve ninguna agenda; la sesión viaja en una cookie HTTP-only.
 */

const URL_ACCESO = 'http://localhost/api/acceso';
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function peticionAcceso(cuerpo: unknown) {
  return new Request(URL_ACCESO, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

/** Extrae el valor de la cookie de sesión de la cabecera Set-Cookie. */
function cookieDeSesion(respuesta: Response): string | undefined {
  const cabecera = respuesta.headers.get('set-cookie');
  return cabecera
    ?.split(/,(?=\s*citaclara_sesion=)/)
    .find((trozo) => trozo.trim().startsWith(`${COOKIE_SESION}=`));
}

describe('POST /api/acceso — contrato (contracts/acceso.md, FR-018)', () => {
  it('200: con la clave correcta devuelve la clínica y abre sesión', async () => {
    const respuesta = await ACCEDER(
      peticionAcceso({ clinica_id: escenario.clinicaId, clave: escenario.claveEnClaro }),
    );
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      clinica: { id: escenario.clinicaId, nombre: 'Clínica Eleva' },
    });
  });

  it('200: la cookie de sesión es HTTP-only y está firmada', async () => {
    const respuesta = await ACCEDER(
      peticionAcceso({ clinica_id: escenario.clinicaId, clave: escenario.claveEnClaro }),
    );

    const cookie = cookieDeSesion(respuesta);
    expect(cookie).toBeDefined();
    expect(cookie!.toLowerCase()).toContain('httponly');
    expect(cookie!.toLowerCase()).toContain('path=/');

    const valor = decodeURIComponent(cookie!.split(';')[0].split('=').slice(1).join('='));
    expect(verificarSesion(valor)).toBe(escenario.clinicaId);
    // La clave nunca viaja en la cookie.
    expect(valor).not.toContain(escenario.claveEnClaro);
  });

  it('401 CLAVE_INVALIDA: la clave es incorrecta', async () => {
    const respuesta = await ACCEDER(
      peticionAcceso({ clinica_id: escenario.clinicaId, clave: 'clave-que-no-es' }),
    );
    expect(respuesta.status).toBe(401);

    const cuerpo = await respuesta.json();
    expect(cuerpo.error.codigo).toBe('CLAVE_INVALIDA');
    expect(cookieDeSesion(respuesta)).toBeUndefined();
  });

  it('401 CLAVE_INVALIDA: no revela si la clínica existe', async () => {
    const respuesta = await ACCEDER(
      peticionAcceso({ clinica_id: UUID_INEXISTENTE, clave: escenario.claveEnClaro }),
    );
    expect(respuesta.status).toBe(401);
    expect((await respuesta.json()).error.codigo).toBe('CLAVE_INVALIDA');
  });

  it('400 DATOS_INCOMPLETOS: falta la clínica o la clave', async () => {
    const sinClave = await ACCEDER(peticionAcceso({ clinica_id: escenario.clinicaId }));
    expect(sinClave.status).toBe(400);
    expect((await sinClave.json()).error.codigo).toBe('DATOS_INCOMPLETOS');

    const claveVacia = await ACCEDER(
      peticionAcceso({ clinica_id: escenario.clinicaId, clave: '' }),
    );
    expect(claveVacia.status).toBe(400);

    const sinClinica = await ACCEDER(peticionAcceso({ clave: escenario.claveEnClaro }));
    expect(sinClinica.status).toBe(400);
  });

  it('FR-018: la clave distingue mayúsculas y minúsculas', async () => {
    const respuesta = await ACCEDER(
      peticionAcceso({
        clinica_id: escenario.clinicaId,
        clave: escenario.claveEnClaro.toUpperCase(),
      }),
    );
    expect(respuesta.status).toBe(401);
  });

  it('FR-018: la cookie obtenida da acceso a la agenda; sin ella se deniega', async () => {
    const acceso = await ACCEDER(
      peticionAcceso({ clinica_id: escenario.clinicaId, clave: escenario.claveEnClaro }),
    );
    const cookie = cookieDeSesion(acceso)!.split(';')[0];

    const url = new URL('http://localhost/api/agenda');
    url.searchParams.set('profesional_id', escenario.profesionales.maria);
    url.searchParams.set('fecha', fechaFutura());

    const conSesion = await AGENDA(new Request(url, { headers: { cookie } }));
    expect(conSesion.status).toBe(200);

    const sinSesion = await AGENDA(new Request(url));
    expect(sinSesion.status).toBe(401);

    const cookieManipulada = await AGENDA(
      new Request(url, { headers: { cookie: `${COOKIE_SESION}=${escenario.clinicaId}.firmafalsa` } }),
    );
    expect(cookieManipulada.status).toBe(401);
  });
});

describe('POST /api/acceso/salir — contrato', () => {
  it('204: cierra la sesión vaciando la cookie', async () => {
    const respuesta = await SALIR();
    expect(respuesta.status).toBe(204);

    const cookie = respuesta.headers.get('set-cookie');
    expect(cookie).toContain(`${COOKIE_SESION}=`);
    expect(cookie?.toLowerCase()).toMatch(/max-age=0|expires=/);
  });
});
