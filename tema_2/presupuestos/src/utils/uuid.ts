/**
 * Genera un UUID v4 usando la API nativa del navegador.
 */
export function generarId(): string {
  return crypto.randomUUID()
}
