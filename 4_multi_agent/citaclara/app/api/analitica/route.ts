import { manejarError, respuestaError, respuestaOk } from '@/app/api/_lib/respuestas';
import { obtenerAnalitica } from '@/src/services/analitica';
import { exigirClinicaDeSesion } from '@/src/services/session';

/**
 * Contrato de `specs/004-panel-analitica/contracts/analitica.md` → GET /api/analitica.
 *
 * SOLO LECTURA (FR-002): este endpoint no escribe nada. Requiere sesión de clínica válida
 * (FR-001, SC-002); sin sesión responde 401 y ningún dato.
 */

export async function GET(peticion: Request): Promise<Response> {
  try {
    const clinicaId = exigirClinicaDeSesion(peticion);
    const parametros = new URL(peticion.url).searchParams;
    const diaReferencia = parametros.get('dia_referencia');

    // Formato incorrecto de fecha → 422 (FECHA_INVALIDA); ausencia es válida (usa hoy).
    if (diaReferencia !== null && !/^\d{4}-\d{2}-\d{2}$/.test(diaReferencia)) {
      return respuestaError('FECHA_INVALIDA');
    }

    const analitica = await obtenerAnalitica(
      clinicaId,
      diaReferencia ? { dia_referencia: diaReferencia } : {},
    );
    return respuestaOk(analitica);
  } catch (error) {
    return manejarError(error);
  }
}
