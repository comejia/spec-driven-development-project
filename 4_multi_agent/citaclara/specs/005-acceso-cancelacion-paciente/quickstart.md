# Quickstart — Validación de Acceso y cancelación del paciente (005)

Guía para validar de extremo a extremo que la 005 cumple sus reglas: acceso por enlace personal
`/p/[token]` y política única de cancelación de 24 h. No contiene implementación; para detalles,
ver [data-model.md](./data-model.md) y [contracts/](./contracts/README.md).

## Prerrequisitos

- Entorno de la 001 operativo: Node.js 22 LTS, PostgreSQL 16 con `btree_gist`, variables de
  entorno de conexión y sesión (ver `specs/001-agenda-core/quickstart.md`).
- Migraciones de la 005 aplicadas: tabla `acceso_paciente` (token único, 1:1 con paciente) y la
  columna de contacto `clinica.telefono`.
- **Semilla determinista** re-ejecutada para que cada paciente tenga un **token estable** y cada
  clínica un **teléfono** (D9). Misma semilla → mismos tokens y teléfonos.

## Puesta en marcha

1. Instalar dependencias: `npm install` (sin dependencias nuevas respecto a la 001).
2. Generar y aplicar migraciones: `npm run db:generate` y `npm run db:migrate`.
3. Ejecutar la semilla: `npm run db:seed` (asigna token por paciente y teléfono por clínica).
4. Arrancar la aplicación: `npm run dev` (frontend + Route Handlers).

## Datos de referencia (de la semilla)

Para los escenarios se usan citas con horas relativas a "ahora" reproducibles a partir de la
semilla: una cita **a ≥ 24 h** (cancelable), una **a < 24 h** (bloqueada) y una **pasada**.

## Escenarios de validación (mapeados a la spec)

### V1 — Acceso por enlace válido (US1, FR-001/003, SC-001)
- Abrir `/p/[token]` de un paciente con citas → se listan **solo** sus citas, ordenadas por
  inicio; ninguna de otro paciente.

### V2 — Denegación neutra (US1, FR-002, SC-002)
- Abrir `/p/[token]` con un token inexistente o alterado → **misma** respuesta neutra de "enlace
  no válido"; no se revela ningún dato ni la existencia de pacientes.

### V3 — Regeneración de token (US1, FR-004, SC-003)
- Regenerar el token del paciente (operación de recepción, D3) → el enlace **antiguo** deja de dar
  acceso de inmediato; el **nuevo** concede acceso a las **mismas** citas.

### V4 — Cancelación dentro de plazo (US2, FR-007/010, SC-004/005)
- En una cita `reservada` cuyo inicio es a **≥ 24 h**, pulsar cancelar desde `/p/[token]` → la cita
  pasa a `cancelada` (transición de 001) y el hueco queda **libre**.
- Crear (como recepción) una nueva cita en ese mismo profesional y franja → **se acepta** (el hueco
  estaba realmente libre, SC-005).

### V5 — Límite exacto de 24 h (Edge case, FR-007)
- Cita cuyo inicio es exactamente a **24 h** → **cancelable**. A **23 h 59 min** → **no** cancelable.

### V6 — Bloqueo dentro de la ventana (US3, FR-008)
- Cita `reservada` a **< 24 h** → la vista **no ofrece** cancelar y muestra el **teléfono de la
  clínica** del paciente.
- Intento directo de cancelar esa cita (forzando el endpoint) → rechazo `FUERA_DE_PLAZO`, sin cambios.

### V7 — Cita ya iniciada/pasada (US3, FR-008)
- Cita cuyo inicio ya pasó → no se ofrece cancelar y se muestra el teléfono de la clínica.

### V8 — Estado no cancelable (Edge case, FR-009)
- Cita en estado `completada`, `cancelada` o `no_asistida` → no se ofrece cancelar; un intento
  directo se rechaza (`TRANSICION_INVALIDA`) sin cambiar nada.

### V9 — Idempotencia/concurrencia (US2, FR-011, SC-006) — prueba hostil
- Lanzar **dos** cancelaciones simultáneas sobre la misma cita `reservada` (mismo token, o token +
  cambio de recepción) → exactamente **una** cancelación efectiva; la otra recibe
  `TRANSICION_INVALIDA`. Nunca queda un estado imposible (garantía de 001, D6).

### V10 — Aislamiento entre pacientes (US1, FR-003, SC-001)
- Intentar cancelar (o ver) con un token la cita de **otro** paciente → respuesta neutra de enlace
  no válido; nunca se accede ni se cancela una cita ajena.

### V11 — Coherencia de textos de política (FR-012, SC-007)
- Revisar los mensajes de plazo mostrados en `/p/[token]` → comunican **24 horas** y, dentro de la
  ventana, remiten al teléfono. 002 y 003 reutilizan esta política; **0** textos con un plazo
  distinto.

### V12 — Calidad de interfaz (FR-013, SC-008)
- `/p/[token]` es usable sin manual, en **español de España**, con contraste y tamaños accesibles,
  y correcta en **móvil** y portátil; fechas/horas sin ambigüedad (formato ES).

## Comandos de prueba (niveles)

- Unitario (política de cancelación de dominio: umbral 24 h y límites exactos; token) — `npm run test`.
- Integración contra PostgreSQL real (acceso por token, regeneración, aislamiento, cancelación
  dentro/fuera de plazo, hueco liberado, concurrencia) — `npm run test:integration`.
- E2E de UI (`/p/[token]`: listado, cancelar, bloqueo + teléfono, accesibilidad, responsive) —
  `npm run test:e2e`.

La suite completa en verde es **condición de merge** (Principio 6). La prueba hostil de
concurrencia (V9) es obligatoria por su relación con el ciclo de vida de 001 (Principio 3/6).
