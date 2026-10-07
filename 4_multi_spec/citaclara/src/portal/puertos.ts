import type { EstadoCita } from '@/src/db/schema';

/**
 * Puertos que 003 (Portal del Paciente) CONSUME de la spec 005 (Acceso y cancelación del
 * paciente). 003 programa contra estas interfaces, nunca contra una implementación
 * concreta (contracts/puertos-005.md).
 *
 * La implementación real es propiedad de 005. Mientras 005 no exista, 003 usa adaptadores
 * PROVISIONALES sobre la semilla (`acceso-desarrollo.ts`, `politica-desarrollo.ts`), que se
 * sustituyen por la implementación de 005 sin tocar la UI ni los servicios de lectura.
 *
 * Regla de acoplamiento (Principio 4 + Spec Primero): 003 no fija reglas de 005 (token,
 * umbral de cancelación) ni de 001 (transición, concurrencia); las remite.
 */

// ---------------------------------------------------------------------------
// PortalAccessGateway — acceso (005 FR-001..FR-006)
// ---------------------------------------------------------------------------

/**
 * Resultado de resolver un token opaco. La denegación NUNCA revela si el token existió:
 * `{ ok: false }` cubre token inexistente, manipulado o regenerado (D3, 005 FR-002).
 */
export type ResultadoAcceso =
  | { ok: true; pacienteId: string; clinicaId: string }
  | { ok: false };

/** Traduce `/p/[token]` en la identidad del paciente, o deniega sin filtrar información. */
export interface PortalAccessGateway {
  resolverPaciente(token: string): Promise<ResultadoAcceso>;
}

// ---------------------------------------------------------------------------
// PoliticaCancelacion — política de cancelación (005 FR-007/FR-008/FR-009)
// ---------------------------------------------------------------------------

/** Motivo por el que una cita no es cancelable por el paciente (cuando `cancelable=false`). */
export type MotivoNoCancelable = 'FUERA_DE_PLAZO' | 'ESTADO_NO_RESERVADA' | 'YA_PASADA';

export interface EvaluacionCancelacion {
  cancelable: boolean;
  /** Presente cuando `cancelable=false`. */
  motivo?: MotivoNoCancelable;
  /** Presente cuando la vía alternativa es llamar a la clínica (dentro de ventana). */
  telefonoClinica?: string;
}

/** Cita mínima que la política necesita evaluar (subconjunto de la cita de 001). */
export interface CitaParaPolitica {
  estado: EstadoCita;
  inicio: Date;
}

/**
 * Decide si una cita es cancelable por el paciente y qué mostrar dentro de la ventana.
 * El umbral (24 h) es propiedad de 005; 003 no lo fija ni lo escribe como texto propio.
 */
export interface PoliticaCancelacion {
  evaluar(cita: CitaParaPolitica, ahora: Date): EvaluacionCancelacion;
}
