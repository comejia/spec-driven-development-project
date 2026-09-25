import { randomBytes } from 'node:crypto';

/**
 * Token opaco de acceso del paciente (005, FR-001, research D2).
 *
 * El token es la única credencial del paciente: debe ser **opaco e imposible de adivinar**.
 * Se generan 32 bytes (256 bits) de aleatoriedad criptográfica y se codifican en base64url
 * (seguro en rutas `/p/[token]`, sin `+`, `/` ni `=`). No se almacena ningún hash: es un
 * enlace de conveniencia cuya seguridad reside en la entropía y en la posesión del enlace.
 */

/** Bytes de entropía del token (256 bits ≫ 128 bits exigidos). */
export const BYTES_TOKEN = 32;

/** Genera un token opaco nuevo, codificado en base64url. */
export function generarToken(): string {
  return randomBytes(BYTES_TOKEN).toString('base64url');
}

/**
 * Comprueba si una cadena tiene la forma de un token generado por `generarToken`.
 * No implica que exista en la base: solo descarta entradas obviamente inválidas antes de
 * consultar. La denegación es neutra en cualquier caso (FR-002, D4).
 */
export function pareceToken(valor: string): boolean {
  return /^[A-Za-z0-9_-]{40,64}$/.test(valor);
}
