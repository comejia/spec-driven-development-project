import { and, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { cita, type EstadoCita } from '@/src/db/schema';
import { ESTADO_INICIAL, exigirTransicionValida } from '@/src/domain/cita';
import { ErrorNegocio } from '@/src/domain/errores';
import { estadoDestinoSchema, type EstadoDestino } from '@/src/validation';

/**
 * US3 — Marcar el estado de la cita (FR-008, FR-009, FR-017).
 *
 * La actualización se hace condicionada al estado de origen (`estado = 'reservada'`) en
 * la propia sentencia, de modo que dos peticiones simultáneas no puedan aplicar dos
 * transiciones sobre la misma cita: la segunda no encuentra fila y recibe
 * TRANSICION_INVALIDA.
 */

export interface CitaActualizada {
  id: string;
  estado: EstadoCita;
}

export async function cambiarEstado(
  clinicaId: string,
  citaId: string,
  destinoSinValidar: EstadoDestino,
  db: BaseDatos = obtenerDb(),
): Promise<CitaActualizada> {
  const destino = estadoDestinoSchema.parse(destinoSinValidar);

  const [actualizada] = await db
    .update(cita)
    .set({ estado: destino })
    .where(
      and(eq(cita.id, citaId), eq(cita.clinicaId, clinicaId), eq(cita.estado, ESTADO_INICIAL)),
    )
    .returning({ id: cita.id, estado: cita.estado });

  if (actualizada) return actualizada;

  // No se actualizó nada: o la cita no es de esta clínica, o ya estaba en un estado final.
  const [existente] = await db
    .select({ estado: cita.estado })
    .from(cita)
    .where(and(eq(cita.id, citaId), eq(cita.clinicaId, clinicaId)))
    .limit(1);

  if (!existente) throw new ErrorNegocio('CITA_NO_EXISTE');

  // Lanza TRANSICION_INVALIDA con el mensaje del catálogo (FR-008).
  exigirTransicionValida(existente.estado, destino);

  // Inalcanzable salvo carrera resuelta entre las dos consultas.
  throw new ErrorNegocio('TRANSICION_INVALIDA');
}
