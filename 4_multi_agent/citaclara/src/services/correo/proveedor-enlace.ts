/**
 * Interfaz del proveedor del enlace de acceso del paciente (T009).
 *
 * El enlace personal `/p/[token]` es PROPIEDAD DE 005 (FR-001/FR-005 de 005). 002 no emite
 * ni valida tokens: solo obtiene el enlace de un paciente y lo incrusta en el `.eml`
 * (FR-005/FR-007, research D4). Mientras 005 no esté integrada se usa un stub (T025).
 */
export interface ProveedorEnlaceAcceso {
  /** Devuelve el enlace `/p/[token]` estable del paciente indicado. */
  enlaceDeAcceso(pacienteId: string): Promise<string>;
}
