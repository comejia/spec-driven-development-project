import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { obtenerAnalitica } from '@/src/services/analitica';
import { reiniciarYSembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { cerrarConexion, db } from './setup/ayudas';

/**
 * US5 — Evolución de las últimas 8 semanas (FR-008/FR-009, SC-006).
 * Reproducible con la semilla y día de referencia 2026-09-16.
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

describe('evolución 8 semanas (FR-008, SC-006)', () => {
  it('SC-006: muestra como máximo 8 semanas, en orden cronológico', async () => {
    const { evolucion } = await obtenerAnalitica(clinicaId, { dia_referencia: HOY }, db);

    expect(evolucion.semanas.length).toBeLessThanOrEqual(8);
    expect(evolucion.semanas.length).toBeGreaterThan(0);
    expect(evolucion.sin_datos).toBe(false);

    // Orden cronológico ascendente por (año, semana).
    const claves = evolucion.semanas.map((s) => s.iso_anio * 100 + s.iso_semana);
    expect([...claves].sort((a, b) => a - b)).toEqual(claves);
  });

  it('reproduce la serie de semanas completas de la spec (citas completadas)', async () => {
    const { evolucion } = await obtenerAnalitica(clinicaId, { dia_referencia: HOY }, db);
    const porSemana = Object.fromEntries(
      evolucion.semanas.map((s) => [s.iso_semana, s]),
    );

    // Spec US5.1: semanas ISO completas 31–37 con sus citas completadas.
    const esperadas: Record<number, number> = {
      31: 87,
      32: 91,
      33: 97,
      34: 95,
      35: 90,
      36: 83,
      37: 84,
    };
    for (const [semana, completadas] of Object.entries(esperadas)) {
      expect(porSemana[Number(semana)]?.citas_completadas).toBe(completadas);
    }
  });

  it('reproduce los ingresos por semana completa de la spec, al céntimo', async () => {
    const { evolucion } = await obtenerAnalitica(clinicaId, { dia_referencia: HOY }, db);
    const porSemana = Object.fromEntries(
      evolucion.semanas.map((s) => [s.iso_semana, s]),
    );

    // Spec US5.1: ingresos por semana ISO (en céntimos, al céntimo).
    const esperadasCentimos: Record<number, number> = {
      31: 367_500,
      32: 389_000,
      33: 412_000,
      34: 406_500,
      35: 386_000,
      36: 359_000,
      37: 356_500,
    };
    for (const [semana, centimos] of Object.entries(esperadasCentimos)) {
      expect(porSemana[Number(semana)]?.ingresos_centimos).toBe(centimos);
    }
  });
});
