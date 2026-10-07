import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/agenda/route';
import { crearCita } from '@/src/services/crear-cita';
import { cita } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import {
  cabeceraSesion,
  cerrarConexion,
  crearEscenario,
  db,
  fechaFutura,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Contract test de `GET /api/agenda` (contracts/agenda.md, FR-015/016/016a).
 * La agenda del día devuelve solo las citas del profesional indicado, en orden
 * cronológico, y declara la franja visible fija 08:00–21:00.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

function peticionAgenda(
  parametros: Record<string, string | undefined>,
  conSesion = true,
  clinicaId?: string,
) {
  const url = new URL('http://localhost/api/agenda');
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined) url.searchParams.set(clave, valor);
  }
  return new Request(url, {
    headers: conSesion ? cabeceraSesion(clinicaId ?? escenario.clinicaId) : {},
  });
}

/** Crea una cita en el día de referencia. */
async function citaEn(hora: string, opciones: Partial<Record<string, string>> = {}) {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: opciones.profesional ?? escenario.profesionales.maria,
      servicio_id: opciones.servicio ?? escenario.servicios.sesionFisio,
      paciente_id: opciones.paciente ?? escenario.pacientes.ana,
      inicio: instanteFuturo(hora).toISOString(),
    },
    db,
  );
}

describe('GET /api/agenda — contrato (contracts/agenda.md)', () => {
  it('200: declara el profesional, la fecha y la franja visible fija (FR-016a)', async () => {
    const fecha = fechaFutura();
    const respuesta = await GET(
      peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha }),
    );
    expect(respuesta.status).toBe(200);

    const cuerpo = await respuesta.json();
    expect(cuerpo.profesional).toMatchObject({
      id: escenario.profesionales.maria,
      nombre: 'María Ferrer',
      especialidad: 'Fisioterapia',
    });
    expect(cuerpo.fecha).toBe(fecha);
    expect(cuerpo.franja_visible).toEqual({ desde: '08:00', hasta: '21:00' });
    expect(cuerpo.citas).toEqual([]);
  });

  it('200: devuelve las citas en orden cronológico ascendente (FR-015)', async () => {
    await citaEn('16:00', { paciente: escenario.pacientes.carla });
    await citaEn('09:00', { paciente: escenario.pacientes.ana });
    await citaEn('12:00', { paciente: escenario.pacientes.bruno });

    const respuesta = await GET(
      peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha: fechaFutura() }),
    );
    const cuerpo = await respuesta.json();

    expect(cuerpo.citas.map((c: { inicio: string }) => new Date(c.inicio).toISOString())).toEqual(
      [...cuerpo.citas]
        .map((c: { inicio: string }) => new Date(c.inicio).toISOString())
        .sort((a, b) => a.localeCompare(b)),
    );
    expect(cuerpo.citas).toHaveLength(3);
  });

  it('200: cada cita trae inicio, fin, servicio, paciente y estado (FR-015)', async () => {
    await citaEn('10:00');

    const cuerpo = await (
      await GET(
        peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha: fechaFutura() })
      )
    ).json();

    const [primera] = cuerpo.citas;
    expect(primera).toMatchObject({
      estado: 'reservada',
      servicio: { nombre: 'Sesión de fisioterapia', duracion_min: 45 },
      paciente: { id: escenario.pacientes.ana, nombre: 'Ana Belmonte' },
    });
    // Importe al céntimo y formateado en es-ES (FR-019, D2).
    expect(primera.servicio.precio).toBe('40,00 €');
    expect(primera.servicio.precio_centimos).toBe(4000);
    expect(new Date(primera.fin).getTime() - new Date(primera.inicio).getTime()).toBe(45 * 60_000);
  });

  it('FR-016: no muestra citas de otros profesionales', async () => {
    await citaEn('10:00', { profesional: escenario.profesionales.maria });
    await citaEn('11:00', {
      profesional: escenario.profesionales.jorge,
      paciente: escenario.pacientes.bruno,
    });
    await citaEn('12:00', {
      profesional: escenario.profesionales.lucia,
      servicio: escenario.servicios.consultaNutricion,
      paciente: escenario.pacientes.carla,
    });

    const deMaria = await (
      await GET(
        peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha: fechaFutura() })
      )
    ).json();
    expect(deMaria.citas).toHaveLength(1);
    expect(deMaria.citas[0].paciente.nombre).toBe('Ana Belmonte');

    const deJorge = await (
      await GET(
        peticionAgenda({ profesional_id: escenario.profesionales.jorge, fecha: fechaFutura() })
      )
    ).json();
    expect(deJorge.citas).toHaveLength(1);
    expect(deJorge.citas[0].paciente.nombre).toBe('Bruno Cañas');
  });

  it('200: solo devuelve las citas del día consultado', async () => {
    await citaEn('10:00');
    const otroDia = await crearCita(
      escenario.clinicaId,
      {
        profesional_id: escenario.profesionales.maria,
        servicio_id: escenario.servicios.sesionFisio,
        paciente_id: escenario.pacientes.bruno,
        inicio: instanteFuturo('10:00', 45).toISOString(),
      },
      db,
    );
    expect(otroDia.id).toBeDefined();

    const cuerpo = await (
      await GET(
        peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha: fechaFutura() })
      )
    ).json();
    expect(cuerpo.citas).toHaveLength(1);
  });

  it('200: las citas canceladas se muestran con su estado, sin ocupar el hueco', async () => {
    const cancelada = await citaEn('10:00');
    await db.update(cita).set({ estado: 'cancelada' }).where(eq(cita.id, cancelada.id));

    const cuerpo = await (
      await GET(
        peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha: fechaFutura() })
      )
    ).json();

    expect(cuerpo.citas).toHaveLength(1);
    expect(cuerpo.citas[0].estado).toBe('cancelada');
    expect(cuerpo.citas[0].ocupa_hueco).toBe(false);
  });

  it('400 DATOS_INCOMPLETOS: falta profesional_id o fecha', async () => {
    const sinFecha = await GET(peticionAgenda({ profesional_id: escenario.profesionales.maria }));
    expect(sinFecha.status).toBe(400);
    expect((await sinFecha.json()).error.codigo).toBe('DATOS_INCOMPLETOS');

    const sinProfesional = await GET(peticionAgenda({ fecha: fechaFutura() }));
    expect(sinProfesional.status).toBe(400);
  });

  it('404 PROFESIONAL_NO_EXISTE: el profesional no es de la clínica', async () => {
    const otraClinica = await crearEscenario();
    const respuesta = await GET(
      peticionAgenda({ profesional_id: otraClinica.profesionales.maria, fecha: fechaFutura() }),
    );
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error.codigo).toBe('PROFESIONAL_NO_EXISTE');
  });

  it('401 NO_AUTORIZADO: sin sesión de clínica no se ve ninguna agenda (FR-018)', async () => {
    const respuesta = await GET(
      peticionAgenda(
        { profesional_id: escenario.profesionales.maria, fecha: fechaFutura() },
        false,
      ),
    );
    expect(respuesta.status).toBe(401);
    expect((await respuesta.json()).error.codigo).toBe('NO_AUTORIZADO');
  });

  it('422 FECHA_INVALIDA: la fecha no tiene el formato esperado', async () => {
    const respuesta = await GET(
      peticionAgenda({ profesional_id: escenario.profesionales.maria, fecha: '16-09-2026' }),
    );
    expect(respuesta.status).toBe(422);
    expect((await respuesta.json()).error.codigo).toBe('FECHA_INVALIDA');
  });
});
