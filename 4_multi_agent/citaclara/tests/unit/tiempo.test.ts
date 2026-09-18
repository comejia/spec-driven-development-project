import { describe, expect, it } from 'vitest';
import {
  calcularFin,
  esGranularidadValida,
  fechaEnMadrid,
  formatearFecha,
  formatearFechaHora,
  FRANJA_VISIBLE,
  horaAMinutos,
  horaEnMadrid,
  inicioDelDia,
  inicioDelDiaSiguiente,
  instanteEnMadrid,
  minutosDesdeMedianoche,
  tramosDeLaFranja,
  ZONA_NEGOCIO,
} from '@/src/domain/tiempo';

/**
 * FR-005a (granularidad de 5 minutos), FR-006 (fin derivado) y FR-019 (formato
 * inequívoco es-ES) sobre la zona de negocio fija Europe/Madrid (D3).
 * El proceso corre en UTC (ver vitest.config.ts) para demostrar que el resultado no
 * depende de la zona del servidor.
 */
describe('tiempo — zona de negocio y granularidad (FR-005a/006/019, D3)', () => {
  it('D3: la zona de negocio es Europe/Madrid', () => {
    expect(ZONA_NEGOCIO).toBe('Europe/Madrid');
  });

  describe('esGranularidadValida (FR-005a)', () => {
    it('acepta tramos exactos de 5 minutos', () => {
      expect(esGranularidadValida(instanteEnMadrid('2026-10-01', '10:00'))).toBe(true);
      expect(esGranularidadValida(instanteEnMadrid('2026-10-01', '10:05'))).toBe(true);
      expect(esGranularidadValida(instanteEnMadrid('2026-10-01', '10:45'))).toBe(true);
    });

    it('FR-005a: rechaza 10:07 y cualquier minuto no múltiplo de 5', () => {
      expect(esGranularidadValida(instanteEnMadrid('2026-10-01', '10:07'))).toBe(false);
      expect(esGranularidadValida(instanteEnMadrid('2026-10-01', '10:01'))).toBe(false);
      expect(esGranularidadValida(instanteEnMadrid('2026-10-01', '10:59'))).toBe(false);
    });

    it('FR-005a: rechaza instantes con segundos o milisegundos', () => {
      expect(esGranularidadValida(new Date('2026-10-01T10:00:30Z'))).toBe(false);
      expect(esGranularidadValida(new Date('2026-10-01T10:00:00.500Z'))).toBe(false);
    });
  });

  describe('calcularFin (FR-006)', () => {
    it('FR-006: una sesión de 45 min que empieza a las 10:00 acaba a las 10:45', () => {
      const inicio = instanteEnMadrid('2026-10-01', '10:00');
      expect(horaEnMadrid(calcularFin(inicio, 45))).toBe('10:45');
    });

    it('FR-006: el fin cruza correctamente la hora', () => {
      const inicio = instanteEnMadrid('2026-10-01', '10:30');
      expect(horaEnMadrid(calcularFin(inicio, 45))).toBe('11:15');
    });

    it('rechaza duraciones no positivas o no enteras', () => {
      const inicio = instanteEnMadrid('2026-10-01', '10:00');
      expect(() => calcularFin(inicio, 0)).toThrow();
      expect(() => calcularFin(inicio, -30)).toThrow();
      expect(() => calcularFin(inicio, 12.5)).toThrow();
    });
  });

  describe('interpretación y formato en Europe/Madrid (D3, FR-019)', () => {
    it('en horario de verano, las 10:00 de Madrid son las 08:00 UTC', () => {
      expect(instanteEnMadrid('2026-07-01', '10:00').toISOString()).toBe('2026-07-01T08:00:00.000Z');
    });

    it('en horario de invierno, las 10:00 de Madrid son las 09:00 UTC', () => {
      expect(instanteEnMadrid('2026-01-15', '10:00').toISOString()).toBe('2026-01-15T09:00:00.000Z');
    });

    it('FR-019: la fecha y hora se muestran en formato español de 24 horas', () => {
      const instante = instanteEnMadrid('2026-10-01', '17:30');
      expect(formatearFechaHora(instante)).toBe('01/10/2026 17:30');
      expect(formatearFecha(instante)).toBe('01/10/2026');
      expect(horaEnMadrid(instante)).toBe('17:30');
    });

    it('un instante nocturno UTC pertenece al día correcto en Madrid', () => {
      // 30/09/2026 23:30 UTC = 01/10/2026 01:30 en Madrid.
      const instante = new Date('2026-09-30T23:30:00.000Z');
      expect(fechaEnMadrid(instante)).toBe('2026-10-01');
      expect(horaEnMadrid(instante)).toBe('01:30');
    });
  });

  describe('límites del día de agenda', () => {
    it('el día va de medianoche a medianoche en hora de Madrid', () => {
      expect(inicioDelDia('2026-10-01').toISOString()).toBe('2026-09-30T22:00:00.000Z');
      expect(inicioDelDiaSiguiente('2026-10-01').toISOString()).toBe('2026-10-01T22:00:00.000Z');
    });

    it('resuelve el cambio de mes y de año', () => {
      expect(fechaEnMadrid(inicioDelDiaSiguiente('2026-01-31'))).toBe('2026-02-01');
      expect(fechaEnMadrid(inicioDelDiaSiguiente('2026-12-31'))).toBe('2027-01-01');
    });

    it('el día del cambio a horario de invierno dura 25 horas', () => {
      // Último domingo de octubre de 2026: 25/10/2026.
      const duracionHoras =
        (inicioDelDiaSiguiente('2026-10-25').getTime() - inicioDelDia('2026-10-25').getTime()) /
        3_600_000;
      expect(duracionHoras).toBe(25);
    });
  });

  describe('franja visible de la agenda (FR-016a)', () => {
    it('FR-016a: la franja visible es de 08:00 a 21:00', () => {
      expect(FRANJA_VISIBLE.desde).toBe('08:00');
      expect(FRANJA_VISIBLE.hasta).toBe('21:00');
    });

    it('los tramos cubren la franja completa sin pasarse', () => {
      const tramos = tramosDeLaFranja(15);
      expect(tramos[0]).toBe('08:00');
      expect(tramos.at(-1)).toBe('20:45');
      expect(tramos).toHaveLength(((21 - 8) * 60) / 15);
    });

    it('convierte horas y minutos de forma consistente', () => {
      expect(horaAMinutos('08:00')).toBe(480);
      expect(minutosDesdeMedianoche(instanteEnMadrid('2026-10-01', '08:00'))).toBe(480);
      expect(minutosDesdeMedianoche(instanteEnMadrid('2026-10-01', '20:45'))).toBe(1245);
    });
  });
});
