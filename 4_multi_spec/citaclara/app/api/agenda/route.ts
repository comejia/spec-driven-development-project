import { manejarError, respuestaError, respuestaOk } from '@/app/api/_lib/respuestas';
import { consultarAgenda } from '@/src/services/consultar-agenda';
import { exigirClinicaDeSesion } from '@/src/services/session';

/** Contrato de `specs/001-agenda-core/contracts/agenda.md` → GET /api/agenda. */

export async function GET(peticion: Request): Promise<Response> {
  try {
    const clinicaId = exigirClinicaDeSesion(peticion);
    const parametros = new URL(peticion.url).searchParams;
    const profesionalId = parametros.get('profesional_id');
    const fecha = parametros.get('fecha');

    // Ausencia de parámetros: datos incompletos (400). Formato incorrecto: 422.
    if (!profesionalId || !fecha) return respuestaError('DATOS_INCOMPLETOS');

    const agenda = await consultarAgenda(clinicaId, {
      profesional_id: profesionalId,
      fecha,
    });
    return respuestaOk(agenda);
  } catch (error) {
    return manejarError(error);
  }
}
