import { and, asc, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { accesoPaciente, cita, clinica, paciente, profesional, servicio } from '@/src/db/schema';
import type { EstadoCita } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { generarToken, pareceToken } from '@/src/domain/token';
import { tokenSchema } from '@/src/validation';

/**
 * Acceso del paciente por enlace personal (005, US1, FR-001..FR-006).
 *
 * La autorización es la POSESIÓN del token opaco (research D7): no hay sesión de clínica.
 * Se resuelve token → paciente y todo se restringe al ámbito de ese paciente. Un token
 * inexistente o manipulado produce siempre el MISMO error neutro (FR-002, D4): nunca se
 * revela la existencia ni los datos de ningún paciente.
 */

/** Error neutro de acceso: no distingue "no existe" de "manipulado" (FR-002, D4). */
export function accesoDenegado(): ErrorNegocio {
  return new ErrorNegocio('PACIENTE_NO_EXISTE', 'El enlace no es válido o ha caducado.');
}

export interface PacienteDelToken {
  pacienteId: string;
  clinicaId: string;
}

/**
 * Resuelve un token a su paciente y clínica. Lanza el error neutro si el token no existe.
 * NO revela información: cualquier fallo (formato, inexistente, manipulado) es idéntico.
 */
export async function resolverToken(
  tokenSinValidar: string,
  db: BaseDatos = obtenerDb(),
): Promise<PacienteDelToken> {
  const token = tokenSchema.parse(tokenSinValidar);
  // Descarta entradas obviamente inválidas sin distinguir el motivo (denegación neutra).
  if (!pareceToken(token)) throw accesoDenegado();

  const [fila] = await db
    .select({ pacienteId: accesoPaciente.pacienteId, clinicaId: paciente.clinicaId })
    .from(accesoPaciente)
    .innerJoin(paciente, eq(paciente.id, accesoPaciente.pacienteId))
    .where(eq(accesoPaciente.token, token))
    .limit(1);

  if (!fila) throw accesoDenegado();
  return fila;
}

export interface CitaDePaciente {
  id: string;
  inicio: Date;
  estado: EstadoCita;
  profesional: string;
  servicio: string;
}

export interface VistaPaciente {
  pacienteId: string;
  clinicaId: string;
  clinicaNombre: string;
  clinicaTelefono: string;
  citas: CitaDePaciente[];
}

/**
 * Datos que ve el paciente al abrir `/p/[token]`: sus citas (solo suyas, FR-003) ordenadas
 * por inicio, más el nombre y teléfono de su clínica (para FR-008 en la vista).
 */
export async function obtenerVistaPaciente(
  tokenSinValidar: string,
  db: BaseDatos = obtenerDb(),
): Promise<VistaPaciente> {
  const { pacienteId, clinicaId } = await resolverToken(tokenSinValidar, db);

  const [datosClinica] = await db
    .select({ nombre: clinica.nombre, telefono: clinica.telefono })
    .from(clinica)
    .where(eq(clinica.id, clinicaId))
    .limit(1);

  const citas = await db
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
    .where(eq(cita.pacienteId, pacienteId))
    .orderBy(asc(cita.inicio));

  return {
    pacienteId,
    clinicaId,
    clinicaNombre: datosClinica?.nombre ?? '',
    clinicaTelefono: datosClinica?.telefono ?? '',
    citas,
  };
}

/**
 * Regenera el token de un paciente (FR-004, D3). Sustituye el token en la fila 1:1, por lo
 * que el enlace anterior deja de resolver de inmediato. Devuelve el token nuevo.
 * Se restringe al ámbito de la clínica indicada (operación de recepción).
 */
export async function regenerarToken(
  clinicaId: string,
  pacienteId: string,
  db: BaseDatos = obtenerDb(),
): Promise<string> {
  const [fichaPaciente] = await db
    .select({ id: paciente.id })
    .from(paciente)
    .where(and(eq(paciente.id, pacienteId), eq(paciente.clinicaId, clinicaId)))
    .limit(1);

  if (!fichaPaciente) throw new ErrorNegocio('PACIENTE_NO_EXISTE');

  const nuevoToken = generarToken();
  const [actualizada] = await db
    .update(accesoPaciente)
    .set({ token: nuevoToken, creadoEn: new Date() })
    .where(eq(accesoPaciente.pacienteId, pacienteId))
    .returning({ token: accesoPaciente.token });

  if (actualizada) return actualizada.token;

  // El paciente no tenía enlace todavía: se crea uno.
  const [creada] = await db
    .insert(accesoPaciente)
    .values({ pacienteId, token: nuevoToken })
    .returning({ token: accesoPaciente.token });
  return creada.token;
}
