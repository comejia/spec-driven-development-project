# Fase 1 — Modelo de Datos: Núcleo de Agenda (001)

Derivado de `spec.md` (entidades y FR) y de `research.md`. Los tipos se expresan de forma
conceptual; la representación concreta (Drizzle/PostgreSQL) se detalla donde es relevante para
los invariantes.

## Entidades

### Clínica
| Campo | Tipo | Reglas |
|-------|------|--------|
| id | uuid | PK |
| nombre | texto | requerido |
| clave_hash | texto | hash argon2/bcrypt de la clave de panel (FR-018, D5) |

Relaciones: 1—N con Profesional, Servicio, Paciente, Cita.

### Profesional
| Campo | Tipo | Reglas |
|-------|------|--------|
| id | uuid | PK |
| clinica_id | uuid | FK → Clínica, requerido |
| nombre | texto | requerido (FR-002) |
| especialidad | texto | requerido (p. ej. "fisioterapia", "nutrición") |

Invariante: no puede tener dos citas activas solapadas (FR-010; ver Restricciones).

### Servicio
| Campo | Tipo | Reglas |
|-------|------|--------|
| id | uuid | PK |
| clinica_id | uuid | FK → Clínica, requerido |
| nombre | texto | requerido (FR-003) |
| duracion_min | entero | > 0, minutos enteros (FR-003) |
| precio_centimos | entero | ≥ 0, céntimos de euro (D2, FR-019) |

### Paciente
| Campo | Tipo | Reglas |
|-------|------|--------|
| id | uuid | PK |
| clinica_id | uuid | FK → Clínica, requerido |
| nombre | texto | requerido (FR-004) |
| telefono | texto | requerido; **único por clínica** (FR-004a) |
| email | texto | opcional; formato email si se aporta |

Restricción de unicidad: `UNIQUE (clinica_id, telefono)`.

### Cita
| Campo | Tipo | Reglas |
|-------|------|--------|
| id | uuid | PK |
| clinica_id | uuid | FK → Clínica, requerido |
| profesional_id | uuid | FK → Profesional, requerido (FR-005) |
| servicio_id | uuid | FK → Servicio, requerido (FR-005) |
| paciente_id | uuid | FK → Paciente, requerido; debe existir (FR-014) |
| inicio | timestamptz | requerido; minuto múltiplo de 5 (FR-005a); no en pasado (FR-013) |
| fin | timestamptz | derivado: `inicio + duracion_min` del servicio (FR-006) |
| franja | tstzrange | generado: `tstzrange(inicio, fin, '[)')` (D1) |
| estado | enum | `reservada` \| `completada` \| `cancelada` \| `no_asistida` (FR-007/008) |

Notas:
- `franja` usa límite `'[)'`: citas adyacentes (fin = inicio de otra) NO solapan (FR-012).
- `inicio`/`fin` se guardan en UTC; se interpretan/muestran en `Europe/Madrid` (D3).

## Máquina de estados de la Cita (FR-007/008/009)

```
        (creación)
            │
            ▼
        reservada ──► completada   (estado final; sigue bloqueando hueco)
            │
            ├────────► cancelada    (estado final; libera hueco)
            │
            └────────► no_asistida  (estado final; libera hueco; solo desde reservada, FR-009)
```

- Estado inicial: `reservada` (FR-007).
- Transiciones válidas: únicamente desde `reservada` a `completada`, `cancelada` o `no_asistida`
  (FR-008). Los estados finales no se reabren en la 001.
- `no_asistida` significa exclusivamente "el paciente no se presentó a una cita que seguía
  reservada" (FR-009).

## Invariantes y restricciones (capa PostgreSQL)

1. **Anti-solape por profesional (RN1, FR-010/011)** — restricción de exclusión:
   `EXCLUDE USING gist (profesional_id WITH =, franja WITH &&) WHERE (estado IN ('reservada','completada'))`.
2. **Anti-solape por paciente (FR-012a)** — restricción de exclusión:
   `EXCLUDE USING gist (paciente_id WITH =, franja WITH &&) WHERE (estado IN ('reservada','completada'))`.
3. **Teléfono único por clínica (FR-004a)**: `UNIQUE (clinica_id, telefono)`.
4. **No en pasado (RN2, FR-013)**: validado en dominio/servicio en el momento de creación
   (comparado con "ahora" en `Europe/Madrid`); no es una restricción estática de tabla.
5. **Granularidad de 5 minutos (FR-005a)**: validado en dominio/Zod y opcionalmente con `CHECK`
   (`EXTRACT(MINUTE FROM inicio)::int % 5 = 0` y segundos = 0).
6. **Coherencia fin = inicio + duración (FR-006)**: `fin` y `franja` se derivan en el servicio de
   creación; no se aceptan como entrada del cliente.
7. Requiere la extensión `btree_gist` para las restricciones de exclusión (D1).

## Reglas de validación en creación de cita (FR-014)

Rechazar (con motivo) si falta `profesional_id`, `servicio_id`, `paciente_id` o `inicio`; si el
paciente no existe en la clínica; si `inicio` no es múltiplo de 5 min; o si `inicio` está en el
pasado. El solape (profesional o paciente) lo rechaza la base de datos vía exclusión.
