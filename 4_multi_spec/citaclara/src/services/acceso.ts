import bcrypt from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { clinica } from '@/src/db/schema';
import { ErrorNegocio } from '@/src/domain/errores';
import { accesoSchema, type AccesoEntrada } from '@/src/validation';

/**
 * US4 — Acceso con la clave de la clínica (FR-018, D5).
 *
 * La clave se compara SIEMPRE contra su hash (bcrypt); nunca se almacena ni se registra
 * en claro. Una clave incorrecta y una clínica inexistente devuelven el mismo error, para
 * no revelar qué clínicas existen.
 */

/** Coste de bcrypt: suficiente para una clave de mostrador sin penalizar el acceso. */
export const COSTE_HASH = 10;

/** Hash de una clave nueva (lo usa la semilla y el aprovisionamiento). */
export async function hashearClave(clave: string): Promise<string> {
  return bcrypt.hash(clave, COSTE_HASH);
}

/**
 * Hash de referencia para gastar el mismo tiempo cuando la clínica no existe y evitar
 * que la duración de la respuesta delate qué identificadores son válidos.
 */
const HASH_SENUELO = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8DvKUOZ0FSMEvUwZUkAyGYzGZ.tR8W';

export interface ClinicaAutenticada {
  id: string;
  nombre: string;
}

export async function validarAcceso(
  entrada: AccesoEntrada,
  db: BaseDatos = obtenerDb(),
): Promise<ClinicaAutenticada> {
  const datos = accesoSchema.parse(entrada);

  const [encontrada] = await db
    .select({ id: clinica.id, nombre: clinica.nombre, claveHash: clinica.claveHash })
    .from(clinica)
    .where(eq(clinica.id, datos.clinica_id))
    .limit(1);

  const coincide = await bcrypt.compare(datos.clave, encontrada?.claveHash ?? HASH_SENUELO);
  if (!encontrada || !coincide) throw new ErrorNegocio('CLAVE_INVALIDA');

  return { id: encontrada.id, nombre: encontrada.nombre };
}

/** Clínicas disponibles para el selector de la pantalla de acceso. */
export async function listarClinicas(db: BaseDatos = obtenerDb()): Promise<ClinicaAutenticada[]> {
  return db
    .select({ id: clinica.id, nombre: clinica.nombre })
    .from(clinica)
    .orderBy(asc(clinica.nombre));
}

/** Datos de la clínica de la sesión, para mostrar su nombre en el panel. */
export async function obtenerClinica(
  clinicaId: string,
  db: BaseDatos = obtenerDb(),
): Promise<ClinicaAutenticada | undefined> {
  const [encontrada] = await db
    .select({ id: clinica.id, nombre: clinica.nombre })
    .from(clinica)
    .where(eq(clinica.id, clinicaId))
    .limit(1);
  return encontrada;
}
