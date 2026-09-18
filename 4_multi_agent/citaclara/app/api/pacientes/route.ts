import { leerJson, manejarError, respuestaOk } from '@/app/api/_lib/respuestas';
import { buscarPacientes, crearPaciente } from '@/src/services/pacientes';
import { exigirClinicaDeSesion } from '@/src/services/session';
import { crearPacienteSchema } from '@/src/validation';

/** Contratos de `specs/001-agenda-core/contracts/pacientes.md` (FR-004, FR-004a). */

export async function POST(peticion: Request): Promise<Response> {
  try {
    const clinicaId = exigirClinicaDeSesion(peticion);
    const entrada = crearPacienteSchema.parse(await leerJson(peticion));
    const ficha = await crearPaciente(clinicaId, entrada);
    return respuestaOk(ficha, 201);
  } catch (error) {
    return manejarError(error);
  }
}

export async function GET(peticion: Request): Promise<Response> {
  try {
    const clinicaId = exigirClinicaDeSesion(peticion);
    const buscar = new URL(peticion.url).searchParams.get('buscar') ?? undefined;
    return respuestaOk(await buscarPacientes(clinicaId, buscar));
  } catch (error) {
    return manejarError(error);
  }
}
