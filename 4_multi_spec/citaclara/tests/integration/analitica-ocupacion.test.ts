import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { obtenerAnalitica } from '@/src/services/analitica';
import { reiniciarYSembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { cerrarConexion, db } from './setup/ayudas';

/**
 * US4 — Ocupación semanal por profesional (FR-007/FR-007a, SC-005).
 * Definición acordada; reproducible con la semilla y día de referencia 2026-09-16.
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

describe('ocupación semanal (FR-007, SC-005)', () => {
  it('SC-005: reproduce la ocupación media aproximada por profesional', async () => {
    const { ocupacion_semanal: ocupacion } = await obtenerAnalitica(
      clinicaId,
      { dia_referencia: HOY },
      db,
    );

    const media = Object.fromEntries(
      ocupacion.series.map((s) => [s.nombre, s.ocupacion_media]),
    );

    // Spec US4.1 / SC-005: la ocupación media es "aproximada" (≈ 46 %, ≈ 47 %, ≈ 41 %).
    // La implementación aplica la definición literal de FR-007 (numerador: minutos de
    // citas reservada|completada; denominador: 600 min × 5 días laborables por semana ISO)
    // sobre las 8 semanas de la ventana. Los valores reales sobre la semilla son
    // ≈ 47,4 %, ≈ 48,5 % y ≈ 43,1 %: coinciden con los "≈" de la spec dentro de ±3 puntos
    // (la diferencia procede de las semanas parciales de los extremos del periodo, ver
    // nota de la spec y trazabilidad.md). Se comprueba con esa tolerancia.
    expect(media['María Ferrer']).toBeGreaterThanOrEqual(44);
    expect(media['María Ferrer']).toBeLessThanOrEqual(49);
    expect(media['Jorge Nieto']).toBeGreaterThanOrEqual(45);
    expect(media['Jorge Nieto']).toBeLessThanOrEqual(50);
    expect(media['Lucía Prados']).toBeGreaterThanOrEqual(38);
    expect(media['Lucía Prados']).toBeLessThanOrEqual(44);
  });

  it('FR-007a: no pinta semanas futuras y muestra como máximo la semana en curso', async () => {
    const { ocupacion_semanal: ocupacion } = await obtenerAnalitica(
      clinicaId,
      { dia_referencia: HOY },
      db,
    );

    // La última semana visible es la semana en curso (ISO 38 de 2026); ninguna posterior.
    const ultima = ocupacion.semanas.at(-1);
    expect(ultima).toEqual(expect.objectContaining({ iso_anio: 2026, iso_semana: 38 }));
    for (const semana of ocupacion.semanas) {
      expect(semana.iso_semana).toBeLessThanOrEqual(38);
    }
  });

  it('SC-008: ningún porcentaje supera el 100 %', async () => {
    const { ocupacion_semanal: ocupacion } = await obtenerAnalitica(
      clinicaId,
      { dia_referencia: HOY },
      db,
    );
    for (const serie of ocupacion.series) {
      for (const punto of serie.puntos) {
        if (punto.ocupacion_porcentaje !== null) {
          expect(punto.ocupacion_porcentaje).toBeLessThanOrEqual(100);
          expect(punto.ocupacion_porcentaje).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
