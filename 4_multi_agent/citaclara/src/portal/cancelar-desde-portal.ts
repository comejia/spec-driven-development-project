import { and, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { cita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { cambiarEstado } from '@/src/services/cambiar-estado';
import { accesoPortal } from './acceso-desarrollo';
import { politicaPortal } from './politica-desarrollo';
import type { PoliticaCancelacion, PortalAccessGateway } from './puertos';

/**
 * T024 [US2] — Orquestación de la cancelación desde el portal (contracts/portal-cancelacion.md;
 * FR-009..FR-015, RD-3).
 *
 * Flujo: (1) resolver acceso (005) → si deniega, ACCESO_DENEGADO; (2) cargar la cita y
 * comprobar pertenencia al paciente → si no, CITA_NO_EXISTE; (3) evaluar la política (005)
 * → si no cancelable por ventana, FUERA_DE_PLAZO con teléfono; (4) invocar
 * `cambiarEstado(..., 'cancelada')` de 001 (transición atómica e idempotente). 003 NO
 * reimplementa la transición ni el control de concurrencia.
 */

export interface ResultadoCancelacion {
  citaId: string;
  estado: 'cancelada';
}

export interface DependenciasCancelacion {
  db?: BaseDatos;
  acceso?: PortalAccessGateway;
  politica?: PoliticaCancelacion;
  ahora?: Date;
}

export async function cancelarDesdePortal(
  token: string,
  citaId: string,
  deps: DependenciasCancelacion = {},
): Promise<ResultadoCancelacion> {
  const db = deps.db ?? obtenerDb();
  const acceso = deps.acceso ?? accesoPortal;
  const politica = deps.politica ?? politicaPortal;
  const ahora = deps.ahora ?? new Date();

  // 1. Acceso (005).
  const identidad = await acceso.resolverPaciente(token ?? '');
  if (!identidad.ok) throw new ErrorNegocio('ACCESO_DENEGADO');

  // 2. Cargar la cita y comprobar pertenencia al paciente (si no, se trata como no
  //    encontrada para no revelar citas ajenas).
  const [filaCita] = await db
    .select({ estado: cita.estado, inicio: cita.inicio })
    .from(cita)
    .where(
      and(
        eq(cita.id, citaId),
        eq(cita.clinicaId, identidad.clinicaId),
        eq(cita.pacienteId, identidad.pacienteId),
      ),
    )
    .limit(1);

  if (!filaCita) throw new ErrorNegocio('CITA_NO_EXISTE');

  // 3. Política de cancelación (005): ventana de 24 h.
  const evaluacion = politica.evaluar({ estado: filaCita.estado, inicio: filaCita.inicio }, ahora);
  if (!evaluacion.cancelable) {
    if (evaluacion.motivo === 'ESTADO_NO_RESERVADA') {
      // Estado final: lo resuelve la transición de 001 con TRANSICION_INVALIDA.
      throw new ErrorNegocio('TRANSICION_INVALIDA');
    }
    // Fuera de la ventana o ya pasada: se remite a la clínica (005 FR-008).
    throw new ErrorNegocio('FUERA_DE_PLAZO');
  }

  // 4. Transición de 001 (atómica e idempotente). Si otra vía ya la cambió, 001 devuelve
  //    TRANSICION_INVALIDA (una sola cancelación efectiva).
  const actualizada = await cambiarEstado(identidad.clinicaId, citaId, 'cancelada', db);

  return { citaId: actualizada.id, estado: 'cancelada' };
}
