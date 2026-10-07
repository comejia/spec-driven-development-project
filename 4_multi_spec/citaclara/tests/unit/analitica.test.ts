import { describe, expect, it } from 'vitest';
import {
  claveSemana,
  etiquetaSemana,
  formatearPorcentaje,
  minutosLaborablesDeSemana,
  ocupaHueco,
  porcentajeOcupacion,
  semanaIso,
  tasaNoAsistenciaDefA,
  ultimasNSemanas,
} from '@/src/domain/analitica';

/**
 * Dominio puro de analítica (004). El proceso corre en TZ=UTC (vitest.config.ts) para
 * forzar que el cálculo use Europe/Madrid explícitamente (D3, FR-013).
 */

describe('semanas ISO (FR-009, FR-013)', () => {
  it('asigna la semana ISO en Europe/Madrid', () => {
    // 2026-09-16 (miércoles) → semana ISO 38 de 2026.
    const instante = new Date('2026-09-16T10:00:00Z');
    expect(semanaIso(instante)).toEqual({ isoAnio: 2026, isoSemana: 38 });
  });

  it('un instante de medianoche de Madrid cuenta en el día civil de Madrid', () => {
    // 2026-08-10T22:30:00Z = 2026-08-11 00:30 en Madrid (verano, +2) → semana ISO 33.
    const instante = new Date('2026-08-10T22:30:00Z');
    expect(semanaIso(instante)).toEqual({ isoAnio: 2026, isoSemana: 33 });
  });

  it('claveSemana es ordenable cronológicamente', () => {
    expect(claveSemana({ isoAnio: 2026, isoSemana: 31 }) < claveSemana({ isoAnio: 2026, isoSemana: 32 })).toBe(true);
    expect(claveSemana({ isoAnio: 2025, isoSemana: 52 }) < claveSemana({ isoAnio: 2026, isoSemana: 1 })).toBe(true);
  });

  it('etiqueta la semana de forma inequívoca para España', () => {
    // Semana ISO 33 de 2026: lunes 10 – domingo 16 de agosto.
    expect(etiquetaSemana({ isoAnio: 2026, isoSemana: 33 })).toBe('Semana 33 · 10–16 ago');
  });

  it('ultimasNSemanas devuelve n semanas hasta la actual, en orden, sin futuras (FR-007a)', () => {
    const diaRef = new Date('2026-09-16T10:00:00Z'); // semana ISO 38
    const semanas = ultimasNSemanas(diaRef, 8);
    expect(semanas).toHaveLength(8);
    expect(semanas.at(-1)).toEqual({ isoAnio: 2026, isoSemana: 38 });
    expect(semanas[0]).toEqual({ isoAnio: 2026, isoSemana: 31 });
    // Orden ascendente.
    const claves = semanas.map(claveSemana);
    expect([...claves].sort()).toEqual(claves);
  });
});

describe('ocupación (FR-007, FR-010, SC-008)', () => {
  it('600 min por día laborable, 5 días = 3000 min/semana', () => {
    expect(minutosLaborablesDeSemana()).toBe(3000);
    expect(minutosLaborablesDeSemana(4)).toBe(2400);
  });

  it('calcula el porcentaje y lo redondea a un decimal', () => {
    expect(porcentajeOcupacion(1380, 3000)).toBe(46);
    expect(porcentajeOcupacion(1500, 3000)).toBe(50);
  });

  it('jornada 0 → "sin datos" (null), nunca divide por cero', () => {
    expect(porcentajeOcupacion(0, 0)).toBeNull();
    expect(porcentajeOcupacion(120, 0)).toBeNull();
  });

  it('nunca supera el 100 % ni baja de 0', () => {
    expect(porcentajeOcupacion(4000, 3000)).toBe(100);
    expect(porcentajeOcupacion(-10, 3000)).toBe(0);
  });

  it('profesional sin citas en semana con jornada → 0 % (no "sin datos")', () => {
    expect(porcentajeOcupacion(0, 3000)).toBe(0);
  });
});

describe('tasa de no asistencia — Definición A (FR-006, FR-006a, SC-004)', () => {
  it('no_asistida ÷ (completada + cancelada + no_asistida)', () => {
    // María Ferrer en la spec: 32 / 284 = 11,267… → 11,3 %.
    expect(tasaNoAsistenciaDefA({ completada: 236, cancelada: 16, no_asistida: 32 })).toBe(11.3);
  });

  it('denominador 0 → "sin datos" (null), sin división por cero', () => {
    expect(tasaNoAsistenciaDefA({})).toBeNull();
    expect(tasaNoAsistenciaDefA({ reservada: 5 })).toBeNull();
  });

  it('excluye las reservadas del cálculo (solo pasadas con desenlace)', () => {
    // Con 0 desenlaces pasados pero muchas reservadas futuras → sin datos.
    expect(tasaNoAsistenciaDefA({ reservada: 100 })).toBeNull();
    // Reservada no afecta al denominador cuando hay desenlace.
    expect(tasaNoAsistenciaDefA({ reservada: 100, completada: 90, no_asistida: 10 })).toBe(10);
  });
});

describe('presentación de porcentajes (FR-010, FR-011, Principio 8)', () => {
  it('formatea en es-ES con coma decimal y símbolo %', () => {
    expect(formatearPorcentaje(11.3)).toBe('11,3 %');
    expect(formatearPorcentaje(7.9)).toBe('7,9 %');
    expect(formatearPorcentaje(41)).toBe('41,0 %');
  });

  it('null → "sin datos"', () => {
    expect(formatearPorcentaje(null)).toBe('sin datos');
  });
});

describe('estados que ocupan hueco (S5, referencia a 001 FR-010/RN1)', () => {
  it('reservada y completada ocupan; cancelada y no_asistida no', () => {
    expect(ocupaHueco('reservada')).toBe(true);
    expect(ocupaHueco('completada')).toBe(true);
    expect(ocupaHueco('cancelada')).toBe(false);
    expect(ocupaHueco('no_asistida')).toBe(false);
  });
});
