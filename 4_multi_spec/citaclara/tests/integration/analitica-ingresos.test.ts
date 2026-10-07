import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatearEuros } from '@/src/domain/dinero';
import { obtenerAnalitica } from '@/src/services/analitica';
import { reiniciarYSembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { cerrarConexion, db } from './setup/ayudas';

/**
 * US1/US2 — Ingresos por servicio (FR-004/FR-005, SC-001, FR-014).
 *
 * Números reproducibles con la semilla `citaclara-eleva-2026` y día de referencia
 * 2026-09-16 (el mismo de las pruebas de la 001).
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

describe('ingresos por servicio (FR-004/FR-005, SC-001)', () => {
  it('reproduce el desglose y el total al céntimo de la spec', async () => {
    const { ingresos_por_servicio: ingresos } = await obtenerAnalitica(
      clinicaId,
      { dia_referencia: HOY },
      db,
    );

    // Desglose por servicio (spec US2.1), ordenado por importe desc. Los IMPORTES se
    // comprueban al céntimo (SC-001, Principio 2); la cadena visible usa el formateador
    // único del producto (src/domain/dinero.ts) para no duplicar el camino de dinero.
    expect(ingresos.servicios).toEqual([
      expect.objectContaining({
        nombre: 'Primera visita de fisioterapia',
        citas_completadas: 205,
        ingresos_centimos: 1_025_000,
        ingresos: formatearEuros(1_025_000),
      }),
      expect.objectContaining({
        nombre: 'Sesión de fisioterapia',
        citas_completadas: 247,
        ingresos_centimos: 988_000,
        ingresos: formatearEuros(988_000),
      }),
      expect.objectContaining({
        nombre: 'Primera visita de nutrición',
        citas_completadas: 139,
        ingresos_centimos: 625_500,
        ingresos: formatearEuros(625_500),
      }),
      expect.objectContaining({
        nombre: 'Consulta de nutrición',
        citas_completadas: 144,
        ingresos_centimos: 504_000,
        ingresos: formatearEuros(504_000),
      }),
    ]);

    // Total exacto al céntimo (SC-001): 3.142.500 céntimos = 31.425,00 €.
    expect(ingresos.total_centimos).toBe(3_142_500);
    expect(ingresos.total).toBe(formatearEuros(3_142_500));
    expect(ingresos.total).toBe('31.425,00 €');
    expect(ingresos.sin_datos).toBe(false);

    // El total cuadra con la suma del desglose, 0 céntimos de descuadre (SC-001).
    const suma = ingresos.servicios.reduce((t, s) => t + s.ingresos_centimos, 0);
    expect(suma).toBe(ingresos.total_centimos);

    // 735 citas completadas en total (spec).
    const completadas = ingresos.servicios.reduce((t, s) => t + s.citas_completadas, 0);
    expect(completadas).toBe(735);
  });
});
