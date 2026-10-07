import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { recordatorio } from '@/src/db/schema';
import { reiniciarYSembrar } from '@/src/seed/seed';
import { generarRecordatorios } from '@/src/services/generar-recordatorios';
import { instanteEnMadrid } from '@/src/domain/tiempo';
import type { ConfigCorreo } from '@/src/validation/recordatorios';
import type { EmisorCorreo, MensajeCorreo, ResultadoEmision } from '@/src/services/correo/emisor';
import { cerrarConexion, db, limpiarBase } from './setup/ayudas';

/**
 * T031 (Polish): reproducibilidad (V9/FR-015/SC-006, Principio 5). Misma semilla + misma
 * fecha de referencia → el mismo conjunto de recordatorios en cada ejecución.
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

// Día de referencia fijo para la semilla (determinista). La semilla crea 2 semanas de
// reservas futuras de L-V; a 36h del día siguiente hay citas reservadas en ventana.
const HOY = '2026-10-05'; // lunes
const SEMILLA = 'citaclara-eleva-2026';
// Referencia: 36h antes de las 09:00 del miércoles → ventana [+24h,+48h) cubre el jueves.
const REFERENCIA = instanteEnMadrid('2026-10-06', '09:00');

async function conjuntoRecordatorios(): Promise<string[]> {
  // La reproducibilidad de la semilla es sobre la HISTORIA (pacientes, fechas, estados), no
  // sobre los UUID de cita (`defaultRandom`). Se compara por atributos estables: el email de
  // destino (identifica al paciente de forma reproducible) y el resultado.
  const filas = await db
    .select({ destinoEmail: recordatorio.destinoEmail, resultado: recordatorio.resultado })
    .from(recordatorio);
  return filas
    .map((f) => `${f.destinoEmail ?? 'sin-email'}:${f.resultado}`)
    .sort((a, b) => a.localeCompare(b));
}

beforeEach(async () => {
  await limpiarBase();
});

afterAll(async () => {
  await cerrarConexion();
});

describe('reproducibilidad sobre la semilla (V9/FR-015/SC-006)', () => {
  it('misma semilla + misma fecha → mismo conjunto de recordatorios', async () => {
    // Ejecución 1
    await reiniciarYSembrar({ semilla: SEMILLA, hoy: HOY, db });
    const r1 = await generarRecordatorios({
      referencia: REFERENCIA,
      db,
      emisor: new EmisorNulo(),
      config: CONFIG,
    });
    const conjunto1 = await conjuntoRecordatorios();

    // Ejecución 2 (reset + re-seed idéntico)
    await reiniciarYSembrar({ semilla: SEMILLA, hoy: HOY, db });
    const r2 = await generarRecordatorios({
      referencia: REFERENCIA,
      db,
      emisor: new EmisorNulo(),
      config: CONFIG,
    });
    const conjunto2 = await conjuntoRecordatorios();

    expect(r1.elegibles).toBe(r2.elegibles);
    expect(r1.generados).toBe(r2.generados);
    expect(conjunto2).toEqual(conjunto1);
    // La semilla debe producir al menos una cita elegible en la ventana elegida.
    expect(conjunto1.length).toBeGreaterThan(0);
  });
});
