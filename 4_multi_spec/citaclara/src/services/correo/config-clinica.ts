import { ErrorNegocio } from '@/src/domain/errores';
import { configCorreoSchema, type ConfigCorreo } from '@/src/validation/recordatorios';

/**
 * Fuente de los datos de remitente/clínica que el `.eml` necesita (T007 de tasks.md).
 *
 * La tabla `clinica` de 001 solo aporta `id`/`nombre`; el email del remitente, el teléfono
 * de la clínica (FR-009) y la URL base del acceso `/p/[token]` de 005 se resuelven desde
 * configuración de entorno. Así 002 no redefine el esquema de 001 (Principio 4).
 */

export const VARIABLES_CORREO = {
  remitenteNombre: 'CORREO_REMITENTE_NOMBRE',
  remitenteEmail: 'CORREO_REMITENTE_EMAIL',
  telefonoClinica: 'CLINICA_TELEFONO',
  urlBaseAcceso: 'ACCESO_URL_BASE',
} as const;

/**
 * Lee y valida la configuración de correo desde `env`. Lanza CONFIG_CORREO_INCOMPLETA si
 * falta o es inválida, de modo que el proceso termine con un mensaje claro (es-ES).
 */
export function obtenerConfigCorreo(env: NodeJS.ProcessEnv = process.env): ConfigCorreo {
  const candidata = {
    remitenteNombre: env[VARIABLES_CORREO.remitenteNombre],
    remitenteEmail: env[VARIABLES_CORREO.remitenteEmail],
    telefonoClinica: env[VARIABLES_CORREO.telefonoClinica],
    urlBaseAcceso: env[VARIABLES_CORREO.urlBaseAcceso],
  };

  const resultado = configCorreoSchema.safeParse(candidata);
  if (!resultado.success) {
    throw new ErrorNegocio('CONFIG_CORREO_INCOMPLETA');
  }
  return resultado.data;
}
