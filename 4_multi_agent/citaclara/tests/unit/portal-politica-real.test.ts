import { describe, expect, it } from 'vitest';
import { PoliticaReal } from '@/src/portal/politica-real';

/**
 * Adaptador REAL de política: comprueba que `PoliticaReal` delega en `decidirCancelacion`
 * de 005 y traduce su `MotivoBloqueo` al `MotivoNoCancelable` del puerto de 003, sin
 * reimplementar el umbral de 24 h (005 FR-007/008/009, FR-012).
 */

const TELEFONO = '900 123 456';
const politica = new PoliticaReal({ telefonoClinica: TELEFONO });
const AHORA = new Date('2026-06-15T10:00:00.000Z');

function enHoras(h: number): Date {
  return new Date(AHORA.getTime() + h * 3600_000);
}

describe('PoliticaReal.evaluar — delegación en 005', () => {
  it('reservada a ≥24 h: cancelable (límite exacto incluido)', () => {
    expect(politica.evaluar({ estado: 'reservada', inicio: enHoras(24) }, AHORA)).toEqual({
      cancelable: true,
    });
    expect(
      politica.evaluar({ estado: 'reservada', inicio: enHoras(48) }, AHORA).cancelable,
    ).toBe(true);
  });

  it('reservada a <24 h: FUERA_DE_PLAZO con teléfono', () => {
    const r = politica.evaluar({ estado: 'reservada', inicio: enHoras(23) }, AHORA);
    expect(r.cancelable).toBe(false);
    expect(r.motivo).toBe('FUERA_DE_PLAZO');
    expect(r.telefonoClinica).toBe(TELEFONO);
  });

  it('reservada ya pasada: YA_PASADA con teléfono', () => {
    const r = politica.evaluar({ estado: 'reservada', inicio: enHoras(-1) }, AHORA);
    expect(r.cancelable).toBe(false);
    expect(r.motivo).toBe('YA_PASADA');
    expect(r.telefonoClinica).toBe(TELEFONO);
  });

  it('estado no reservado: ESTADO_NO_RESERVADA sin teléfono (no hay vía alternativa)', () => {
    for (const estado of ['completada', 'cancelada', 'no_asistida'] as const) {
      const r = politica.evaluar({ estado, inicio: enHoras(48) }, AHORA);
      expect(r.cancelable).toBe(false);
      expect(r.motivo).toBe('ESTADO_NO_RESERVADA');
      expect(r.telefonoClinica).toBeUndefined();
    }
  });

  it('no escribe un texto de plazo propio: delega en 005 (FR-012)', async () => {
    const fuente = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../src/portal/politica-real.ts', import.meta.url), 'utf8'),
    );
    expect(fuente).not.toMatch(/mensaje[^\n]*24 horas/i);
  });
});
