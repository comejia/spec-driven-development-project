import { describe, expect, it } from 'vitest';
import {
  calcularVentana,
  esElegible,
  eficaciaRecordatorio,
  HORAS_ANTELACION_MAX,
  HORAS_ANTELACION_MIN,
  inicioEnVentana,
} from '@/src/domain/recordatorio';
import type { EstadoCita } from '@/src/db/schema';

/**
 * T011 (US1): lógica pura de ventana 24-48 h y elegibilidad (FR-002, FR-012).
 * Sin base de datos: se inyecta el instante de referencia (reproducibilidad, D6).
 */

const REFERENCIA = new Date('2026-10-01T09:00:00.000Z');
const HORA = 60 * 60 * 1000;

function citaEn(horasDelante: number, estado: EstadoCita = 'reservada') {
  return { estado, inicio: new Date(REFERENCIA.getTime() + horasDelante * HORA) };
}

describe('calcularVentana', () => {
  it('devuelve [referencia+24h, referencia+48h)', () => {
    const v = calcularVentana(REFERENCIA);
    expect(v.desde.getTime()).toBe(REFERENCIA.getTime() + HORAS_ANTELACION_MIN * HORA);
    expect(v.hasta.getTime()).toBe(REFERENCIA.getTime() + HORAS_ANTELACION_MAX * HORA);
  });
});

describe('inicioEnVentana', () => {
  const v = calcularVentana(REFERENCIA);
  it('incluye el límite inferior (24h exactas)', () => {
    expect(inicioEnVentana(new Date(REFERENCIA.getTime() + 24 * HORA), v)).toBe(true);
  });
  it('excluye el límite superior (48h exactas)', () => {
    expect(inicioEnVentana(new Date(REFERENCIA.getTime() + 48 * HORA), v)).toBe(false);
  });
  it('acepta un punto intermedio (36h)', () => {
    expect(inicioEnVentana(new Date(REFERENCIA.getTime() + 36 * HORA), v)).toBe(true);
  });
});

describe('esElegible', () => {
  it('es elegible una cita reservada a 36h', () => {
    expect(esElegible(citaEn(36), REFERENCIA)).toBe(true);
  });
  it('no es elegible antes de 24h (demasiado cerca)', () => {
    expect(esElegible(citaEn(12), REFERENCIA)).toBe(false);
  });
  it('no es elegible a partir de 48h (demasiado lejos)', () => {
    expect(esElegible(citaEn(48), REFERENCIA)).toBe(false);
  });
  it('no es elegible una cita ya pasada', () => {
    expect(esElegible(citaEn(-5), REFERENCIA)).toBe(false);
  });

  it.each<EstadoCita>(['cancelada', 'completada', 'no_asistida'])(
    'no es elegible una cita en estado %s aunque caiga en ventana',
    (estado) => {
      expect(esElegible(citaEn(36, estado), REFERENCIA)).toBe(false);
    },
  );
});

describe('eficaciaRecordatorio (SC-008)', () => {
  it('devuelve 0 sin citas recordadas', () => {
    expect(eficaciaRecordatorio([])).toBe(0);
  });
  it('cuenta la proporción de no_asistida sobre el total recordado', () => {
    const recordadas: { estado: EstadoCita }[] = [
      { estado: 'no_asistida' },
      { estado: 'completada' },
      { estado: 'cancelada' },
      { estado: 'no_asistida' },
    ];
    expect(eficaciaRecordatorio(recordadas)).toBeCloseTo(0.5, 5);
  });
});
