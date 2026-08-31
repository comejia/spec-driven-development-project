/**
 * Sanea un nombre para usarlo como nombre de fichero dentro del .zip.
 *
 * - Sustituye por espacio los caracteres no válidos para nombres de fichero
 *   (`\ / : * ? " < > |`) y los caracteres de control.
 * - Colapsa espacios múltiples en uno solo.
 * - Recorta espacios (y puntos finales problemáticos) de los extremos.
 * - Nunca devuelve una cadena vacía: usa el fallback "sin-nombre".
 *
 * Garantiza que el .zip resultante se descomprima sin errores en el explorador
 * del sistema (RF-008, CE-005).
 */
export function sanearNombreArchivo(nombre: string): string {
  const limpio = (nombre ?? '')
    // Caracteres no válidos en nombres de fichero (Windows/macOS/Linux) + control
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    // Colapsar espacios
    .replace(/\s+/g, ' ')
    .trim()
    // Evitar puntos al final (problemáticos en Windows)
    .replace(/\.+$/, '')
    .trim()

  return limpio.length > 0 ? limpio : 'sin-nombre'
}
