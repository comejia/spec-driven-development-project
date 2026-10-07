# Data Model: Recordatorios de Cita (002)

**Fecha**: 2026-09-25 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

002 añade **una** entidad nueva (`recordatorio`) y **consume** entidades existentes de 001
(`cita`, `paciente`) y el enlace de acceso de 005. No modifica el esquema de 001.

---

## Entidad nueva: `recordatorio` (propiedad de 002)

Constancia de que se ha generado un aviso para una cita concreta. Garantiza la no duplicación
(FR-003/FR-004).

| Campo | Tipo | Reglas | Origen |
|-------|------|--------|--------|
| `id` | `uuid` (PK, `defaultRandom`) | Identificador propio | — |
| `cita_id` | `uuid` (FK → `cita.id`, `on delete cascade`) | **ÚNICO** (índice único): a lo sumo un recordatorio por cita en toda su vida | FR-003 |
| `generado_en` | `timestamptz` (`mode: date`, `default now()`) | Instante de generación (UTC; se muestra en `Europe/Madrid`) | FR-004 |
| `resultado` | enum `resultado_recordatorio` (`enviado`, `simulado`, `omitido`) | `simulado` cuando se escribe `.eml` sin SMTP; `omitido` cuando el paciente no tiene email | FR-013/FR-014 |
| `destino_email` | `text` (nullable) | Email al que se dirigió; `null` si `omitido` | FR-005/FR-014 |

**Restricciones**:
- `recordatorio_cita_unico`: índice único sobre `cita_id`. Es el ancla de la idempotencia (D2):
  la generación usa `INSERT ... ON CONFLICT (cita_id) DO NOTHING`.
- FK a `cita` con `on delete cascade`: si una cita se borrara, su recordatorio desaparece (no hay
  borrado de citas en el alcance actual; es defensa de integridad).

**Notas de diseño**:
- NO se almacena token de cancelación por cita (eliminado por S3). El enlace del paciente es
  `/p/[token]`, propiedad de 005; 002 no lo persiste como identidad propia.
- El estado `resultado = omitido` deja constancia verificable de FR-014 sin interrumpir el proceso.

### Migración
- Nueva migración Drizzle (p. ej. `0002_recordatorios.sql`) que crea el enum
  `resultado_recordatorio` y la tabla `recordatorio` con el índice único. No toca tablas de 001.

### Definición Drizzle (orientativa, se concreta en implementación)

```ts
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
    generadoEn: timestamp('generado_en', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    resultado: resultadoRecordatorioEnum('resultado').notNull(),
    destinoEmail: text('destino_email'),
  },
  (t) => [unique('recordatorio_cita_unico').on(t.citaId)],
);
```

---

## Entidades consumidas (no modificadas)

### `cita` (propiedad de 001)
- Se **lee** para seleccionar elegibles: `estado = 'reservada'` y `inicio ∈ [ahora+24h, ahora+48h)`
  (FR-012, FR-002).
- Aporta: `id`, `profesionalId`, `servicioId`, `pacienteId`, `inicio`, `estado`.
- La transición `reservada → cancelada` y la liberación del hueco las ejecuta el servicio de 001
  (FR-010); 002 no escribe el estado.

### `paciente` (propiedad de 001)
- Aporta `nombre` y `email` (destino del recordatorio). `email` es nullable → citas de pacientes
  sin email se omiten (FR-014, `resultado = omitido`).

### `profesional`, `servicio`, `clinica` (propiedad de 001)
- Se **leen** (join) para componer el contenido del email: nombre del profesional, nombre del
  servicio, nombre de la clínica y su teléfono (para el mensaje "dentro de la ventana" de 005).

### Enlace de acceso del paciente `/p/[token]` (propiedad de 005)
- 002 obtiene el enlace del paciente **a través de 005** (no lo emite ni lo persiste). Se incrusta
  en el `.eml` (FR-005/FR-007). En tests, se sustituye por un proveedor de enlaces de doble (stub)
  hasta que 005 esté integrada (ver research.md D4).

---

## Consultas clave (orientativas)

- **Selección de elegibles** (proceso diario): citas con `estado = 'reservada'` y
  `inicio >= :ahora + interval '24 hours'` y `inicio < :ahora + interval '48 hours'`, con `LEFT JOIN`
  a `recordatorio` para excluir las ya recordadas (o simplemente confiar en el `ON CONFLICT`).
- **Inserción idempotente**: `INSERT INTO recordatorio (cita_id, resultado, destino_email) VALUES
  (...) ON CONFLICT (cita_id) DO NOTHING RETURNING id`. Si no devuelve fila, la cita ya estaba
  recordada → no se reescribe el `.eml`.

## Trazabilidad (entidad/campo → requisito)

| Elemento | Requisito |
|----------|-----------|
| `recordatorio.cita_id` único | FR-003 (idempotencia por cita) |
| `recordatorio.generado_en`, `resultado` | FR-004 (constancia verificable) |
| `resultado = simulado` + `.eml` | FR-013 (modo simulado) |
| `resultado = omitido` (paciente sin email) | FR-014 |
| Selección `reservada` + ventana 24-48 h | FR-002, FR-012 |
| Enlace `/p/[token]` incrustado | FR-005, FR-007 (consume 005) |
| Transición vía 001 | FR-010, FR-010a (consume 001) |
