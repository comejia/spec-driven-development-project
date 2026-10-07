import { decidirCancelacion, type MotivoBloqueo } from '@/src/domain/politica-cancelacion';
import type {
  CitaParaPolitica,
  EvaluacionCancelacion,
  MotivoNoCancelable,
  PoliticaCancelacion,
} from './puertos';

/**
 * Adaptador REAL de la política de cancelación del portal (003) sobre la de 005.
 *
 * Sustituye al adaptador provisional `politica-desarrollo.ts`: en lugar de reimplementar el
 * umbral de 24 h, delega en `decidirCancelacion` (005, src/domain/politica-cancelacion.ts),
 * la fuente de verdad única del plazo (FR-007/FR-008/FR-009). 003 no escribe "24 horas"
 * como constante propia (005 FR-012): solo traduce el resultado al puerto que consume.
 *
 * El teléfono de la clínica se inyecta (lo conoce 005 vía la ficha de la clínica); el puerto
 * lo expone cuando la vía alternativa es "llame a la clínica" (dentro de ventana o ya pasada).
 */

/** Traduce el motivo de bloqueo de 005 al motivo del puerto que consume 003. */
const MAPEO_MOTIVO: Record<MotivoBloqueo, MotivoNoCancelable> = {
  fuera_de_plazo: 'FUERA_DE_PLAZO',
  ya_iniciada: 'YA_PASADA',
  estado_no_cancelable: 'ESTADO_NO_RESERVADA',
};

export interface OpcionesPolitica {
  /** Teléfono de la clínica a mostrar dentro de la ventana (lo provee 005 vía la ficha). */
  telefonoClinica: string;
}

export class PoliticaReal implements PoliticaCancelacion {
  private readonly telefonoClinica: string;

  constructor(opciones: OpcionesPolitica) {
    this.telefonoClinica = opciones.telefonoClinica;
  }

  evaluar(cita: CitaParaPolitica, ahora: Date): EvaluacionCancelacion {
    const decision = decidirCancelacion(cita.inicio, cita.estado, ahora);

    if (decision.permitirCancelar) {
      return { cancelable: true };
    }

    const motivo = decision.motivoBloqueo
      ? MAPEO_MOTIVO[decision.motivoBloqueo]
      : 'ESTADO_NO_RESERVADA';

    // "Estado no reservado" no ofrece vía alternativa por teléfono; los otros dos sí (FR-008).
    if (motivo === 'ESTADO_NO_RESERVADA') {
      return { cancelable: false, motivo };
    }

    return { cancelable: false, motivo, telefonoClinica: this.telefonoClinica };
  }
}
