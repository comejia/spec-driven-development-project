import { ESTADO_INICIAL } from '@/src/domain/cita';
import type {
  CitaParaPolitica,
  EvaluacionCancelacion,
  PoliticaCancelacion,
} from './puertos';

/**
 * ADAPTADOR PROVISIONAL — propiedad real: 005.
 *
 * Implementa `PoliticaCancelacion` con el umbral único de 24 h TAL COMO lo especifica 005
 * (FR-007/FR-008), sin inventar reglas nuevas. Cuando 005 aterrice, se sustituye por su
 * implementación real sin tocar la UI ni los servicios de lectura de 003.
 *
 * Regla (005 FR-007): `cancelable=true` solo si la cita está `reservada` y faltan 24 h o
 * más para su inicio. Dentro de ventana (005 FR-008): `cancelable=false`,
 * `motivo='FUERA_DE_PLAZO'` y `telefonoClinica` presente para el mensaje "llame a la
 * clínica". 003 no escribe "24 horas" como constante propia (005 FR-012).
 */

/** Umbral de 005 (24 h), materializado aquí de forma provisional (propiedad de 005). */
const HORAS_MINIMAS_005 = 24;
const MS_MINIMOS = HORAS_MINIMAS_005 * 60 * 60 * 1000;

export interface OpcionesPolitica {
  /** Teléfono de la clínica a mostrar dentro de la ventana (lo proveerá 005). */
  telefonoClinica: string;
}

export class PoliticaDesarrollo implements PoliticaCancelacion {
  private readonly telefonoClinica: string;

  constructor(opciones: OpcionesPolitica) {
    this.telefonoClinica = opciones.telefonoClinica;
  }

  evaluar(cita: CitaParaPolitica, ahora: Date): EvaluacionCancelacion {
    if (cita.estado !== ESTADO_INICIAL) {
      // Completada, cancelada o no_asistida: nunca cancelable por el portal (005 FR-009).
      return { cancelable: false, motivo: 'ESTADO_NO_RESERVADA' };
    }

    const margenMs = cita.inicio.getTime() - ahora.getTime();

    if (margenMs <= 0) {
      // Cita ya empezada o pasada aunque siga "reservada" (paciente que no acudió).
      return {
        cancelable: false,
        motivo: 'YA_PASADA',
        telefonoClinica: this.telefonoClinica,
      };
    }

    if (margenMs < MS_MINIMOS) {
      // Dentro de la ventana de bloqueo: se remite a la clínica (005 FR-008).
      return {
        cancelable: false,
        motivo: 'FUERA_DE_PLAZO',
        telefonoClinica: this.telefonoClinica,
      };
    }

    return { cancelable: true };
  }
}

/** Teléfono de demostración de la Clínica Eleva (provisional; 005 proveerá el real). */
export const TELEFONO_CLINICA_DEMO = '900 123 456';

/** Instancia por defecto usada por los servicios del portal. */
export const politicaPortal: PoliticaCancelacion = new PoliticaDesarrollo({
  telefonoClinica: TELEFONO_CLINICA_DEMO,
});
