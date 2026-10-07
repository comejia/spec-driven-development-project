import { describe, expect, it } from 'vitest';
import {
  esCentimosValidos,
  eurosACentimos,
  formatearEuros,
  ImporteInvalidoError,
  sumarCentimos,
} from '@/src/domain/dinero';

/**
 * FR-019 y Principio 2 ("Los números no admiten creatividad"):
 * los importes cuadran al céntimo y se muestran en formato español.
 */
describe('dinero — exactitud al céntimo (FR-019, Principio 2)', () => {
  describe('formatearEuros', () => {
    it('FR-019: muestra 4000 céntimos como "40,00 €"', () => {
      expect(formatearEuros(4000)).toBe('40,00 €');
    });

    it('FR-019: muestra siempre dos decimales', () => {
      expect(formatearEuros(3500)).toBe('35,00 €');
      expect(formatearEuros(3550)).toBe('35,50 €');
      expect(formatearEuros(3555)).toBe('35,55 €');
      expect(formatearEuros(5)).toBe('0,05 €');
      expect(formatearEuros(0)).toBe('0,00 €');
    });

    it('FR-019: aplica la convención española de separadores', () => {
      // En español, las cantidades de cuatro cifras se escriben sin separador de miles.
      expect(formatearEuros(123456)).toBe('1234,56 €');
      expect(formatearEuros(1234567)).toBe('12.345,67 €');
    });

    it('rechaza importes que no son enteros de céntimos', () => {
      expect(() => formatearEuros(40.5)).toThrow(ImporteInvalidoError);
      expect(() => formatearEuros(Number.NaN)).toThrow(ImporteInvalidoError);
    });
  });

  describe('sumarCentimos', () => {
    it('Principio 2: sumar importes con céntimos no introduce descuadres', () => {
      // 0,10 + 0,20 daría 0,30000000000000004 en coma flotante.
      expect(sumarCentimos(10, 20)).toBe(30);
      expect(formatearEuros(sumarCentimos(10, 20))).toBe('0,30 €');
    });

    it('Principio 2: la suma de la tarifa de la semilla cuadra al céntimo', () => {
      // Servicios de la Clínica Eleva: 40,00 + 50,00 + 35,00 + 45,00 = 170,00 €
      const total = sumarCentimos(4000, 5000, 3500, 4500);
      expect(total).toBe(17000);
      expect(formatearEuros(total)).toBe('170,00 €');
    });

    it('suma repetida de céntimos sueltos no acumula error', () => {
      const total = sumarCentimos(...Array.from({ length: 1000 }, () => 1));
      expect(total).toBe(1000);
      expect(formatearEuros(total)).toBe('10,00 €');
    });
  });

  describe('eurosACentimos', () => {
    it('convierte cantidades escritas en español a céntimos exactos', () => {
      expect(eurosACentimos('40,00')).toBe(4000);
      expect(eurosACentimos('35,5')).toBe(3550);
      expect(eurosACentimos('0,05')).toBe(5);
      expect(eurosACentimos('12')).toBe(1200);
    });

    it('rechaza cantidades con más de dos decimales para no perder céntimos', () => {
      expect(() => eurosACentimos('40,005')).toThrow(ImporteInvalidoError);
      expect(() => eurosACentimos('cuarenta')).toThrow(ImporteInvalidoError);
    });
  });

  describe('esCentimosValidos', () => {
    it('solo acepta enteros seguros', () => {
      expect(esCentimosValidos(4000)).toBe(true);
      expect(esCentimosValidos(0)).toBe(true);
      expect(esCentimosValidos(40.5)).toBe(false);
      expect(esCentimosValidos('4000')).toBe(false);
    });
  });
});
