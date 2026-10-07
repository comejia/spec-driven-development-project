import { describe, expect, it } from 'vitest';
import {
  UMBRAL_CANCELACION_MS,
  decidirCancelacion,
} from '@/src/domain/politica-cancelacion';
import type { EstadoCita } from '@/src/db/schema';

/**
 * Política única de cancelación por el paciente (005 FR-007/008/009, data-model.md, D5).
 * El umbral es 24 horas: 24 h exactas SÍ es cancelable; 23 h 59 min no.
 */

const AHORA = new Date('2026-07-15T10:00:00Z');
const HORA_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function citaEn(margenMs: number): Date {
  return new Date(AHORA.getTime() + margenMs);
}

describe('decidirCancelacion — casos cancelables (T018, FR-007)', () => {
  it('permite cancelar una reservada con más de 24 h de antelación', () => {
    const d = decidirCancelacion(citaEn(25 * HORA_MS), 'reservada', AHORA);
    expect(d).toEqual({ ofrecerCancelar: true, permitirCancelar: true });
  });

  it('permite cancelar en el límite EXACTO de 24 h (24 h o más)', () => {
    const d = decidirCancelacion(citaEn(UMBRAL_CANCELACION_MS), 'reservada', AHORA);
    expect(d.ofrecerCancelar).toBe(true);
    expect(d.permitirCancelar).toBe(true);
    expect(d.motivoBloqueo).toBeUndefined();
  });

  it('ofrecerCancelar y permitirCancelar coinciden siempre (coherencia FR-012)', () => {
    for (const margen of [23 * HORA_MS, 24 * HORA_MS, 48 * HORA_MS, -1 * HORA_MS]) {
      const d = decidirCancelacion(citaEn(margen), 'reservada', AHORA);
      expect(d.ofrecerCancelar).toBe(d.permitirCancelar);
    }
  });
});

describe('decidirCancelacion — casos bloqueados (T022, FR-008/009)', () => {
  it('bloquea a 23 h 59 min por fuera_de_plazo', () => {
    const d = decidirCancelacion(citaEn(UMBRAL_CANCELACION_MS - MIN_MS), 'reservada', AHORA);
    expect(d.permitirCancelar).toBe(false);
    expect(d.motivoBloqueo).toBe('fuera_de_plazo');
  });

  it('bloquea justo por debajo del umbral (24 h menos 1 ms)', () => {
    const d = decidirCancelacion(citaEn(UMBRAL_CANCELACION_MS - 1), 'reservada', AHORA);
    expect(d.permitirCancelar).toBe(false);
    expect(d.motivoBloqueo).toBe('fuera_de_plazo');
  });

  it('bloquea una cita que ya empezó (margen 0) por ya_iniciada', () => {
    const d = decidirCancelacion(citaEn(0), 'reservada', AHORA);
    expect(d.permitirCancelar).toBe(false);
    expect(d.motivoBloqueo).toBe('ya_iniciada');
  });

  it('bloquea una cita pasada por ya_iniciada', () => {
    const d = decidirCancelacion(citaEn(-2 * HORA_MS), 'reservada', AHORA);
    expect(d.permitirCancelar).toBe(false);
    expect(d.motivoBloqueo).toBe('ya_iniciada');
  });

  it('bloquea estados no reservada por estado_no_cancelable, aunque falten días', () => {
    const estados: EstadoCita[] = ['completada', 'cancelada', 'no_asistida'];
    for (const estado of estados) {
      const d = decidirCancelacion(citaEn(72 * HORA_MS), estado, AHORA);
      expect(d.permitirCancelar).toBe(false);
      expect(d.motivoBloqueo).toBe('estado_no_cancelable');
    }
  });

  it('el umbral se calcula sobre instantes absolutos, sin ambigüedad de zona (N1)', () => {
    // Instante justo antes del cambio de hora de verano en Madrid (28/03/2027 01:00Z).
    const ahoraDST = new Date('2027-03-28T00:30:00Z');
    const a24h = new Date(ahoraDST.getTime() + UMBRAL_CANCELACION_MS);
    expect(decidirCancelacion(a24h, 'reservada', ahoraDST).permitirCancelar).toBe(true);
    const a24hMenos = new Date(ahoraDST.getTime() + UMBRAL_CANCELACION_MS - MIN_MS);
    expect(decidirCancelacion(a24hMenos, 'reservada', ahoraDST).permitirCancelar).toBe(false);
  });
});
