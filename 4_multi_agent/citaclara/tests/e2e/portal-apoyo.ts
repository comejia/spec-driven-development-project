import { and, asc, eq, gte } from 'drizzle-orm';
import { crearDb } from '@/src/db';
import { cita, paciente } from '@/src/db/schema';
import { reiniciarYSembrar } from '@/src/seed/seed';
import { tokenDeDesarrollo } from '@/src/portal/acceso-desarrollo';

/**
 * Apoyo e2e del Portal del Paciente (003).
 *
 * Los e2e usan la base de datos de `npm run dev` (DATABASE_URL). Este apoyo la siembra de
 * forma determinista y resuelve un paciente con cita futura "reservada" a ≥24 h, devolviendo
 * su token de desarrollo `dev-<pacienteId>` (el mismo que 005 sustituirá en el futuro).
 */

export interface DatosPortal {
  /** Token de desarrollo de un paciente con al menos una cita futura cancelable. */
  tokenCancelable: string;
  /** Token de un paciente cualquiera (puede o no tener citas). */
  tokenAlguno: string;
}

function urlBaseDatos(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL para preparar los datos e2e del portal.');
  return url;
}

/** Siembra la base y devuelve tokens útiles para los e2e del portal. */
export async function prepararDatosPortal(): Promise<DatosPortal> {
  const { db, pool } = crearDb(urlBaseDatos());
  try {
    await reiniciarYSembrar({ db });

    // Paciente con cita futura "reservada" a 24 h o más (cancelable según política 005).
    const limite = new Date(Date.now() + 25 * 3600_000);
    const [futura] = await db
      .select({ pacienteId: cita.pacienteId })
      .from(cita)
      .where(and(eq(cita.estado, 'reservada'), gte(cita.inicio, limite)))
      .orderBy(asc(cita.inicio))
      .limit(1);

    const [cualquiera] = await db.select({ id: paciente.id }).from(paciente).limit(1);

    return {
      tokenCancelable: tokenDeDesarrollo(futura?.pacienteId ?? cualquiera.id),
      tokenAlguno: tokenDeDesarrollo(cualquiera.id),
    };
  } finally {
    await pool.end();
  }
}
