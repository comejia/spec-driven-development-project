import { describe, expect, it } from 'vitest';
import { AccesoDesarrollo, tokenDeDesarrollo } from '@/src/portal/acceso-desarrollo';
import type { BaseDatos } from '@/src/db';

/**
 * T009 [US3] — Adaptador PROVISIONAL de acceso (contracts/puertos-005.md; FR-001..FR-004).
 *
 * Se prueba la lógica de resolución del token SIN base de datos real mediante un doble de
 * `BaseDatos` que devuelve la fila del paciente cuando su id está en el catálogo simulado.
 * Verifica: token válido `dev-<pacienteId>` → ok; token vacío/sin prefijo/manipulado →
 * denegado (mensaje neutro, D3); regeneración (005 FR-004); y que el acceso usa SOLO el
 * token, sin segundo factor (FR-004 / D7).
 */

const PACIENTE_VALIDO = '11111111-1111-4111-8111-111111111111';
const CLINICA = '22222222-2222-4222-8222-222222222222';
const PACIENTE_REGENERADO = '33333333-3333-4333-8333-333333333333';

/**
 * Doble de BaseDatos que replica la cadena `select().from().where().limit()` del adaptador
 * y resuelve a las filas cuyo id (2.º valor del `eq(paciente.id, id)`) está en el catálogo.
 */
function dbSimulada(catalogo: Record<string, string>): BaseDatos {
  return {
    select: () => ({
      from: () => ({
        where: (condicion: { queryChunks?: unknown[] }) => ({
          limit: () => {
            const id = extraerId(condicion);
            const filas = id && catalogo[id] ? [{ id, clinicaId: catalogo[id] }] : [];
            return Object.assign(Promise.resolve(filas), {
              catch: () => Promise.resolve(filas),
            });
          },
        }),
      }),
    }),
  } as unknown as BaseDatos;
}

/** Extrae el valor comparado dentro del `eq(paciente.id, <id>)` de Drizzle. */
function extraerId(condicion: { queryChunks?: unknown[] }): string | undefined {
  const trozos = condicion?.queryChunks ?? [];
  for (const trozo of trozos) {
    const valor = (trozo as { value?: unknown })?.value;
    if (typeof valor === 'string') return valor;
  }
  return undefined;
}

describe('AccesoDesarrollo — resolución de token (T009, US3)', () => {
  const catalogo = { [PACIENTE_VALIDO]: CLINICA };

  it('token válido dev-<pacienteId> resuelve el paciente y su clínica', async () => {
    const adaptador = new AccesoDesarrollo(dbSimulada(catalogo));
    const resultado = await adaptador.resolverPaciente(tokenDeDesarrollo(PACIENTE_VALIDO));
    expect(resultado).toEqual({ ok: true, pacienteId: PACIENTE_VALIDO, clinicaId: CLINICA });
  });

  it('token vacío se deniega sin filtrar información', async () => {
    const adaptador = new AccesoDesarrollo(dbSimulada(catalogo));
    expect(await adaptador.resolverPaciente('')).toEqual({ ok: false });
  });

  it('token sin prefijo dev- se deniega', async () => {
    const adaptador = new AccesoDesarrollo(dbSimulada(catalogo));
    expect(await adaptador.resolverPaciente(PACIENTE_VALIDO)).toEqual({ ok: false });
  });

  it('token manipulado (paciente inexistente) se deniega', async () => {
    const adaptador = new AccesoDesarrollo(dbSimulada(catalogo));
    const resultado = await adaptador.resolverPaciente(
      'dev-00000000-0000-4000-8000-000000000000',
    );
    expect(resultado).toEqual({ ok: false });
  });

  it('regeneración (005 FR-004): antiguo denegado, nuevo resuelve el mismo paciente', async () => {
    const catalogoTrasRegenerar = { [PACIENTE_REGENERADO]: CLINICA };
    const adaptador = new AccesoDesarrollo(dbSimulada(catalogoTrasRegenerar));

    expect(await adaptador.resolverPaciente(tokenDeDesarrollo(PACIENTE_VALIDO))).toEqual({
      ok: false,
    });
    expect(await adaptador.resolverPaciente(tokenDeDesarrollo(PACIENTE_REGENERADO))).toEqual({
      ok: true,
      pacienteId: PACIENTE_REGENERADO,
      clinicaId: CLINICA,
    });
  });

  it('resolverPaciente acepta solo el token (sin segundo factor, FR-004/D7)', () => {
    const adaptador = new AccesoDesarrollo(dbSimulada(catalogo));
    expect(adaptador.resolverPaciente.length).toBe(1);
  });
});
