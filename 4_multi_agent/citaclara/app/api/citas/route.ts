import { leerJson, manejarError, respuestaOk } from '@/app/api/_lib/respuestas';
import { crearCita } from '@/src/services/crear-cita';
import { exigirClinicaDeSesion } from '@/src/services/session';
import { crearCitaSchema } from '@/src/validation';

/** Contrato de `specs/001-agenda-core/contracts/citas.md` → POST /api/citas. */

export async function POST(peticion: Request): Promise<Response> {
  try {
    const clinicaId = exigirClinicaDeSesion(peticion);
    // El `fin` que llegue en el cuerpo se descarta: lo deriva el servidor (FR-006).
    const entrada = crearCitaSchema.parse(await leerJson(peticion));
    const creada = await crearCita(clinicaId, entrada);

    return respuestaOk(
      {
        id: creada.id,
        inicio: creada.inicio.toISOString(),
        fin: creada.fin.toISOString(),
        estado: creada.estado,
      },
      201,
    );
  } catch (error) {
    return manejarError(error);
  }
}
