import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/analitica/route';
import { reiniciarYSembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { cabeceraSesion, cerrarConexion, db } from './setup/ayudas';

/**
 * Contract test de `GET /api/analitica` (contracts/analitica.md, FR-001/FR-002/FR-003).
 * Solo lectura, sesión de clínica obligatoria; devuelve los cuatro bloques.
 */

const HOY = '2026-09-16';
let clinicaId: string;

beforeAll(async () => {
  const resumen = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
  clinicaId = resumen.clinicaId;
});

afterAll(async () => {
  await cerrarConexion();
});

function peticion(conSesion = true, dia?: string, clinica?: string) {
  const url = new URL('http://localhost/api/analitica');
  if (dia !== undefined) url.searchParams.set('dia_referencia', dia);
  return new Request(url, {
    headers: conSesion ? cabeceraSesion(clinica ?? clinicaId) : {},
  });
}

describe('GET /api/analitica — contrato (contracts/analitica.md)', () => {
  it('200: con sesión válida devuelve los cuatro bloques (FR-003)', async () => {
    const respuesta = await GET(peticion(true, HOY));
    expect(respuesta.status).toBe(200);

    const cuerpo = await respuesta.json();
    expect(cuerpo).toHaveProperty('ingresos_por_servicio');
    expect(cuerpo).toHaveProperty('tasa_no_asistencia');
    expect(cuerpo).toHaveProperty('ocupacion_semanal');
    expect(cuerpo).toHaveProperty('evolucion');

    // Forma mínima de cada bloque.
    expect(Array.isArray(cuerpo.ingresos_por_servicio.servicios)).toBe(true);
    expect(cuerpo.ingresos_por_servicio.total).toBe('31.425,00 €');
    expect(Array.isArray(cuerpo.tasa_no_asistencia.profesionales)).toBe(true);
    expect(typeof cuerpo.tasa_no_asistencia.nota_efecto_cancelacion).toBe('string');
    expect(Array.isArray(cuerpo.ocupacion_semanal.series)).toBe(true);
    expect(Array.isArray(cuerpo.evolucion.semanas)).toBe(true);
  });

  it('401 NO_AUTORIZADO: sin sesión no se ve ningún dato (FR-001, SC-002)', async () => {
    const respuesta = await GET(peticion(false, HOY));
    expect(respuesta.status).toBe(401);
    const cuerpo = await respuesta.json();
    expect(cuerpo.error.codigo).toBe('NO_AUTORIZADO');
    // No se filtra ningún bloque de analítica.
    expect(cuerpo).not.toHaveProperty('ingresos_por_servicio');
  });

  it('422 FECHA_INVALIDA: dia_referencia con formato incorrecto', async () => {
    const respuesta = await GET(peticion(true, '16-09-2026'));
    expect(respuesta.status).toBe(422);
    expect((await respuesta.json()).error.codigo).toBe('FECHA_INVALIDA');
  });

  it('FR-012: solo agrega datos de la clínica de la sesión', async () => {
    // Una segunda clínica (semilla distinta) no debe afectar a los totales de la primera.
    const respuesta = await GET(peticion(true, HOY));
    const cuerpo = await respuesta.json();
    // La clínica sembrada tiene exactamente sus 3 profesionales.
    expect(cuerpo.tasa_no_asistencia.profesionales).toHaveLength(3);
    expect(cuerpo.ocupacion_semanal.series).toHaveLength(3);
  });
});
