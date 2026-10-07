import { describe, expect, it } from 'vitest';
import { eficaciaRecordatorio } from '@/src/domain/recordatorio';
import type { EstadoCita } from '@/src/db/schema';

/**
 * T033 (Polish): eficacia del recordatorio (SC-008), métrica PROPIA de 002.
 *
 * Es distinta de la TASA OFICIAL de no asistencia, que es PROPIEDAD DE 004
 * (no_asistida ÷ (completada + cancelada + no_asistida), FR-006 de 004). Aquí el denominador
 * es "citas recordadas" y el numerador "no_asistida". Debe leerse con el efecto
 * "la cancelación sustituye al no-show".
 */

function recordadas(...estados: EstadoCita[]): { estado: EstadoCita }[] {
  return estados.map((estado) => ({ estado }));
}

describe('eficaciaRecordatorio (SC-008)', () => {
  it('devuelve 0 cuando no hay citas recordadas (evita división por cero)', () => {
    expect(eficaciaRecordatorio([])).toBe(0);
  });

  it('es 0 si ninguna cita recordada acabó en no_asistida', () => {
    expect(eficaciaRecordatorio(recordadas('completada', 'cancelada', 'completada'))).toBe(0);
  });

  it('es 1 si todas las recordadas acabaron en no_asistida', () => {
    expect(eficaciaRecordatorio(recordadas('no_asistida', 'no_asistida'))).toBe(1);
  });

  it('calcula la proporción sobre el total de recordadas (denominador = recordadas)', () => {
    // 1 no_asistida sobre 4 recordadas = 0,25.
    expect(eficaciaRecordatorio(recordadas('no_asistida', 'completada', 'cancelada', 'reservada'))).toBeCloseTo(
      0.25,
      5,
    );
  });

  it('las cancelaciones NO cuentan como no-show (cancelación sustituye al no-show)', () => {
    // 3 canceladas + 1 no_asistida sobre 4 → solo la no_asistida cuenta en el numerador.
    expect(
      eficaciaRecordatorio(recordadas('cancelada', 'cancelada', 'cancelada', 'no_asistida')),
    ).toBeCloseTo(0.25, 5);
  });
});
