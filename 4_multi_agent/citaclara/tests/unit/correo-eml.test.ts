import { describe, expect, it } from 'vitest';
import { componerEml, fechaRfc5322, nombreFicheroEml } from '@/src/services/correo/emisor-eml';
import { componerRecordatorio } from '@/src/domain/correo';
import type { MensajeCorreo } from '@/src/services/correo/emisor';
import type { ConfigCorreo } from '@/src/validation/recordatorios';

/**
 * T019 (US2): composición del `.eml` (contracts/correo-eml.md) — cabeceras, nombre de
 * fichero determinista y cuerpo es-ES con el enlace de 005 (mockeado).
 */

const CONFIG: ConfigCorreo = {
  remitenteNombre: 'Clínica Eleva',
  remitenteEmail: 'recordatorios@eleva.es',
  telefonoClinica: '+34 900 123 456',
  urlBaseAcceso: 'https://citaclara.example/p',
};

// 2026-10-03 10:30 en Europe/Madrid (horario de verano, +02:00) = 08:30Z.
const INICIO = new Date('2026-10-03T08:30:00.000Z');
const CITA_ID = '11111111-1111-1111-1111-111111111111';

function mensaje(): MensajeCorreo {
  const compuesto = componerRecordatorio(
    {
      pacienteNombre: 'Diana Elegible',
      profesionalNombre: 'María Ferrer',
      servicioNombre: 'Sesión de fisioterapia',
      clinicaNombre: 'Clínica Eleva',
      inicioCita: INICIO,
      enlaceAcceso: 'https://citaclara.example/p/paciente-xyz',
    },
    CONFIG,
  );
  return {
    remitenteNombre: CONFIG.remitenteNombre,
    remitenteEmail: CONFIG.remitenteEmail,
    destinoEmail: 'diana@ejemplo.es',
    asunto: compuesto.asunto,
    cuerpo: compuesto.cuerpo,
    generadoEn: new Date('2026-10-01T09:00:00.000Z'),
    inicioCita: INICIO,
    citaId: CITA_ID,
  };
}

describe('nombreFicheroEml', () => {
  it('usa <yyyyMMdd-HHmm> en Europe/Madrid y el cita_id', () => {
    // 08:30Z en Madrid (+02:00) → 10:30.
    expect(nombreFicheroEml(INICIO, CITA_ID)).toBe(`20261003-1030-${CITA_ID}.eml`);
  });
});

describe('fechaRfc5322', () => {
  it('incluye día de la semana, mes abreviado y desfase horario', () => {
    const d = fechaRfc5322(INICIO);
    expect(d).toMatch(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/);
  });
});

describe('componerEml', () => {
  const eml = componerEml(mensaje());

  it('incluye las cabeceras mínimas (From/To/Subject/Date/MIME/Content-Type)', () => {
    expect(eml).toContain('From: Clínica Eleva <recordatorios@eleva.es>');
    expect(eml).toContain('To: diana@ejemplo.es');
    expect(eml).toContain('Subject: Recordatorio de tu cita en Clínica Eleva el 03/10/2026 a las 10:30');
    expect(eml).toContain('MIME-Version: 1.0');
    expect(eml).toContain('Content-Type: text/plain; charset=UTF-8');
    // La cabecera Date corresponde al instante de GENERACIÓN (01/10/2026), no al inicio.
    expect(eml).toMatch(/Date: \w{3}, 01 \w{3} 2026/);
  });

  it('separa cabeceras y cuerpo con una línea en blanco (CRLF)', () => {
    expect(eml).toContain('\r\n\r\n');
  });

  it('el cuerpo incluye paciente, profesional, servicio, fecha/hora, clínica y enlace de 005', () => {
    expect(eml).toContain('Hola Diana Elegible:');
    expect(eml).toContain('Profesional: María Ferrer');
    expect(eml).toContain('Servicio: Sesión de fisioterapia');
    expect(eml).toContain('Fecha y hora: 03/10/2026 10:30');
    expect(eml).toContain('Clínica Eleva');
    expect(eml).toContain('https://citaclara.example/p/paciente-xyz');
  });
});
