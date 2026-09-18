import { leerJson, manejarError, respuestaError, respuestaOk } from '@/app/api/_lib/respuestas';
import { cambiarEstado } from '@/src/services/cambiar-estado';
import { exigirClinicaDeSesion } from '@/src/services/session';
import { cambiarEstadoSchema, uuidSchema } from '@/src/validation';

/** Contrato de `contracts/citas.md` → POST /api/citas/{id}/estado (FR-008/017). */

export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const clinicaId = exigirClinicaDeSesion(peticion);
    const { id } = await params;

    const idValidado = uuidSchema.safeParse(id);
    if (!idValidado.success) return respuestaError('CITA_NO_EXISTE');

    const { estado } = cambiarEstadoSchema.parse(await leerJson(peticion));
    const actualizada = await cambiarEstado(clinicaId, idValidado.data, estado);

    return respuestaOk(actualizada);
  } catch (error) {
    return manejarError(error);
  }
}
