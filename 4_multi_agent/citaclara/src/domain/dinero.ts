/**
 * Dinero exacto al céntimo (Principio 2, FR-019, D2).
 *
 * Los importes se representan SIEMPRE como enteros de céntimos. Nunca se usa coma
 * flotante para dinero: 4000 céntimos = 40,00 €.
 */

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Espacios especiales que `Intl` inserta antes del símbolo €. */
const ESPACIOS_ESPECIALES = /[\u00a0\u202f]/g;

export class ImporteInvalidoError extends Error {
  constructor(valor: unknown) {
    super(`Importe en céntimos no válido: ${String(valor)}`);
    this.name = 'ImporteInvalidoError';
  }
}

/** Comprueba que un valor es un número entero de céntimos utilizable como importe. */
export function esCentimosValidos(centimos: unknown): centimos is number {
  return typeof centimos === 'number' && Number.isSafeInteger(centimos);
}

function exigirCentimos(centimos: number): number {
  if (!esCentimosValidos(centimos)) throw new ImporteInvalidoError(centimos);
  return centimos;
}

/**
 * Formatea céntimos como importe en euros con formato español: 4000 → "40,00 €".
 * Se normaliza el separador a un espacio simple para que el texto sea estable.
 */
export function formatearEuros(centimos: number): string {
  return FORMATO_EUROS.format(exigirCentimos(centimos) / 100).replace(ESPACIOS_ESPECIALES, ' ');
}

/** Suma importes en céntimos sin pérdida de exactitud. */
export function sumarCentimos(...importes: number[]): number {
  return importes.reduce((total, importe) => total + exigirCentimos(importe), 0);
}

/**
 * Convierte una cantidad escrita en euros ("40,00" o "40.00") a céntimos exactos.
 * Rechaza cantidades con más de dos decimales para no perder céntimos.
 */
export function eurosACentimos(euros: string): number {
  const normalizado = euros.trim().replace(/\s/g, '').replace(',', '.');
  const coincidencia = /^-?\d+(\.\d{1,2})?$/.exec(normalizado);
  if (!coincidencia) throw new ImporteInvalidoError(euros);
  const [enteros, decimales = ''] = normalizado.replace('-', '').split('.');
  const signo = normalizado.startsWith('-') ? -1 : 1;
  const centimos = Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
  return signo * centimos;
}
