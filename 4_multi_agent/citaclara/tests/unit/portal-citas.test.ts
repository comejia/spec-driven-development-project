import { describe, expect, it } from 'vitest';
import { consultarCitasPaciente } from '@/src/portal/consultar-citas-paciente';
import { PoliticaDesarrollo } from '@/src/portal/politica-desarrollo';
import type { BaseDatos } from '@/src/db';
import type { EstadoCita } from '@/src/db/schema';

/**
 * T014 [US1] — Agrupado futura/pasada (RD-1), orden (FR-007), formato ES (FR-006) y marca
 * `cancelable` según política 005 (RD-2). Sin base de datos real: un doble de `BaseDatos`
 * sirve la ficha del paciente y las filas de citas.
 */

const CLINICA = 'c1';
const PACIENTE = 'p1';

interface FilaCitaSimulada {
  id: string;
  inicio: Date;
  estado: EstadoCita;
  profesional: string;
  servicio: string;
}

/** Doble de BaseDatos: 1.ª consulta → ficha paciente; 2.ª consulta → citas. */
function dbSimulada(nombre: string | null, filas: FilaCitaSimulada[]): BaseDatos {
  let llamada = 0;
  return {
    select: () => ({
      from: () => ({
        where: () => {
          llamada += 1;
          if (llamada === 1) {
            return { limit: async () => (nombre ? [{ nombre }] : []) };
          }
          return Promise.resolve(filas);
        },
        innerJoin() {
          return this;
        },
      }),
    }),
  } as unknown as BaseDatos;
}

const AHORA = new Date('2026-06-15T10:00:00.000Z');

function desplazar(offsetHoras: number): Date {
  return new Date(AHORA.getTime() + offsetHoras * 3600_000);
}

const politica = new PoliticaDesarrollo({ telefonoClinica: '900 000 000' });

describe('consultarCitasPaciente — vista del portal (T014, US1)', () => {
  it('separa próximas (asc) e historial (desc) y formatea en ES', async () => {
    const filas: FilaCitaSimulada[] = [
      { id: 'f-lejana', inicio: desplazar(72), estado: 'reservada', profesional: 'María Ferrer', servicio: 'Sesión de fisioterapia' },
      { id: 'f-proxima', inicio: desplazar(48), estado: 'reservada', profesional: 'Jorge Nieto', servicio: 'Sesión de fisioterapia' },
      { id: 'h-reciente', inicio: desplazar(-24), estado: 'completada', profesional: 'María Ferrer', servicio: 'Sesión de fisioterapia' },
      { id: 'h-antigua', inicio: desplazar(-240), estado: 'cancelada', profesional: 'Lucía Prados', servicio: 'Consulta de nutrición' },
    ];
    const vista = await consultarCitasPaciente(
      CLINICA,
      PACIENTE,
      AHORA,
      dbSimulada('Lucía García', filas),
      politica,
    );

    expect(vista.paciente.nombre).toBe('Lucía García');
    expect(vista.proximas.map((c) => c.id)).toEqual(['f-proxima', 'f-lejana']);
    expect(vista.historial.map((c) => c.id)).toEqual(['h-reciente', 'h-antigua']);
    expect(vista.proximas[0].fechaHoraTexto).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(vista.historial[0].estado).toBe('Completada');
  });

  it('marca cancelable=true solo para reservadas a ≥24 h (RD-2)', async () => {
    const filas: FilaCitaSimulada[] = [
      { id: 'lejana', inicio: desplazar(48), estado: 'reservada', profesional: 'María Ferrer', servicio: 'S' },
      { id: 'pronto', inicio: desplazar(2), estado: 'reservada', profesional: 'María Ferrer', servicio: 'S' },
    ];
    const vista = await consultarCitasPaciente(CLINICA, PACIENTE, AHORA, dbSimulada('N', filas), politica);

    const lejana = vista.proximas.find((c) => c.id === 'lejana')!;
    const pronto = vista.proximas.find((c) => c.id === 'pronto')!;
    expect(lejana.cancelable).toBe(true);
    expect(pronto.cancelable).toBe(false);
    expect(pronto.telefonoClinica).toBe('900 000 000');
  });

  it('estados vacíos: paciente sin citas devuelve listas vacías (FR-008)', async () => {
    const vista = await consultarCitasPaciente(CLINICA, PACIENTE, AHORA, dbSimulada('N', []), politica);
    expect(vista.proximas).toEqual([]);
    expect(vista.historial).toEqual([]);
  });
});
