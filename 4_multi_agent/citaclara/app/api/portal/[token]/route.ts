import { respuestaError, respuestaOk, manejarError } from '@/app/api/_lib/respuestas';
import { accesoPortal } from '@/src/portal/acceso-real';
import { consultarCitasPaciente } from '@/src/portal/consultar-citas-paciente';

/**
 * Vista del portal — GET /api/portal/[token] (contracts/portal-vista.md).
 *
 * T012 [US3]: resuelve la identidad del paciente vía `PortalAccessGateway` (005). Si el
 * acceso se deniega, responde `404 ACCESO_DENEGADO` (mensaje neutro) sin registrar el token.
 * T017 [US1]: si el acceso es válido, devuelve `{ paciente, proximas, historial }`.
 */

export const dynamic = 'force-dynamic';

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const acceso = await accesoPortal.resolverPaciente(token ?? '');
    if (!acceso.ok) {
      // Mensaje neutro; el token nunca se refleja en la respuesta ni en logs (D3).
      return respuestaError('ACCESO_DENEGADO');
    }

    const vista = await consultarCitasPaciente(acceso.clinicaId, acceso.pacienteId);
    return respuestaOk(vista);
  } catch (error) {
    return manejarError(error);
  }
}
