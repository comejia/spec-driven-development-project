import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { POST } from '@/app/api/portal/[token]/cancelar/route';
import { cita } from '@/src/db/schema';
import { crearCita } from '@/src/services/crear-cita';
import { tokenDeDesarrollo } from '@/src/portal/acceso-desarrollo';
import { calcularFin } from '@/src/domain/tiempo';
import {
  cerrarConexion,
  crearEscenario,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * T022 [US2] — Contrato de cancelación (contracts/portal-cancelacion.md; FR-009, FR-010,
 * SC-003, SC-004). Flujo feliz + ACCESO_DENEGADO, CITA_NO_EXISTE, FUERA_DE_PLAZO,
 * DATOS_INCOMPLETOS.
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

/** Cita futura reservada a 30 días (cancelable según política 005). */
async function citaCancelable(pacienteId = escenario.pacientes.ana) {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: pacienteId,
      inicio: instanteFuturo('10:00', 30).toISOString(),
    },
    db,
  );
}

function llamarPost(token: string, cuerpo: unknown) {
  const peticion = new Request(`http://localhost/api/portal/${token}/cancelar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return POST(peticion, { params: Promise.resolve({ token }) });
}

describe('POST /api/portal/[token]/cancelar — contrato (T022, US2)', () => {
  it('200: cancela una cita reservada dentro de plazo y libera el hueco (SC-003)', async () => {
    const creada = await citaCancelable();
    const respuesta = await llamarPost(tokenDeDesarrollo(escenario.pacientes.ana), {
      citaId: creada.id,
    });

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ citaId: creada.id, estado: 'cancelada' });

    // El estado quedó "cancelada" (libera el hueco, transición de 001).
    const [fila] = await db
      .select({ estado: cita.estado })
      .from(cita)
      .where(and(eq(cita.id, creada.id), eq(cita.clinicaId, escenario.clinicaId)))
      .limit(1);
    expect(fila.estado).toBe('cancelada');
  });

  it('404 ACCESO_DENEGADO: token inválido', async () => {
    const creada = await citaCancelable();
    const respuesta = await llamarPost('token-malo', { citaId: creada.id });
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('404 CITA_NO_EXISTE: la cita es de otro paciente', async () => {
    const ajena = await citaCancelable(escenario.pacientes.bruno);
    const respuesta = await llamarPost(tokenDeDesarrollo(escenario.pacientes.ana), {
      citaId: ajena.id,
    });
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error.codigo).toBe('CITA_NO_EXISTE');
  });

  it('409 FUERA_DE_PLAZO: cita a menos de 24 h', async () => {
    // Inserción directa: dentro de la ventana (2 h), estado reservada. Alineada a 5 min.
    const ms5 = 5 * 60 * 1000;
    const inicio = new Date(Math.floor((Date.now() + 2 * 3600_000) / ms5) * ms5);
    const [fila] = await db
      .insert(cita)
      .values({
        clinicaId: escenario.clinicaId,
        profesionalId: escenario.profesionales.maria,
        servicioId: escenario.servicios.sesionFisio,
        pacienteId: escenario.pacientes.ana,
        inicio,
        fin: calcularFin(inicio, 45),
        estado: 'reservada',
      })
      .returning({ id: cita.id });

    const respuesta = await llamarPost(tokenDeDesarrollo(escenario.pacientes.ana), {
      citaId: fila.id,
    });
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).error.codigo).toBe('FUERA_DE_PLAZO');
  });

  it('400 DATOS_INCOMPLETOS: citaId ausente o inválido', async () => {
    const sinCita = await llamarPost(tokenDeDesarrollo(escenario.pacientes.ana), {});
    expect(sinCita.status).toBe(400);
    expect((await sinCita.json()).error.codigo).toBe('DATOS_INCOMPLETOS');

    const malFormado = await llamarPost(tokenDeDesarrollo(escenario.pacientes.ana), {
      citaId: 'no-es-uuid',
    });
    expect(malFormado.status).toBe(400);
  });
});
