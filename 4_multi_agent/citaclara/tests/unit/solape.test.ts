import { describe, expect, it } from 'vitest';
import { estaLibre, IntervaloInvalidoError, primerSolape, solapan } from '@/src/domain/solape';
import { instanteEnMadrid } from '@/src/domain/tiempo';

const intervalo = (desde: string, hasta: string) => ({
  inicio: instanteEnMadrid('2026-10-01', desde),
  fin: instanteEnMadrid('2026-10-01', hasta),
});

/**
 * FR-012 y Principio 3: la detección de solape usa intervalos `[inicio, fin)`, la misma
 * semántica que la franja `tstzrange` con límites '[)' de la base de datos (D1).
 */
describe('solape — intervalos [inicio, fin) (FR-012, Principio 3)', () => {
  it('FR-012: dos citas idénticas solapan', () => {
    expect(solapan(intervalo('10:00', '10:45'), intervalo('10:00', '10:45'))).toBe(true);
  });

  it('FR-012: solape parcial por la derecha', () => {
    expect(solapan(intervalo('10:00', '10:45'), intervalo('10:30', '11:15'))).toBe(true);
  });

  it('FR-012: solape parcial por la izquierda', () => {
    expect(solapan(intervalo('10:30', '11:15'), intervalo('10:00', '10:45'))).toBe(true);
  });

  it('FR-012: contención (una cita dentro de otra) solapa', () => {
    expect(solapan(intervalo('10:00', '11:00'), intervalo('10:15', '10:30'))).toBe(true);
    expect(solapan(intervalo('10:15', '10:30'), intervalo('10:00', '11:00'))).toBe(true);
  });

  it('FR-012: las citas adyacentes NO solapan (el fin de una es el inicio de la otra)', () => {
    expect(solapan(intervalo('10:00', '10:45'), intervalo('10:45', '11:30'))).toBe(false);
    expect(solapan(intervalo('10:45', '11:30'), intervalo('10:00', '10:45'))).toBe(false);
  });

  it('FR-012: intervalos separados no solapan', () => {
    expect(solapan(intervalo('09:00', '09:45'), intervalo('10:00', '10:45'))).toBe(false);
  });

  it('rechaza intervalos con fin anterior o igual al inicio', () => {
    expect(() => solapan(intervalo('10:00', '10:00'), intervalo('10:00', '10:45'))).toThrow(
      IntervaloInvalidoError,
    );
    expect(() => solapan(intervalo('11:00', '10:00'), intervalo('10:00', '10:45'))).toThrow(
      IntervaloInvalidoError,
    );
  });

  describe('primerSolape y estaLibre', () => {
    const agenda = [intervalo('09:00', '09:45'), intervalo('10:00', '10:45')];

    it('encuentra la cita concreta con la que choca el candidato', () => {
      const choque = primerSolape(intervalo('10:30', '11:00'), agenda);
      expect(choque).toBe(agenda[1]);
    });

    it('un hueco adyacente entre citas está libre', () => {
      expect(estaLibre(intervalo('09:45', '10:00'), agenda)).toBe(true);
      expect(primerSolape(intervalo('09:45', '10:00'), agenda)).toBeUndefined();
    });

    it('un candidato que pisa cualquier cita no está libre', () => {
      expect(estaLibre(intervalo('09:30', '10:15'), agenda)).toBe(false);
    });
  });
});
