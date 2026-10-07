import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/portal/[token]/route';
import { cerrarConexion, crearEscenario, limpiarBase } from './setup/ayudas';

/**
 * T010 [US3] — Acceso denegado (contracts/portal-vista.md; FR-003, SC-005).
 *
 * Un token inexistente/manipulado/vacío devuelve 404 ACCESO_DENEGADO con mensaje neutro,
 * sin citas ni datos personales, y sin reflejar el token en el cuerpo.
 */

beforeEach(async () => {
  await limpiarBase();
  await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function llamarGet(token: string) {
  const peticion = new Request(`http://localhost/api/portal/${token}`);
  return GET(peticion, { params: Promise.resolve({ token }) });
}

describe('GET /api/portal/[token] — acceso denegado (T010, US3)', () => {
  const tokensInvalidos = [
    'token-inexistente',
    'dev-00000000-0000-4000-8000-000000000000',
    'dev-no-es-uuid',
    '',
  ];

  for (const token of tokensInvalidos) {
    it(`404 ACCESO_DENEGADO neutro para token "${token || '(vacío)'}"`, async () => {
      const respuesta = await llamarGet(token);
      expect(respuesta.status).toBe(404);

      const cuerpo = await respuesta.json();
      expect(cuerpo.error.codigo).toBe('ACCESO_DENEGADO');
      // Sin datos personales ni citas.
      expect(cuerpo.proximas).toBeUndefined();
      expect(cuerpo.historial).toBeUndefined();
      expect(cuerpo.paciente).toBeUndefined();
      // El token no se refleja en el cuerpo (D3).
      if (token) expect(JSON.stringify(cuerpo)).not.toContain(token);
      // Mensaje neutro, sin jerga técnica.
      expect(cuerpo.error.mensaje).not.toMatch(/SQL|token|uuid/i);
    });
  }
});
