/**
 * Redondea un número a 2 decimales (redondeo bancario estándar).
 */
export function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/**
 * Formatea un número como moneda española: 1.500,00 €
 */
export function formatearMoneda(valor: number): string {
  return valor.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

/**
 * Parsea un string de moneda española a número.
 * Acepta formatos como "1.500,00" o "1500.00"
 */
export function parsearMoneda(texto: string): number | null {
  const limpio = texto.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(limpio)
  return isNaN(num) ? null : num
}
