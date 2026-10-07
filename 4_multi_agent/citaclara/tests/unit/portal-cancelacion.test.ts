import { describe, expect, it } from 'vitest';
import { PoliticaDesarrollo } from '@/src/portal/politica-desarrollo';

/**
 * T021 [US2] — Elegibilidad de cancelación según la política de 005 (FR-011, FR-012).
 *
 * El umbral (24 h) es propiedad de 005; aquí se verifica el comportamiento observable del
 * adaptador provisional: solo `reservada` a ≥24 h es cancelable; dentro de ventana o en
 * estado no reservado no lo es, y el texto de plazo se deriva de la evaluación (no hay una
 * constante "24 horas" propia del portal, 005 FR-012).
 */

const TELEFONO = '900 123 456';
const politica = new PoliticaDesarrollo({ telefonoClinica: TELEFONO });
const AHORA = new Date('2026-06-15T10:00:00.000Z');

function enHoras(h: number): Date {
  return new Date(AHORA.getTime() + h * 3600_000);
}

describe('PoliticaDesarrollo.evaluar (T021, US2)', () => {
  it('reservada a ≥24 h: cancelable', () => {
    expect(politica.evaluar({ estado: 'reservada', inicio: enHoras(24) }, AHORA)).toEqual({
      cancelable: true,
    });
    expect(politica.evaluar({ estado: 'reservada', inicio: enHoras(48) }, AHORA).cancelable).toBe(
      true,
    );
  });

  it('reservada a <24 h: no cancelable, FUERA_DE_PLAZO con teléfono', () => {
    const r = politica.evaluar({ estado: 'reservada', inicio: enHoras(23) }, AHORA);
    expect(r.cancelable).toBe(false);
    expect(r.motivo).toBe('FUERA_DE_PLAZO');
    expect(r.telefonoClinica).toBe(TELEFONO);
  });

  it('reservada ya pasada: no cancelable, YA_PASADA con teléfono', () => {
    const r = politica.evaluar({ estado: 'reservada', inicio: enHoras(-1) }, AHORA);
    expect(r.cancelable).toBe(false);
    expect(r.motivo).toBe('YA_PASADA');
    expect(r.telefonoClinica).toBe(TELEFONO);
  });

  it('estado no reservado: no cancelable, ESTADO_NO_RESERVADA', () => {
    for (const estado of ['completada', 'cancelada', 'no_asistida'] as const) {
      const r = politica.evaluar({ estado, inicio: enHoras(48) }, AHORA);
      expect(r.cancelable).toBe(false);
      expect(r.motivo).toBe('ESTADO_NO_RESERVADA');
    }
  });

  it('el adaptador no expone una constante de plazo propia (005 FR-012)', async () => {
    // El texto de "24 horas" no debe aparecer en el código del adaptador como mensaje al
    // usuario: la política solo devuelve banderas/motivos, no textos de plazo.
    const fuente = await import('node:fs').then((fs) =>
      fs.readFileSync(
        new URL('../../src/portal/politica-desarrollo.ts', import.meta.url),
        'utf8',
      ),
    );
    // Puede mencionar "24 h" en comentarios de trazabilidad, pero no como texto de UI.
    expect(fuente).not.toMatch(/mensaje[^\n]*24 horas/i);
  });
});
