import { describe, expect, it } from 'vitest';
import { componerCuerpo, HORAS_CANCELACION_005, type DatosRecordatorio } from '@/src/domain/correo';

/**
 * T020 (US2): coherencia de la política de cancelación en el cuerpo (SC-007/FR-008/FR-009).
 * El texto comunica el umbral de 24 h de 005 y remite al teléfono de la clínica dentro de la
 * ventana; 0 textos que afirmen un plazo distinto. 002 NO fija un umbral propio.
 */

const DATOS: DatosRecordatorio = {
  pacienteNombre: 'Diana',
  profesionalNombre: 'María Ferrer',
  servicioNombre: 'Sesión de fisioterapia',
  clinicaNombre: 'Clínica Eleva',
  inicioCita: new Date('2026-10-03T08:30:00.000Z'),
  enlaceAcceso: 'https://citaclara.example/p/paciente-xyz',
};

const TELEFONO = '+34 900 123 456';

describe('política de cancelación derivada de 005 (SC-007)', () => {
  const cuerpo = componerCuerpo(DATOS, TELEFONO);

  it('comunica el umbral de 24 h (el de 005)', () => {
    expect(HORAS_CANCELACION_005).toBe(24);
    expect(cuerpo).toContain('24 horas');
  });

  it('remite al teléfono de la clínica dentro de la ventana', () => {
    expect(cuerpo).toContain(TELEFONO);
    expect(cuerpo.toLowerCase()).toContain('llámanos');
  });

  it('no afirma ningún otro plazo (p. ej. 2 h o 48 h)', () => {
    expect(cuerpo).not.toMatch(/\b2\s*horas\b/);
    expect(cuerpo).not.toMatch(/\b48\s*horas\b/);
    // Solo aparece el plazo de 24 h.
    const plazos = cuerpo.match(/\d+\s*horas/g) ?? [];
    expect(new Set(plazos)).toEqual(new Set(['24 horas']));
  });
});
