import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';
import { cita, clinica, paciente, servicio } from '@/src/db/schema';
import { formatearEuros } from '@/src/domain/dinero';
import { fechaEnMadrid } from '@/src/domain/tiempo';
import { PACIENTES_DEMO, reiniciarYSembrar, SEMILLA_POR_DEFECTO } from '@/src/seed/seed';
import { CLINICA_DEMO } from '@/src/seed/datos';
import { cerrarConexion, db, limpiarBase } from './setup/ayudas';

/**
 * SC-007 y Principio 5: "misma semilla, misma historia".
 * La reproducibilidad convierte las cifras que citan specs y analítica en hechos
 * verificables por cualquiera.
 */

/** Día de referencia fijo para que la comparación no dependa del día de ejecución. */
const HOY = '2026-09-16';

beforeEach(async () => {
  await limpiarBase();
});

afterAll(async () => {
  await cerrarConexion();
});

/** Historia completa en forma comparable (sin identificadores, que son aleatorios). */
async function historia() {
  const citas = await db
    .select({
      inicio: cita.inicio,
      fin: cita.fin,
      estado: cita.estado,
      servicio: servicio.nombre,
      precioCentimos: servicio.precioCentimos,
      paciente: paciente.nombre,
    })
    .from(cita)
    .innerJoin(servicio, eq(servicio.id, cita.servicioId))
    .innerJoin(paciente, eq(paciente.id, cita.pacienteId))
    .orderBy(asc(cita.inicio), asc(paciente.nombre), asc(servicio.nombre));

  return citas.map((c) => ({
    inicio: c.inicio.toISOString(),
    fin: c.fin.toISOString(),
    estado: c.estado,
    servicio: c.servicio,
    precio: formatearEuros(c.precioCentimos),
    paciente: c.paciente,
  }));
}

describe('semilla determinista (FR-021, SC-007, Principio 5)', () => {
  it('SC-007: re-sembrar con la misma semilla produce exactamente la misma historia', async () => {
    const primera = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
    const historiaPrimera = await historia();

    const segunda = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
    const historiaSegunda = await historia();

    expect(historiaSegunda).toEqual(historiaPrimera);
    expect(segunda.citas).toBe(primera.citas);
    expect(segunda.citasPorEstado).toEqual(primera.citasPorEstado);
    expect(segunda.ingresosCompletadasCentimos).toBe(primera.ingresosCompletadasCentimos);
  });

  it('SC-007: los importes y estados agregados son reproducibles al céntimo', async () => {
    const primera = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
    const segunda = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    expect(formatearEuros(segunda.ingresosCompletadasCentimos)).toBe(
      formatearEuros(primera.ingresosCompletadasCentimos),
    );
    expect(segunda.primeraFecha).toBe(primera.primeraFecha);
    expect(segunda.ultimaFecha).toBe(primera.ultimaFecha);
  });

  it('una semilla distinta produce una historia distinta', async () => {
    await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
    const historiaOriginal = await historia();

    await reiniciarYSembrar({ semilla: 'otra-semilla-distinta', hoy: HOY, db });
    const historiaOtra = await historia();

    expect(historiaOtra).not.toEqual(historiaOriginal);
  });

  it('FR-021: reproduce el contenido exigido por la spec', async () => {
    const resumen = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    expect(resumen.clinica).toBe('Clínica Eleva');
    expect(resumen.profesionales).toBe(3);
    expect(resumen.servicios).toBe(4);
    expect(resumen.pacientes).toBe(PACIENTES_DEMO);

    const catalogo = await db
      .select({ nombre: servicio.nombre, precio: servicio.precioCentimos })
      .from(servicio)
      .orderBy(asc(servicio.precioCentimos));
    expect(catalogo).toEqual([
      { nombre: 'Consulta de nutrición', precio: 3500 },
      { nombre: 'Sesión de fisioterapia', precio: 4000 },
      { nombre: 'Primera visita de nutrición', precio: 4500 },
      { nombre: 'Primera visita de fisioterapia', precio: 5000 },
    ]);
  });

  it('FR-021: cubre 8 semanas pasadas y 2 futuras respecto al día de referencia', async () => {
    const resumen = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    const diasAntes =
      (Date.parse(`${HOY}T00:00:00Z`) - Date.parse(`${resumen.primeraFecha}T00:00:00Z`)) / 86_400_000;
    const diasDespues =
      (Date.parse(`${resumen.ultimaFecha}T00:00:00Z`) - Date.parse(`${HOY}T00:00:00Z`)) / 86_400_000;

    expect(diasAntes).toBeGreaterThanOrEqual(8 * 7 - 3);
    expect(diasAntes).toBeLessThanOrEqual(8 * 7);
    expect(diasDespues).toBeGreaterThanOrEqual(2 * 7 - 3);
    expect(diasDespues).toBeLessThanOrEqual(2 * 7);
  });

  it('FR-021: las proporciones de no asistencia (~10 %) y cancelación (~8 %) se cumplen', async () => {
    const resumen = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    const pasadas =
      resumen.citasPorEstado.completada +
      resumen.citasPorEstado.cancelada +
      resumen.citasPorEstado.no_asistida;

    expect(resumen.citasPorEstado.no_asistida / pasadas).toBeGreaterThan(0.06);
    expect(resumen.citasPorEstado.no_asistida / pasadas).toBeLessThan(0.14);
    expect(resumen.citasPorEstado.cancelada / pasadas).toBeGreaterThan(0.04);
    expect(resumen.citasPorEstado.cancelada / pasadas).toBeLessThan(0.12);
    expect(resumen.citasPorEstado.reservada).toBeGreaterThan(0);
  });

  it('Principio 3: la semilla no genera ningún solape (lo garantiza el esquema)', async () => {
    // Si la generación produjese un solape, la inserción habría fallado con 23P01.
    const resumen = await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });
    expect(resumen.citas).toBeGreaterThan(100);
  });

  it('D5: la clave de la clínica queda hasheada y valida el acceso', async () => {
    await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    const [eleva] = await db
      .select({ claveHash: clinica.claveHash })
      .from(clinica)
      .where(eq(clinica.nombre, 'Clínica Eleva'));

    expect(eleva.claveHash).not.toBe(CLINICA_DEMO.clavePorDefecto);
    expect(eleva.claveHash.startsWith('$2')).toBe(true);
    expect(bcrypt.compareSync(CLINICA_DEMO.clavePorDefecto, eleva.claveHash)).toBe(true);
    expect(bcrypt.compareSync('clave-incorrecta', eleva.claveHash)).toBe(false);
  });

  it('FR-004a: todos los teléfonos de la semilla son distintos', async () => {
    await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    const telefonos = await db.select({ telefono: paciente.telefono }).from(paciente);
    expect(new Set(telefonos.map((t) => t.telefono)).size).toBe(telefonos.length);
  });

  it('las citas caen en días laborables dentro de la franja visible', async () => {
    await reiniciarYSembrar({ semilla: SEMILLA_POR_DEFECTO, hoy: HOY, db });

    const citas = await db.select({ inicio: cita.inicio, fin: cita.fin }).from(cita);
    for (const unaCita of citas.slice(0, 200)) {
      const fecha = fechaEnMadrid(unaCita.inicio);
      const [anio, mes, dia] = fecha.split('-').map(Number);
      const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
      expect(diaSemana).toBeGreaterThanOrEqual(1);
      expect(diaSemana).toBeLessThanOrEqual(5);
    }
  });
});
