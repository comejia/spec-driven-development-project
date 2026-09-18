/**
 * Traducción de violaciones de restricción de PostgreSQL a errores de negocio.
 *
 * El invariante anti-solape vive en el motor (Principio 3, D1): cuando la restricción de
 * exclusión rechaza una inserción, PostgreSQL devuelve el código `23P01` y el nombre de
 * la restricción, que es lo que permite distinguir un solape de profesional de uno de
 * paciente sin volver a consultar la agenda.
 */

/** `unique_violation` */
export const CODIGO_UNICIDAD = '23505';
/** `exclusion_violation` */
export const CODIGO_EXCLUSION = '23P01';
/** `check_violation` */
export const CODIGO_CHECK = '23514';

export const RESTRICCION_SOLAPE_PROFESIONAL = 'cita_sin_solape_profesional';
export const RESTRICCION_SOLAPE_PACIENTE = 'cita_sin_solape_paciente';
export const RESTRICCION_TELEFONO_UNICO = 'paciente_telefono_unico_por_clinica';
export const RESTRICCION_GRANULARIDAD = 'cita_granularidad_5min';

interface ErrorPostgres {
  code?: string;
  constraint?: string;
}

function comoErrorPostgres(error: unknown): ErrorPostgres | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const posible = error as ErrorPostgres & { cause?: unknown };
  if (typeof posible.code === 'string') return posible;
  // Drizzle envuelve el error original del controlador en `cause`.
  return comoErrorPostgres(posible.cause);
}

export function codigoPostgres(error: unknown): string | undefined {
  return comoErrorPostgres(error)?.code;
}

export function restriccionPostgres(error: unknown): string | undefined {
  return comoErrorPostgres(error)?.constraint;
}

export function esViolacionUnicidad(error: unknown, restriccion?: string): boolean {
  if (codigoPostgres(error) !== CODIGO_UNICIDAD) return false;
  return restriccion === undefined || restriccionPostgres(error) === restriccion;
}

export function esViolacionExclusion(error: unknown, restriccion?: string): boolean {
  if (codigoPostgres(error) !== CODIGO_EXCLUSION) return false;
  return restriccion === undefined || restriccionPostgres(error) === restriccion;
}

export function esViolacionCheck(error: unknown, restriccion?: string): boolean {
  if (codigoPostgres(error) !== CODIGO_CHECK) return false;
  return restriccion === undefined || restriccionPostgres(error) === restriccion;
}
