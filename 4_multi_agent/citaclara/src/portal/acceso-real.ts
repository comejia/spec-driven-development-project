import { obtenerDb, type BaseDatos } from '@/src/db';
import { esErrorNegocio } from '@/src/domain/errores';
import { resolverToken } from '@/src/services/acceso-paciente';
import type { PortalAccessGateway, ResultadoAcceso } from './puertos';

/**
 * Adaptador REAL del acceso del portal (003) sobre la implementación de 005.
 *
 * Sustituye al adaptador provisional `acceso-desarrollo.ts`: en lugar de tokens de
 * desarrollo `dev-<pacienteId>`, resuelve el token opaco real contra la tabla
 * `acceso_paciente` mediante `resolverToken` (005, src/services/acceso-paciente.ts).
 *
 * La denegación es NEUTRA (D3, 005 FR-002): cualquier fallo de acceso (token inexistente,
 * manipulado o regenerado) produce `{ ok: false }` sin revelar el motivo. 003 no fija
 * reglas de token: las remite a 005.
 */
export class AccesoReal implements PortalAccessGateway {
  private readonly dbExplicita?: BaseDatos;

  constructor(db?: BaseDatos) {
    this.dbExplicita = db;
  }

  /** Resuelve la conexión de forma perezosa: importar el módulo no exige DATABASE_URL. */
  private get db(): BaseDatos {
    return this.dbExplicita ?? obtenerDb();
  }

  async resolverPaciente(token: string): Promise<ResultadoAcceso> {
    // Un token ausente o en blanco es, por definición, inválido: denegación neutra directa
    // (D3), sin consultar a 005. Evita además el error de validación de formato de 005.
    if (typeof token !== 'string' || token.trim().length === 0) {
      return { ok: false };
    }

    try {
      const { pacienteId, clinicaId } = await resolverToken(token, this.db);
      return { ok: true, pacienteId, clinicaId };
    } catch (error) {
      // El acceso de 005 lanza un error de negocio neutro ante cualquier token no válido.
      // El puerto de 003 lo traduce a `{ ok: false }` sin distinguir el motivo (D3).
      if (esErrorNegocio(error)) return { ok: false };
      throw error;
    }
  }
}

/** Instancia por defecto usada por el código de producción del portal (acceso real de 005). */
export const accesoPortal: PortalAccessGateway = new AccesoReal();
