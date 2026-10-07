import { and, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { cita, clinica, paciente, profesional, servicio, type EstadoCita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { ETIQUETAS_ESTADO } from '@/src/domain/cita';
import { formatearFechaHora } from '@/src/domain/tiempo';
import { PoliticaReal } from './politica-real';
import type { PoliticaCancelacion } from './puertos';

/**
 * T016 [US1] — Servicio de solo lectura del portal (data-model.md; FR-005..FR-008, RD-1/RD-2).
 *
 * Lee las citas del paciente (`cita ⋈ servicio ⋈ profesional`), separa futuras/historial en
 * `Europe/Madrid`, ordena (próximas ascendente, historial descendente) y marca cada cita
 * como `cancelable` según la política de 005 (consumida vía puerto). No fija reglas de 005
 * ni de 001: las remite.
 */

export interface CitaDelPortal {
  id: string;
  inicioIso: string;
  fechaHoraTexto: string;
  profesional: string;
  servicio: string;
  estado: string;
  cancelable: boolean;
  /** Presente cuando `cancelable=false` por ventana temporal (para "llame a la clínica"). */
  telefonoClinica?: string;
}

export interface VistaPortal {
  paciente: { nombre: string };
  proximas: CitaDelPortal[];
  historial: CitaDelPortal[];
}

interface FilaCita {
  id: string;
  inicio: Date;
  estado: EstadoCita;
  profesional: string;
  servicio: string;
}

export async function consultarCitasPaciente(
  clinicaId: string,
  pacienteId: string,
  ahora: Date = new Date(),
  db: BaseDatos = obtenerDb(),
  politica?: PoliticaCancelacion,
): Promise<VistaPortal> {
  const [fichaPaciente] = await db
    .select({ nombre: paciente.nombre })
    .from(paciente)
    .where(and(eq(paciente.id, pacienteId), eq(paciente.clinicaId, clinicaId)))
    .limit(1);

  if (!fichaPaciente) throw new ErrorNegocio('PACIENTE_NO_EXISTE');

  // Política de cancelación: por defecto la REAL de 005, con el teléfono real de la clínica
  // (para el mensaje "llame a la clínica" dentro de ventana, FR-008). Los tests pueden
  // inyectar otra implementación del puerto.
  const politicaEfectiva = politica ?? (await construirPoliticaReal(clinicaId, db));

  const filas: FilaCita[] = await db
    .select({
      id: cita.id,
      inicio: cita.inicio,
      estado: cita.estado,
      profesional: profesional.nombre,
      servicio: servicio.nombre,
    })
    .from(cita)
    .innerJoin(profesional, eq(profesional.id, cita.profesionalId))
    .innerJoin(servicio, eq(servicio.id, cita.servicioId))
    .where(and(eq(cita.clinicaId, clinicaId), eq(cita.pacienteId, pacienteId)));

  const proximas: CitaDelPortal[] = [];
  const historial: CitaDelPortal[] = [];

  for (const fila of filas) {
    const evaluacion = politicaEfectiva.evaluar({ estado: fila.estado, inicio: fila.inicio }, ahora);
    const vista: CitaDelPortal = {
      id: fila.id,
      inicioIso: fila.inicio.toISOString(),
      fechaHoraTexto: formatearFechaHora(fila.inicio),
      profesional: fila.profesional,
      servicio: fila.servicio,
      estado: ETIQUETAS_ESTADO[fila.estado],
      cancelable: evaluacion.cancelable,
      ...(evaluacion.telefonoClinica ? { telefonoClinica: evaluacion.telefonoClinica } : {}),
    };

    // RD-1: futura/pasada por la hora de inicio en la zona de negocio.
    if (fila.inicio.getTime() >= ahora.getTime()) {
      proximas.push(vista);
    } else {
      historial.push(vista);
    }
  }

  // FR-007: próximas de la más próxima a la más lejana; historial de la más reciente a la
  // más antigua.
  proximas.sort((a, b) => a.inicioIso.localeCompare(b.inicioIso));
  historial.sort((a, b) => b.inicioIso.localeCompare(a.inicioIso));

  return { paciente: { nombre: fichaPaciente.nombre }, proximas, historial };
}

/**
 * Construye la política REAL de 005 inyectándole el teléfono de la clínica indicada, para
 * que el mensaje "llame a la clínica" dentro de ventana muestre el número correcto (FR-008).
 */
async function construirPoliticaReal(
  clinicaId: string,
  db: BaseDatos,
): Promise<PoliticaCancelacion> {
  const [ficha] = await db
    .select({ telefono: clinica.telefono })
    .from(clinica)
    .where(eq(clinica.id, clinicaId))
    .limit(1);

  return new PoliticaReal({ telefonoClinica: ficha?.telefono ?? '' });
}
