# Fase 1 — Modelo de Datos: Acceso y cancelación del paciente (005)

Derivado de `spec.md` (Key Entities y FR) y de `research.md`. Esta spec **no** define el ciclo de
vida de la cita (propiedad de 001): solo lee `cita.inicio` y `cita.estado` e invoca la transición
`reservada → cancelada` de 001. Las entidades nuevas o extendidas son las siguientes.

## Entidad nueva: Enlace de acceso del paciente (`acceso_paciente`)

Relación **1:1** con `paciente`. Es propiedad de esta spec (005).

| Campo | Tipo | Reglas |
|-------|------|--------|
| id | uuid | PK |
| paciente_id | uuid | FK → `paciente`, requerido; **único** (1:1) |
| token | texto | **opaco, ≥ 128 bits**, URL-safe; **único** e indexado (FR-001, D2) |
| creado_en | timestamptz | requerido; instante de emisión/última regeneración |

Reglas e invariantes:
- **1:1 con paciente**: `UNIQUE (paciente_id)` — cada paciente tiene como máximo un token vigente.
- **Token único**: `UNIQUE (token)` con índice para resolución O(log n) del enlace (FR-001, D2).
- **Regeneración** (FR-004, D3): actualizar `token` (y `creado_en`) **en la misma fila** invalida
  el enlace anterior de inmediato; no hay historial ni solapamiento de tokens.
- **Ámbito**: al resolver `token` se obtiene `paciente_id` y, por él, `clinica_id` del paciente
  (para invocar 001 y mostrar el teléfono correcto).

Relaciones: 1—1 con Paciente; a través del paciente, alcanza sus Citas (001) para listarlas.

## Entidad extendida (propiedad de 001, consumida aquí): `clinica`

Para FR-008 (mostrar el teléfono de la clínica dentro de la ventana) se añade un atributo de
contacto a la entidad Clínica. Es un dato de la entidad **propiedad de 001**; la 005 lo **consume**.

| Campo | Tipo | Reglas |
|-------|------|--------|
| telefono | texto | teléfono de contacto de la clínica; requerido para mostrar dentro de la ventana |

Nota de propiedad: la columna vive en la tabla `clinica` (001). Esta spec la referencia para
FR-008 y la semilla la puebla (D9). No se crea una entidad paralela (Principio 4).

## Entidad referida (propiedad de 001, solo lectura aquí): `cita`

La 005 **lee** de `cita` los campos necesarios para la política y la vista, y **no** modifica su
estructura:

| Campo | Uso en 005 |
|-------|------------|
| id | identificar la cita a cancelar |
| clinica_id | ámbito de la invocación a `cambiarEstado` (001) |
| paciente_id | aislar las citas del paciente del token (FR-003) |
| inicio | calcular el umbral de 24 h (política) y mostrar fecha/hora |
| estado | solo `reservada` es cancelable (FR-009); la transición la hace 001 |

La transición `reservada → cancelada` y la liberación del hueco (restricción de exclusión de 001)
**no** se redefinen aquí.

## Política de cancelación del paciente (regla de negocio, propiedad de 005)

No es una tabla: es una **regla pura** con un umbral único. Se modela como función de dominio
`decidirCancelacion(inicio, estado, ahora)` que devuelve:

- `ofrecerCancelar: boolean` — si la UI debe mostrar el botón (US1/US3).
- `permitirCancelar: boolean` — si el servidor debe aceptar la acción (US2/US3).
- `motivoBloqueo?: 'fuera_de_plazo' | 'ya_iniciada' | 'estado_no_cancelable'` — para el mensaje.

Regla (FR-007/008/009, D5):

```
cancelable ⇔ estado === 'reservada'  ∧  (inicio − ahora) ≥ 24 h
```

- Límite exacto: `(inicio − ahora) == 24 h` → **cancelable** (umbral "24 horas o más").
- `(inicio − ahora)` entre 0 y < 24 h → bloqueada por `fuera_de_plazo` (mostrar teléfono).
- `inicio ≤ ahora` (ya iniciada/pasada) → bloqueada por `ya_iniciada` (mostrar teléfono).
- `estado !== 'reservada'` → `estado_no_cancelable` (no ofrecer; intento directo rechazado).

`ofrecerCancelar === permitirCancelar` siempre (misma función en UI y servidor → coherencia
FR-012), salvo la carrera resuelta por 001 (si entre pintar y actuar la cita deja de estar
`reservada`, 001 devuelve `TRANSICION_INVALIDA` y se muestra "ya no procede", FR-011).

## Vista del paciente (proyección de lectura, no entidad persistida)

Lo que ve el paciente al abrir `/p/[token]` es una proyección derivada:

| Campo | Origen |
|-------|--------|
| citas[] | citas del `paciente_id` del token (001), ordenadas por `inicio` |
| citas[].inicio (formateada) | `cita.inicio` formateado en `Europe/Madrid` (es-ES) |
| citas[].estado | `cita.estado` (001) |
| citas[].ofrecerCancelar | `decidirCancelacion(...)` (005) |
| clinicaTelefono | `clinica.telefono` (mostrado cuando no se ofrece cancelar) |

## Estados del enlace (conceptual)

```
   (recepción emite token)          (recepción regenera)
            │                                │
            ▼                                ▼
        vigente ───────────────────────► vigente'  (el token anterior queda no vigente al instante)
```

No se persiste un estado "revocado": la vigencia es implícita (solo existe el token actual en la
fila 1:1). Un token que no coincide con ninguna fila → acceso denegado neutro (FR-002, D4).

## Reglas de validación (entrada)

- **Token** (ruta `/p/[token]`): cadena no vacía; cualquier valor que no resuelva a una fila →
  denegación neutra (no se valida "formato" para no filtrar; se trata todo fallo igual).
- **Cancelación** (`POST /api/p/[token]/cancelar`): requiere `citaId`; el servidor verifica que la
  cita pertenece al paciente del token (FR-003), aplica la política (FR-007/008/009) y solo entonces
  invoca `cambiarEstado` de 001. Cualquier incumplimiento → error de negocio con mensaje neutro/es-ES.
