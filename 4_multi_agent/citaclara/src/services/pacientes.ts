import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { esViolacionUnicidad, RESTRICCION_TELEFONO_UNICO } from '@/src/db/errores-pg';
import { paciente } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { crearPacienteSchema, type CrearPacienteEntrada } from '@/src/validation';

/**
 * Fichas de paciente (FR-004, FR-004a).
 *
 * La unicidad del teléfono por clínica la garantiza la restricción `UNIQUE
 * (clinica_id, telefono)` de la base de datos: aquí solo se traduce su violación al
 * error de negocio TELEFONO_DUPLICADO, de modo que dos altas simultáneas del mismo
 * teléfono no puedan crear dos fichas.
 */

export interface FichaPaciente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
}

export async function crearPaciente(
  clinicaId: string,
  entrada: CrearPacienteEntrada,
  db: BaseDatos = obtenerDb(),
): Promise<FichaPaciente> {
  const datos = crearPacienteSchema.parse(entrada);
  const email = datos.email?.trim() ? datos.email.trim() : null;

  try {
    const [ficha] = await db
      .insert(paciente)
      .values({
        clinicaId,
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        email,
      })
      .returning({
        id: paciente.id,
        nombre: paciente.nombre,
        telefono: paciente.telefono,
        email: paciente.email,
      });
    return ficha;
  } catch (error) {
    if (esViolacionUnicidad(error, RESTRICCION_TELEFONO_UNICO)) {
      throw new ErrorNegocio('TELEFONO_DUPLICADO');
    }
    throw error;
  }
}

/** Busca fichas por nombre o teléfono dentro de la clínica, ordenadas por nombre. */
export async function buscarPacientes(
  clinicaId: string,
  criterio?: string,
  db: BaseDatos = obtenerDb(),
): Promise<FichaPaciente[]> {
  const texto = criterio?.trim();
  const filtroTexto = texto
    ? or(ilike(paciente.nombre, `%${texto}%`), ilike(paciente.telefono, `%${texto}%`))
    : undefined;

  return db
    .select({
      id: paciente.id,
      nombre: paciente.nombre,
      telefono: paciente.telefono,
      email: paciente.email,
    })
    .from(paciente)
    .where(and(eq(paciente.clinicaId, clinicaId), filtroTexto))
    .orderBy(asc(paciente.nombre));
}

/** Comprueba que la ficha existe en la clínica; si no, PACIENTE_NO_EXISTE (FR-014). */
export async function exigirPacienteDeClinica(
  clinicaId: string,
  pacienteId: string,
  db: BaseDatos = obtenerDb(),
): Promise<FichaPaciente> {
  const [ficha] = await db
    .select({
      id: paciente.id,
      nombre: paciente.nombre,
      telefono: paciente.telefono,
      email: paciente.email,
    })
    .from(paciente)
    .where(and(eq(paciente.clinicaId, clinicaId), eq(paciente.id, pacienteId)))
    .limit(1);

  if (!ficha) throw new ErrorNegocio('PACIENTE_NO_EXISTE');
  return ficha;
}
