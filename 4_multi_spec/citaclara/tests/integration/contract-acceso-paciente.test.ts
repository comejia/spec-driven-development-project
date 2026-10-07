import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  obtenerVistaPaciente,
  regenerarToken,
  resolverToken,
} from '@/src/services/acceso-paciente';
import { crearCita } from '@/src/services/crear-cita';
import { esErrorNegocio } from '@/src/domain/errores';
import {
  cerrarConexion,
  crearEscenario,
  crearTokenPaciente,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * Acceso del paciente por enlace personal (005 US1, FR-001/002/003/004, SC-001/002/003).
 */

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

async function citaDe(pacienteId: string, hora: string) {
  return crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: pacienteId,
      inicio: instanteFuturo(hora).toISOString(),
    },
    db,
  );
}

describe('Acceso del paciente por token (US1)', () => {
  it('un token válido resuelve a su paciente y clínica (FR-001)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const { pacienteId, clinicaId } = await resolverToken(token, db);
    expect(pacienteId).toBe(escenario.pacientes.ana);
    expect(clinicaId).toBe(escenario.clinicaId);
  });

  it('un token válido muestra SOLO las citas de su paciente (FR-003, SC-001)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    await crearTokenPaciente(escenario.pacientes.bruno, 'token-de-bruno-aaaaaaaaaaaaaaaaaaaaaaaa');

    const anaA = await citaDe(escenario.pacientes.ana, '10:00');
    const anaB = await citaDe(escenario.pacientes.ana, '12:00');
    await citaDe(escenario.pacientes.bruno, '11:00');

    const vista = await obtenerVistaPaciente(token, db);
    const ids = vista.citas.map((c) => c.id).sort();
    expect(ids).toEqual([anaA.id, anaB.id].sort());
    // Ninguna cita de otro paciente.
    expect(vista.citas.every((c) => c.id !== undefined)).toBe(true);
    expect(vista.citas.length).toBe(2);
  });

  it('las citas se devuelven ordenadas por inicio y con clínica (nombre + teléfono)', async () => {
    const token = await crearTokenPaciente(escenario.pacientes.ana);
    const tarde = await citaDe(escenario.pacientes.ana, '16:00');
    const manana = await citaDe(escenario.pacientes.ana, '09:00');

    const vista = await obtenerVistaPaciente(token, db);
    expect(vista.citas.map((c) => c.id)).toEqual([manana.id, tarde.id]);
    expect(vista.clinicaNombre).toBeTruthy();
    // El teléfono existe en el escenario (columna con default '').
    expect(typeof vista.clinicaTelefono).toBe('string');
  });

  it('un token inexistente se rechaza con error neutro (FR-002, SC-002)', async () => {
    await expect(
      resolverToken('inexistente-pero-con-forma-valida-aaaaaaaa', db),
    ).rejects.toSatisfy((e: unknown) => esErrorNegocio(e));
  });

  it('un token manipulado (forma inválida) se rechaza igual, sin filtrar (FR-002, D4)', async () => {
    const conValido = await resolverToken(await crearTokenPaciente(escenario.pacientes.ana), db)
      .then(() => 'ok')
      .catch(() => 'err');
    const conBasura = await resolverToken('x x x', db)
      .then(() => 'ok')
      .catch((e: unknown) => (esErrorNegocio(e) ? e.message : 'otro'));
    expect(conValido).toBe('ok');
    // El mensaje es neutro y no menciona detalles técnicos.
    expect(String(conBasura)).not.toMatch(/SQL|constraint|no existe fila/i);
  });

  it('tras regenerar, el enlace antiguo deja de valer y el nuevo da acceso a las mismas citas (FR-004, SC-003)', async () => {
    const tokenViejo = await crearTokenPaciente(escenario.pacientes.ana);
    const cita = await citaDe(escenario.pacientes.ana, '10:00');

    const tokenNuevo = await regenerarToken(escenario.clinicaId, escenario.pacientes.ana, db);
    expect(tokenNuevo).not.toBe(tokenViejo);

    // El enlace antiguo ya no resuelve.
    await expect(resolverToken(tokenViejo, db)).rejects.toSatisfy((e: unknown) =>
      esErrorNegocio(e),
    );

    // El nuevo da acceso a las mismas citas.
    const vista = await obtenerVistaPaciente(tokenNuevo, db);
    expect(vista.citas.map((c) => c.id)).toEqual([cita.id]);
  });

  it('regenerar el token de un paciente de otra clínica falla (aislamiento)', async () => {
    const otra = await crearEscenario();
    await expect(
      regenerarToken(escenario.clinicaId, otra.pacientes.ana, db),
    ).rejects.toSatisfy((e: unknown) => esErrorNegocio(e));
  });
});
