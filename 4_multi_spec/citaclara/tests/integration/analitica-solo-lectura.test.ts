import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { GET } from '@/app/api/analitica/route';
import { obtenerAnalitica } from '@/src/services/analitica';
import { reiniciarYSembrar, sembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { cabeceraSesion, cerrarConexion, db } from './setup/ayudas';

/**
 * Solo lectura (FR-002, SC-003) y aislamiento por clínica (FR-012).
 *
 * SC-003: tras ejercitar el servicio y el endpoint, el estado de la clínica es idéntico
 * (mismos conteos por estado y misma huella agregada de las citas). La 004 no escribe nada.
 */

const HOY = '2026-09-16';
let clinicaA: string;
let clinicaB: string;

beforeAll(async () => {
  // Dos clínicas distintas en la misma base (semillas distintas → historias distintas).
  const a = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
  clinicaA = a.clinicaId;
  const b = await sembrar({ semilla: 'otra-clinica-004', hoy: HOY, db });
  clinicaB = b.clinicaId;
});

afterAll(async () => {
  await cerrarConexion();
});

/** Huella del estado de las citas: conteo por estado + suma de duraciones + total filas. */
async function huellaEstado() {
  const filas = await db.execute(
    sql`select estado, count(*)::int as n,
               coalesce(sum(extract(epoch from (fin - inicio)))::bigint, 0) as segundos
        from cita group by estado order by estado`,
  );
  const total = await db.execute(sql`select count(*)::int as n from cita`);
  return {
    porEstado: filas.rows,
    total: (total.rows[0] as { n: number }).n,
  };
}

describe('solo lectura (FR-002, SC-003)', () => {
  it('SC-003: ejercitar el servicio no cambia el estado de la clínica', async () => {
    const antes = await huellaEstado();

    // Ejercita todos los cálculos varias veces, con y sin día de referencia.
    await obtenerAnalitica(clinicaA, { dia_referencia: HOY }, db);
    await obtenerAnalitica(clinicaA, {}, db);
    await obtenerAnalitica(clinicaB, { dia_referencia: HOY }, db);

    const despues = await huellaEstado();
    expect(despues).toEqual(antes);
  });

  it('SC-003: ejercitar el endpoint GET tampoco escribe nada', async () => {
    const antes = await huellaEstado();

    const url = new URL('http://localhost/api/analitica');
    url.searchParams.set('dia_referencia', HOY);
    await GET(new Request(url, { headers: cabeceraSesion(clinicaA) }));
    await GET(new Request(url, { headers: cabeceraSesion(clinicaB) }));

    const despues = await huellaEstado();
    expect(despues).toEqual(antes);
  });
});

describe('aislamiento por clínica (FR-012)', () => {
  it('los ingresos de la clínica A no incluyen datos de la clínica B', async () => {
    const soloA = await obtenerAnalitica(clinicaA, { dia_referencia: HOY }, db);
    // La clínica A reproduce el total de la spec, ajeno a la clínica B.
    expect(soloA.ingresos_por_servicio.total_centimos).toBe(3_142_500);
  });

  it('cada clínica ve solo sus profesionales', async () => {
    const soloA = await obtenerAnalitica(clinicaA, { dia_referencia: HOY }, db);
    const soloB = await obtenerAnalitica(clinicaB, { dia_referencia: HOY }, db);
    const nombresA = soloA.tasa_no_asistencia.profesionales.map((p) => p.profesional_id).sort();
    const nombresB = soloB.tasa_no_asistencia.profesionales.map((p) => p.profesional_id).sort();
    // Conjuntos de identificadores disjuntos.
    for (const id of nombresA) expect(nombresB).not.toContain(id);
  });
});
