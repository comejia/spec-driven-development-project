import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { cita as citaTabla } from '@/src/db/schema';
import { cancelarDesdeRecordatorio } from '@/src/services/cancelar-desde-recordatorio';
import { crearCita } from '@/src/services/crear-cita';
import { generarRecordatorios } from '@/src/services/generar-recordatorios';
import type { ConfigCorreo } from '@/src/validation/recordatorios';
import type { EmisorCorreo, MensajeCorreo, ResultadoEmision } from '@/src/services/correo/emisor';
import {
  cerrarConexion,
  crearEscenario,
  crearPacienteCon,
  db,
  instanteFuturo,
  limpiarBase,
  type EscenarioClinica,
} from './setup/ayudas';

/**
 * T028 (US3): consumo de la cancelación (V8/FR-010/FR-010a). 002 delega en el servicio de
 * 001 (`cambiar-estado`), NO reimplementa la transición. Ante concurrencia, 001 garantiza
 * una sola cancelación efectiva. La política de 24 h / teléfono es de 005 (cuerpo del email,
 * cubierto por los tests de correo); aquí se prueba el consumo de 001.
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

class EmisorNulo implements EmisorCorreo {
  emitir(_m: MensajeCorreo): Promise<ResultadoEmision> {
    return Promise.resolve({});
  }
}

let escenario: EscenarioClinica;

beforeEach(async () => {
  await limpiarBase();
  escenario = await crearEscenario();
});

afterAll(async () => {
  await cerrarConexion();
});

async function citaReservadaConRecordatorio(): Promise<string> {
  const pacienteId = await crearPacienteCon(escenario.clinicaId, {
    nombre: 'Diana Cancela',
    telefono: '600900900',
    email: 'diana@ejemplo.es',
  });
  // Cita futura real (a 40 días); referencia situada 36h antes → elegible para recordatorio.
  const inicio = instanteFuturo('10:00', 40);
  const creada = await crearCita(
    escenario.clinicaId,
    {
      profesional_id: escenario.profesionales.maria,
      servicio_id: escenario.servicios.sesionFisio,
      paciente_id: pacienteId,
      inicio: inicio.toISOString(),
    },
    db,
  );
  const referencia = new Date(inicio.getTime() - 36 * 60 * 60 * 1000);
  await generarRecordatorios({ referencia, db, emisor: new EmisorNulo(), config: CONFIG });
  return creada.id;
}

describe('consumo de cancelación desde el recordatorio (V8/FR-010)', () => {
  it('cancela vía servicio de 001 y la cita queda cancelada (hueco liberado)', async () => {
    const citaId = await citaReservadaConRecordatorio();

    const resultado = await cancelarDesdeRecordatorio(escenario.clinicaId, citaId, db);
    expect(resultado.estado).toBe('cancelada');

    const [fila] = await db
      .select({ estado: citaTabla.estado })
      .from(citaTabla)
      .where(eq(citaTabla.id, citaId));
    expect(fila.estado).toBe('cancelada');
  });

  it('una cita ya no reservada no vuelve a cancelarse (una sola cancelación efectiva, FR-010a)', async () => {
    const citaId = await citaReservadaConRecordatorio();
    await cancelarDesdeRecordatorio(escenario.clinicaId, citaId, db);

    // Segundo intento (otro canal): 001 rechaza con TRANSICION_INVALIDA.
    await expect(cancelarDesdeRecordatorio(escenario.clinicaId, citaId, db)).rejects.toMatchObject({
      codigo: 'TRANSICION_INVALIDA',
    });
  });

  it('concurrencia: dos cancelaciones simultáneas producen una sola efectiva', async () => {
    const citaId = await citaReservadaConRecordatorio();

    const resultados = await Promise.allSettled([
      cancelarDesdeRecordatorio(escenario.clinicaId, citaId, db),
      cancelarDesdeRecordatorio(escenario.clinicaId, citaId, db),
    ]);

    const exitosas = resultados.filter((r) => r.status === 'fulfilled');
    expect(exitosas).toHaveLength(1);

    const [fila] = await db
      .select({ estado: citaTabla.estado })
      .from(citaTabla)
      .where(eq(citaTabla.id, citaId));
    expect(fila.estado).toBe('cancelada');
  });
});
