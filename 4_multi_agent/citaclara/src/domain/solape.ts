/**
 * Detección de solape de intervalos `[inicio, fin)` (FR-012).
 *
 * Semántica de intervalo semiabierto: dos citas adyacentes (el fin de una coincide con
 * el inicio de la otra) NO solapan. Es la misma semántica que la franja `tstzrange`
 * con límites `'[)'` que aplica la base de datos (D1), de modo que dominio y motor
 * coinciden exactamente.
 *
 * La comprobación en dominio es de apoyo y de mensajes: la garantía real frente a
 * concurrencia la da la restricción de exclusión de PostgreSQL (Principio 3).
 */

export interface Intervalo {
  inicio: Date;
  fin: Date;
}

export class IntervaloInvalidoError extends Error {
  constructor(intervalo: Intervalo) {
    super(
      `Intervalo no válido: el fin (${intervalo.fin.toISOString()}) debe ser posterior al inicio (${intervalo.inicio.toISOString()}).`,
    );
    this.name = 'IntervaloInvalidoError';
  }
}

function exigirIntervalo(intervalo: Intervalo): Intervalo {
  if (!(intervalo.fin.getTime() > intervalo.inicio.getTime())) {
    throw new IntervaloInvalidoError(intervalo);
  }
  return intervalo;
}

/** true si los intervalos `[inicio, fin)` se solapan en algún instante. */
export function solapan(a: Intervalo, b: Intervalo): boolean {
  exigirIntervalo(a);
  exigirIntervalo(b);
  return a.inicio.getTime() < b.fin.getTime() && b.inicio.getTime() < a.fin.getTime();
}

/** Devuelve el primer intervalo de la lista que solapa con el candidato, si hay alguno. */
export function primerSolape<T extends Intervalo>(candidato: Intervalo, existentes: T[]): T | undefined {
  return existentes.find((existente) => solapan(candidato, existente));
}

/** true si el candidato no solapa con ninguno de los intervalos existentes. */
export function estaLibre(candidato: Intervalo, existentes: Intervalo[]): boolean {
  return !existentes.some((existente) => solapan(candidato, existente));
}
