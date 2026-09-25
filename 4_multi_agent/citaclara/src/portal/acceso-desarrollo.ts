import { eq } from 'drizzle-orm';
import { obtenerDb, type BaseDatos } from '@/src/db';
import { paciente } from '@/src/db/schema';
import type { PortalAccessGateway, ResultadoAcceso } from './puertos';

/**
 * ADAPTADOR PROVISIONAL — propiedad real: 005.
 *
 * Implementa `PortalAccessGateway` sobre la semilla para poder desarrollar y probar 003 de
 * forma aislada mientras 005 no exista. Cuando 005 aterrice, este archivo se sustituye por
 * su implementación real sin tocar la UI ni los servicios de lectura de 003.
 *
 * Derivación de token de desarrollo (determinista y documentada, ver tasks.md T006 y
 * quickstart.md): el token de prueba es `dev-<pacienteId>`, es decir el prefijo fijo
 * `dev-` seguido del UUID del paciente de la semilla. `resolverPaciente` acepta solo ese
 * formato; cualquier otro token (vacío, sin prefijo, con un UUID inexistente o manipulado)
 * se deniega con `{ ok: false }` sin revelar el motivo (D3, 005 FR-002).
 *
 * El acceso se basa EXCLUSIVAMENTE en la posesión del token: no hay segundo factor ni
 * parámetro adicional (FR-004 / D7).
 */

const PREFIJO_DEV = 'dev-';

/** Construye el token de desarrollo para un paciente de la semilla. */
export function tokenDeDesarrollo(pacienteId: string): string {
  return `${PREFIJO_DEV}${pacienteId}`;
}

export class AccesoDesarrollo implements PortalAccessGateway {
  private readonly dbExplicita?: BaseDatos;

  constructor(db?: BaseDatos) {
    this.dbExplicita = db;
  }

  /** Resuelve la conexión de forma perezosa: importar el módulo no exige DATABASE_URL. */
  private get db(): BaseDatos {
    return this.dbExplicita ?? obtenerDb();
  }

  async resolverPaciente(token: string): Promise<ResultadoAcceso> {
    if (typeof token !== 'string' || !token.startsWith(PREFIJO_DEV)) {
      return { ok: false };
    }

    const pacienteId = token.slice(PREFIJO_DEV.length);
    if (pacienteId.length === 0) return { ok: false };

    const [fila] = await this.db
      .select({ id: paciente.id, clinicaId: paciente.clinicaId })
      .from(paciente)
      .where(eq(paciente.id, pacienteId))
      .limit(1)
      .catch(() => []); // UUID malformado → consulta sin resultados, se deniega igual.

    if (!fila) return { ok: false };

    return { ok: true, pacienteId: fila.id, clinicaId: fila.clinicaId };
  }
}

/** Instancia por defecto usada por los Route Handlers del portal. */
export const accesoPortal: PortalAccessGateway = new AccesoDesarrollo();
