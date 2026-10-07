import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { obtenerAnalitica } from '@/src/services/analitica';
import { reiniciarYSembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { NOTA_EFECTO_CANCELACION } from '@/src/services/analitica';
import { cerrarConexion, db } from './setup/ayudas';

/**
 * US3 — Tasa de no asistencia por profesional (FR-006/FR-006a, SC-004, SC-010).
 * Definición A, reproducible con la semilla y día de referencia 2026-09-16.
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

describe('tasa de no asistencia (FR-006, SC-004)', () => {
  it('reproduce las tasas por profesional de la spec (Definición A)', async () => {
    const { tasa_no_asistencia: tasa } = await obtenerAnalitica(
      clinicaId,
      { dia_referencia: HOY },
      db,
    );

    const porNombre = Object.fromEntries(
      tasa.profesionales.map((p) => [p.nombre, p]),
    );

    // Spec US3.1: María 11,3 % (32/284), Jorge 7,9 % (22/279), Lucía 11,0 % (39/353).
    expect(porNombre['María Ferrer']).toEqual(
      expect.objectContaining({
        no_asistidas: 32,
        citas_pasadas_con_desenlace: 284,
        tasa_porcentaje: 11.3,
        tasa_texto: '11,3 %',
      }),
    );
    expect(porNombre['Jorge Nieto']).toEqual(
      expect.objectContaining({
        no_asistidas: 22,
        citas_pasadas_con_desenlace: 279,
        tasa_porcentaje: 7.9,
        tasa_texto: '7,9 %',
      }),
    );
    expect(porNombre['Lucía Prados']).toEqual(
      expect.objectContaining({
        no_asistidas: 39,
        citas_pasadas_con_desenlace: 353,
        tasa_porcentaje: 11.0,
        tasa_texto: '11,0 %',
      }),
    );
  });

  it('SC-010: acompaña SIEMPRE la nota del efecto "la cancelación sustituye al no-show"', async () => {
    const { tasa_no_asistencia: tasa } = await obtenerAnalitica(
      clinicaId,
      { dia_referencia: HOY },
      db,
    );
    expect(tasa.nota_efecto_cancelacion).toBe(NOTA_EFECTO_CANCELACION);
    expect(tasa.nota_efecto_cancelacion.length).toBeGreaterThan(0);
  });
});
