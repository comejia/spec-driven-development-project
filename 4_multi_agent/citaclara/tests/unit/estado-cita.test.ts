import { describe, expect, it } from 'vitest';
import {
  ESTADOS_FINALES,
  ESTADO_INICIAL,
  esTransicionValida,
  estadoLiberaHueco,
  exigirTransicionValida,
  transicionesPosibles,
} from '@/src/domain/cita';
import { ErrorNegocio } from '@/src/domain/errores';
import type { EstadoCita } from '@/src/db/schema';

/**
 * FR-007 (estado inicial), FR-008 (transiciones válidas) y FR-009 (no asistida solo
 * desde reservada). Los estados finales no se reabren en la 001.
 */
describe('máquina de estados de la cita (FR-007/008/009)', () => {
  it('FR-007: el estado inicial es reservada', () => {
    expect(ESTADO_INICIAL).toBe('reservada');
  });

  it('FR-008: desde reservada se puede completar, cancelar o marcar no asistida', () => {
    expect(esTransicionValida('reservada', 'completada')).toBe(true);
    expect(esTransicionValida('reservada', 'cancelada')).toBe(true);
    expect(esTransicionValida('reservada', 'no_asistida')).toBe(true);
    expect(transicionesPosibles('reservada')).toEqual(['completada', 'cancelada', 'no_asistida']);
  });

  it('FR-008: los estados finales no admiten ninguna transición', () => {
    for (const final of ESTADOS_FINALES) {
      expect(transicionesPosibles(final)).toEqual([]);
      for (const destino of ['completada', 'cancelada', 'no_asistida'] as const) {
        expect(esTransicionValida(final, destino)).toBe(false);
      }
    }
  });

  it('FR-009: no asistida solo se puede marcar desde reservada', () => {
    expect(esTransicionValida('reservada', 'no_asistida')).toBe(true);
    expect(esTransicionValida('completada', 'no_asistida')).toBe(false);
    expect(esTransicionValida('cancelada', 'no_asistida')).toBe(false);
    expect(esTransicionValida('no_asistida', 'no_asistida')).toBe(false);
  });

  it('FR-008: exigirTransicionValida lanza TRANSICION_INVALIDA en los casos no permitidos', () => {
    expect(() => exigirTransicionValida('reservada', 'completada')).not.toThrow();

    expect(() => exigirTransicionValida('completada', 'cancelada')).toThrow(ErrorNegocio);
    try {
      exigirTransicionValida('cancelada', 'completada');
      throw new Error('debería haber lanzado');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorNegocio);
      expect((error as ErrorNegocio).codigo).toBe('TRANSICION_INVALIDA');
      expect((error as ErrorNegocio).estado).toBe(409);
    }
  });

  it('FR-010: cancelada y no asistida liberan el hueco; reservada y completada lo ocupan', () => {
    expect(estadoLiberaHueco('cancelada')).toBe(true);
    expect(estadoLiberaHueco('no_asistida')).toBe(true);
    expect(estadoLiberaHueco('reservada')).toBe(false);
    expect(estadoLiberaHueco('completada')).toBe(false);
  });

  it('cubre los cuatro estados del modelo de datos', () => {
    const todos: EstadoCita[] = ['reservada', 'completada', 'cancelada', 'no_asistida'];
    expect([ESTADO_INICIAL, ...ESTADOS_FINALES].sort()).toEqual([...todos].sort());
  });
});
