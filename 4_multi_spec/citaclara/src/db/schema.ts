import {
  check,
  customType,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Esquema de la 001 (ver specs/001-agenda-core/data-model.md).
 *
 * El invariante capital (Principio 3, RN1) se ancla en la base de datos mediante
 * restricciones de exclusión `EXCLUDE USING gist` sobre la franja temporal. Drizzle no
 * expresa exclusiones en su DSL, por lo que se añaden en la migración
 * `src/db/migrations/0001_invariantes_agenda.sql` junto a la extensión `btree_gist`.
 */

/** Rango temporal de la cita, `[inicio, fin)`: las citas adyacentes NO solapan (FR-012). */
const tstzrange = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tstzrange';
  },
});

/** Estados de la cita (FR-007/008/009). */
export const estadoCitaEnum = pgEnum('estado_cita', [
  'reservada',
  'completada',
  'cancelada',
  'no_asistida',
]);

/** Estados que ocupan el hueco: cancelada y no_asistida lo liberan (FR-010). */
export const ESTADOS_ACTIVOS = ['reservada', 'completada'] as const;

export const clinica = pgTable('clinica', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  /** Hash argon2/bcrypt de la clave de panel (FR-018, D5). Nunca la clave en claro. */
  claveHash: text('clave_hash').notNull(),
  /**
   * Teléfono de contacto de la clínica (005 FR-008): se muestra al paciente dentro de la
   * ventana de cancelación (< 24 h) para gestionarlo por llamada. Atributo de la entidad
   * Clínica (propiedad de 001) que la 005 consume.
   */
  telefono: text('telefono').notNull().default(''),
});

export const profesional = pgTable('profesional', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicaId: uuid('clinica_id')
    .notNull()
    .references(() => clinica.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  especialidad: text('especialidad').notNull(),
});

export const servicio = pgTable(
  'servicio',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    /** Duración en minutos enteros, > 0 (FR-003). */
    duracionMin: integer('duracion_min').notNull(),
    /** Precio en céntimos de euro: enteros, sin coma flotante (D2, FR-019). */
    precioCentimos: integer('precio_centimos').notNull(),
  },
  (t) => [
    check('servicio_duracion_positiva', sql`${t.duracionMin} > 0`),
    check('servicio_precio_no_negativo', sql`${t.precioCentimos} >= 0`),
  ],
);

export const paciente = pgTable(
  'paciente',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    telefono: text('telefono').notNull(),
    email: text('email'),
  },
  // Teléfono único por clínica (FR-004a).
  (t) => [unique('paciente_telefono_unico_por_clinica').on(t.clinicaId, t.telefono)],
);

export const cita = pgTable(
  'cita',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'cascade' }),
    profesionalId: uuid('profesional_id')
      .notNull()
      .references(() => profesional.id, { onDelete: 'restrict' }),
    servicioId: uuid('servicio_id')
      .notNull()
      .references(() => servicio.id, { onDelete: 'restrict' }),
    pacienteId: uuid('paciente_id')
      .notNull()
      .references(() => paciente.id, { onDelete: 'restrict' }),
    /** Instante en UTC; se interpreta y muestra en Europe/Madrid (D3). */
    inicio: timestamp('inicio', { withTimezone: true, mode: 'date' }).notNull(),
    /** Derivado en el servicio: inicio + duración del servicio (FR-006). */
    fin: timestamp('fin', { withTimezone: true, mode: 'date' }).notNull(),
    /** Franja `[inicio, fin)` generada por la base de datos (D1). */
    franja: tstzrange('franja').generatedAlwaysAs(sql`tstzrange(inicio, fin, '[)')`),
    estado: estadoCitaEnum('estado').notNull().default('reservada'),
  },
  (t) => [
    // Granularidad de 5 minutos (FR-005a). Se usa el epoch (inmutable y sin
    // dependencia de la zona horaria de la sesión): 300 s = 5 min.
    check('cita_granularidad_5min', sql`(EXTRACT(EPOCH FROM ${t.inicio})::numeric % 300) = 0`),
    check('cita_fin_posterior_a_inicio', sql`${t.fin} > ${t.inicio}`),
  ],
);

/**
/**
 * Enlace de acceso del paciente (005, FR-001/004, data-model.md).
 *
 * Relación 1:1 con `paciente`: cada paciente tiene UN token opaco estable que da acceso a
 * todas sus citas vía `/p/[token]`. La regeneración (FR-004) sustituye el token en esta
 * misma fila, invalidando el anterior de inmediato. El token es único e indexado.
 */
export const accesoPaciente = pgTable('acceso_paciente', {
  id: uuid('id').primaryKey().defaultRandom(),
  pacienteId: uuid('paciente_id')
    .notNull()
    .unique()
    .references(() => paciente.id, { onDelete: 'cascade' }),
  /** Token opaco (≥128 bits, URL-safe); único y no adivinable (FR-001, research D2). */
  token: text('token').notNull().unique(),
  creadoEn: timestamp('creado_en', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/**
 * Recordatorio (propiedad de 002, ver specs/002-recordatorios-cita/data-model.md).
 *
 * Constancia de que se ha generado un aviso para una cita. La no duplicación (FR-003) se
 * ancla en el índice único sobre `cita_id` + inserción condicional `ON CONFLICT DO NOTHING`
 * (D2), replicando el enfoque de 001 de poner las garantías capitales en la capa de datos.
 */
export const resultadoRecordatorioEnum = pgEnum('resultado_recordatorio', [
  'enviado',
  'simulado',
  'omitido',
]);

export const recordatorio = pgTable(
  'recordatorio',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    citaId: uuid('cita_id')
      .notNull()
      .references(() => cita.id, { onDelete: 'cascade' }),
    /** Instante de generación en UTC; se muestra en Europe/Madrid (FR-004). */
    generadoEn: timestamp('generado_en', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    /** `simulado` al escribir el .eml sin SMTP; `omitido` si el paciente no tiene email. */
    resultado: resultadoRecordatorioEnum('resultado').notNull(),
    /** Email al que se dirigió; `null` si `omitido` (FR-005/FR-014). */
    destinoEmail: text('destino_email'),
  },
  // Ancla de la idempotencia (FR-003, D2): a lo sumo un recordatorio por cita en su vida.
  (t) => [unique('recordatorio_cita_unico').on(t.citaId)],
);

export const schema = {
  clinica,
  profesional,
  servicio,
  paciente,
  cita,
  estadoCitaEnum,
  accesoPaciente,
  recordatorio,
  resultadoRecordatorioEnum,
};

export type Clinica = typeof clinica.$inferSelect;
export type Profesional = typeof profesional.$inferSelect;
export type Servicio = typeof servicio.$inferSelect;
export type Paciente = typeof paciente.$inferSelect;
export type Cita = typeof cita.$inferSelect;
export type EstadoCita = (typeof estadoCitaEnum.enumValues)[number];
export type AccesoPaciente = typeof accesoPaciente.$inferSelect;
export type Recordatorio = typeof recordatorio.$inferSelect;
export type ResultadoRecordatorio = (typeof resultadoRecordatorioEnum.enumValues)[number];
