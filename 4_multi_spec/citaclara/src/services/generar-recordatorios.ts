import { and, eq, gte, lt } from 'drizzle-orm';
import { z } from 'zod';
import { obtenerDb, type BaseDatos } from '@/src/db';
import {
  cita,
  clinica,
  paciente,
  profesional,
  recordatorio,
  servicio,
  type ResultadoRecordatorio,
} from '@/src/db/schema';
import { calcularVentana, ESTADO_ELEGIBLE } from '@/src/domain/recordatorio';
import { componerRecordatorio } from '@/src/domain/correo';
import type { EmisorCorreo } from '@/src/services/correo/emisor';
import { EmisorCorreoEml } from '@/src/services/correo/emisor-eml';
import type { ProveedorEnlaceAcceso } from '@/src/services/correo/proveedor-enlace';
import { ProveedorEnlaceStub } from '@/src/services/correo/proveedor-enlace-stub';
import { obtenerConfigCorreo } from '@/src/services/correo/config-clinica';
import type { ConfigCorreo } from '@/src/validation/recordatorios';

/**
 * Proceso diario de recordatorios (002, US1+US2), contracts/proceso-diario.md.
 *
 * 1. Calcula la ventana [ref+24h, ref+48h) (FR-012) y selecciona citas `reservada` (FR-002).
 * 2. Inserta el recordatorio de forma IDEMPOTENTE (`ON CONFLICT (cita_id) DO NOTHING`, D2):
 *    la no duplicación (FR-003) la garantiza el índice único, robusto ante reejecución y
 *    concurrencia.
 * 3. Si crea fila y el paciente tiene email válido → compone y escribe el `.eml`
 *    (`resultado = simulado`, FR-013). Sin email válido → `resultado = omitido`, sin `.eml`
 *    (FR-014), y el proceso continúa (robustez).
 *
 * 002 NO cancela ni transiciona citas: eso es propiedad de 001 (FR-010). Aquí solo se avisa.
 *
 * FR-011 ⟶ FR-017a de 001: una cita movida es una cita nueva (otro `cita_id`) y, por tanto,
 * elegible por sí misma para su propio y único recordatorio (ver src/domain/recordatorio.ts y
 * src/services/cancelar-desde-recordatorio.ts). Si 001 cambiara "mover", 002 debe revisarse.
 */

/** Reutiliza el criterio de email de 001 (research D5): validación por formato. */
const emailSchema = z.string().trim().email();

function emailValido(email: string | null): email is string {
  return email !== null && emailSchema.safeParse(email).success;
}

export interface OpcionesProceso {
  /** Instante de referencia; por defecto, ahora (reproducibilidad al fijarlo, FR-015). */
  referencia?: Date;
  /** Limita a una clínica concreta (opcional). */
  clinicaId?: string;
  db?: BaseDatos;
  emisor?: EmisorCorreo;
  proveedorEnlace?: ProveedorEnlaceAcceso;
  /** Config de correo; si falta, se resuelve del entorno (lanza CONFIG_CORREO_INCOMPLETA). */
  config?: ConfigCorreo;
}

export interface ResumenProceso {
  elegibles: number;
  generados: number; // resultado 'simulado' o 'enviado'
  omitidos: number; // paciente sin email válido
  yaRecordados: number; // ya existía recordatorio (idempotencia)
}

interface FilaElegible {
  citaId: string;
  inicio: Date;
  pacienteId: string;
  pacienteNombre: string;
  pacienteEmail: string | null;
  profesionalNombre: string;
  servicioNombre: string;
  clinicaNombre: string;
}

export async function generarRecordatorios(
  opciones: OpcionesProceso = {},
): Promise<ResumenProceso> {
  const db = opciones.db ?? obtenerDb();
  const referencia = opciones.referencia ?? new Date();
  const config = opciones.config ?? obtenerConfigCorreo();
  const emisor = opciones.emisor ?? new EmisorCorreoEml();
  const proveedorEnlace = opciones.proveedorEnlace ?? new ProveedorEnlaceStub(config.urlBaseAcceso);

  const ventana = calcularVentana(referencia);

  const condiciones = [
    eq(cita.estado, ESTADO_ELEGIBLE),
    gte(cita.inicio, ventana.desde),
    lt(cita.inicio, ventana.hasta),
  ];
  if (opciones.clinicaId) condiciones.push(eq(cita.clinicaId, opciones.clinicaId));

  const elegibles: FilaElegible[] = await db
    .select({
      citaId: cita.id,
      inicio: cita.inicio,
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      pacienteEmail: paciente.email,
      profesionalNombre: profesional.nombre,
      servicioNombre: servicio.nombre,
      clinicaNombre: clinica.nombre,
    })
    .from(cita)
    .innerJoin(paciente, eq(paciente.id, cita.pacienteId))
    .innerJoin(profesional, eq(profesional.id, cita.profesionalId))
    .innerJoin(servicio, eq(servicio.id, cita.servicioId))
    .innerJoin(clinica, eq(clinica.id, cita.clinicaId))
    .where(and(...condiciones))
    // Orden determinista para reproducibilidad (FR-015, SC-006).
    .orderBy(cita.inicio, cita.id);

  const resumen: ResumenProceso = { elegibles: elegibles.length, generados: 0, omitidos: 0, yaRecordados: 0 };

  for (const fila of elegibles) {
    const tieneEmail = emailValido(fila.pacienteEmail);
    const resultado: ResultadoRecordatorio = tieneEmail ? 'simulado' : 'omitido';

    // Inserción idempotente: solo procede la escritura del .eml si se crea fila nueva (D2).
    const insertadas = await db
      .insert(recordatorio)
      .values({
        citaId: fila.citaId,
        resultado,
        destinoEmail: tieneEmail ? fila.pacienteEmail : null,
      })
      .onConflictDoNothing({ target: recordatorio.citaId })
      .returning({ id: recordatorio.id });

    if (insertadas.length === 0) {
      resumen.yaRecordados += 1;
      continue;
    }

    if (!tieneEmail) {
      resumen.omitidos += 1;
      continue;
    }

    const enlaceAcceso = await proveedorEnlace.enlaceDeAcceso(fila.pacienteId);
    const compuesto = componerRecordatorio(
      {
        pacienteNombre: fila.pacienteNombre,
        profesionalNombre: fila.profesionalNombre,
        servicioNombre: fila.servicioNombre,
        clinicaNombre: fila.clinicaNombre,
        inicioCita: fila.inicio,
        enlaceAcceso,
      },
      config,
    );

    await emisor.emitir({
      remitenteNombre: config.remitenteNombre,
      remitenteEmail: config.remitenteEmail,
      destinoEmail: fila.pacienteEmail as string,
      asunto: compuesto.asunto,
      cuerpo: compuesto.cuerpo,
      generadoEn: referencia,
      inicioCita: fila.inicio,
      citaId: fila.citaId,
    });
    resumen.generados += 1;
  }

  return resumen;
}
