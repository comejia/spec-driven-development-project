---
description: "Task list for feature implementation"
---

# Tasks: Portal del Paciente

**Input**: Design documents from `/specs/003-portal-paciente/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: INCLUIDOS. La constitución (Principio 6) y el plan exigen que cada FR/criterio tenga
test que lo referencie; el plan define suites Vitest (unit), Vitest+Testcontainers (integración)
y Playwright (e2e). La suite en verde es puerta de merge.

**Organization**: Tareas agrupadas por historia de usuario para implementación y prueba
independientes. Las tres historias son **P1** (MVP conjunto), pero se ordenan US3 (acceso) →
US1 (ver) → US2 (cancelar) por dependencia natural de datos.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia de usuario asociada (US1, US2, US3)
- Rutas de archivo exactas incluidas en cada descripción

## Path Conventions

Proyecto único Next.js (App Router) reutilizado de la 001. Rutas relativas a la raíz del repo:
`app/`, `src/`, `components/`, `tests/`.

## Contexto de propiedad (consumidor)

- **003 posee**: experiencia del portal (ver citas, estados vacíos, orden, cancelación con
  confirmación) y los endpoints `app/api/portal/...`.
- **005 posee** (consumido vía puertos en `src/portal/puertos.ts`): acceso `/p/[token]` y política
  de cancelación (24 h). Mientras 005 no exista, 003 usa **adaptadores provisionales** sobre la
  semilla, sustituibles sin tocar UI ni servicios de lectura.
- **001 posee** (reutilizado sin modificar): transición `reservada → cancelada` atómica e
  idempotente (`src/services/cambiar-estado.ts`), dominio `tiempo.ts`/`dinero.ts`, esquema Drizzle.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estructura base del portal reutilizando el proyecto existente. Sin dependencias nuevas.

- [x] T001 Crear la estructura de carpetas del portal: `src/portal/`, `components/portal/` y la ruta pública `app/p/[token]/` y `app/api/portal/[token]/` (directorios vacíos con `.gitkeep` si procede), según la sección "Project Structure" de `plan.md`
- [x] T002 [P] Verificar que no se añaden dependencias nuevas (Principio 4): confirmar que `next`, `drizzle-orm`, `zod`, `date-fns-tz` y `@radix-ui`/shadcn ya están en `package.json`; documentar cualquier ausencia como bloqueo (no instalar sin justificar en spec)
- [x] T003 [P] Confirmar que los scripts `typecheck`, `test`, `test:integration`, `test:e2e` de `package.json` cubren el portal (rutas `tests/unit`, `tests/integration`, `tests/e2e`); no modificar configuración salvo que falte cobertura de las rutas nuevas

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Puertos hacia 005, adaptadores provisionales, validación y utilidades de respuesta
que TODAS las historias necesitan.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase.

- [x] T004 [P] Definir los puertos consumidos de 005 en `src/portal/puertos.ts`: `ResultadoAcceso`, `PortalAccessGateway.resolverPaciente(token)`, `EvaluacionCancelacion`, `PoliticaCancelacion.evaluar(cita, ahora)` exactamente según `contracts/puertos-005.md` (sin implementar reglas, solo tipos/interfaces)
- [x] T005 [P] Añadir el esquema Zod de cancelación del portal en `src/validation/index.ts` (o módulo del portal): `{ citaId: string().uuid() }` que produce `DATOS_INCOMPLETOS` cuando falta/es inválido, coherente con `contracts/portal-cancelacion.md`
- [x] T006 Implementar el adaptador PROVISIONAL de acceso en `src/portal/acceso-desarrollo.ts` (implementa `PortalAccessGateway`): mapea token→paciente sobre la semilla usando una derivación de desarrollo **determinista y documentada** — el token de prueba es `dev-<pacienteId>` (prefijo fijo `dev-` + UUID del paciente de la semilla); `resolverPaciente` acepta ese formato y devuelve `{ ok:true, pacienteId, clinicaId }`, y devuelve `{ ok:false }` para token vacío/sin prefijo/`pacienteId` inexistente/manipulado, sin filtrar información (D3). Documentar este esquema como referencia para el `<token>` del quickstart. Marcar con comentario `PROVISIONAL — propiedad real: 005`. Depende de T004
- [x] T007 Implementar el adaptador PROVISIONAL de política en `src/portal/politica-desarrollo.ts` (implementa `PoliticaCancelacion`): `cancelable=true` solo si `estado==='reservada'` y faltan ≥24 h para `inicio`; si no, `cancelable=false` con `motivo` (`FUERA_DE_PLAZO`/`ESTADO_NO_RESERVADA`/`YA_PASADA`) y `telefonoClinica`. El umbral 24 h se materializa "según 005", sin constante propia de plazo en textos. Depende de T004
- [x] T008 [P] Verificar/reutilizar utilidades de respuesta de error en `app/api/_lib/respuestas.ts` (forma `{ error: { codigo, mensaje } }`, es-ES) y de formato de fecha/hora en `src/domain/tiempo.ts` (`formatearFechaHora` → "dd/MM/yyyy HH:mm", `Europe/Madrid`); no duplicar, solo referenciar desde el portal

**Checkpoint**: Puertos y adaptadores listos — las historias pueden empezar.

---

## Phase 3: User Story 3 - Acceso personal sin cuentas ni contraseñas (Priority: P1) 🎯 Base de acceso

**Goal**: Un paciente entra por `/p/[token]` (definido por 005, consumido por 003); un token
válido identifica al paciente, y un token inválido/manipulado/regenerado deniega el acceso con
mensaje neutro y sin mostrar dato alguno.

**Independent Test**: Abrir `/p/[token]` válido de la semilla y comprobar que se resuelve el
paciente; abrir un token inexistente/manipulado y comprobar acceso denegado neutro sin datos.

### Tests for User Story 3 ⚠️ (escribir primero, deben FALLAR)

- [x] T009 [P] [US3] Test unitario del adaptador de acceso en `tests/unit/portal-acceso.test.ts`: token válido→`{ ok:true, pacienteId, clinicaId }`; token vacío/inexistente/manipulado→`{ ok:false }`; regeneración simulada→antiguo `{ ok:false }`, nuevo `{ ok:true }` mismo `pacienteId`. Aseverar explícitamente que `resolverPaciente` acepta **solo** el token (sin segundo factor ni parámetro adicional), materializando FR-004/D7 (003 no añade postura de seguridad paralela) (contracts/puertos-005.md; FR-001..FR-004)
- [x] T010 [P] [US3] Test de integración de acceso denegado en `tests/integration/contract-portal-acceso.test.ts` contra PostgreSQL real: `GET /api/portal/<token-invalido>` → `404 ACCESO_DENEGADO` neutro, cuerpo sin citas ni datos y sin el token (contracts/portal-vista.md; FR-003, SC-005)

### Implementation for User Story 3

- [x] T011 [US3] Implementar el estado de acceso denegado en `app/p/[token]/acceso-denegado.tsx`: mensaje neutro es-ES ("No hemos podido abrir este enlace. Solicita uno nuevo a tu clínica."), sin datos personales (FR-003, D3)
- [x] T012 [US3] Cablear la resolución de identidad en `app/api/portal/[token]/route.ts` (parte de acceso): invocar `PortalAccessGateway.resolverPaciente(token)`; si `{ ok:false }` responder `404 ACCESO_DENEGADO` vía `app/api/_lib/respuestas.ts`, sin registrar el token. Depende de T006
- [x] T013 [US3] En `app/p/[token]/page.tsx` (Server Component), gestionar la denegación: si el acceso falla, renderizar `acceso-denegado.tsx` y no construir la vista (RD-4). Depende de T011, T012

**Checkpoint**: El acceso resuelve identidad o deniega de forma neutra; base lista para US1.

---

## Phase 4: User Story 1 - Ver mis citas futuras y pasadas (Priority: P1) 🎯 MVP

**Goal**: El paciente ve, en interfaz móvil limpia, "Próximas citas" (ascendente) e "Historial"
(descendente), cada cita con fecha/hora ES, profesional, servicio y estado, y ninguna de otro
paciente.

**Independent Test**: Con la semilla, abrir el portal de un paciente con futuras y pasadas y
comprobar los dos grupos, orden, campos y aislamiento por paciente.

### Tests for User Story 1 ⚠️ (escribir primero, deben FALLAR)

- [x] T014 [P] [US1] Test unitario en `tests/unit/portal-citas.test.ts`: agrupado futura/pasada por `inicio ≥ ahora` en `Europe/Madrid` (RD-1), orden ascendente de próximas y descendente de historial (FR-007), formato "dd/MM/yyyy HH:mm" es-ES (FR-006), y marca `cancelable` derivada de la política 005 (RD-2)
- [x] T015 [P] [US1] Test de integración en `tests/integration/contract-portal-vista.test.ts` contra PostgreSQL real: `GET /api/portal/<token>` devuelve `{ paciente, proximas[], historial[] }` con la forma de `contracts/portal-vista.md`, solo citas del paciente (aislamiento) y estados vacíos como `[]` (FR-005, FR-008, SC-001)

### Implementation for User Story 1

- [x] T016 [US1] Implementar el servicio de solo lectura en `src/portal/consultar-citas-paciente.ts`: leer `cita ⋈ servicio ⋈ profesional` filtrando por `pacienteId`/`clinicaId`, separar futuras/historial (RD-1), ordenar (FR-007), mapear a `CitaDelPortal` (id, inicioIso, fechaHoraTexto vía `tiempo.ts`, profesional, servicio, estado con `ETIQUETAS_ESTADO` de 001) y marcar `cancelable`/`telefonoClinica` (nombre de campo canónico según `contracts/portal-vista.md`; el `telefonoClinicaSiBloqueada` de data-model.md se materializa como `telefonoClinica` en la salida) con `PoliticaCancelacion` (data-model.md). Depende de T007, T008
- [x] T017 [US1] Completar `app/api/portal/[token]/route.ts` (GET): tras resolver acceso (T012), invocar `consultar-citas-paciente` y devolver `VistaPortal` (`200`) según `contracts/portal-vista.md`. Depende de T012, T016
- [x] T018 [P] [US1] Implementar `components/portal/tarjeta-cita.tsx`: presenta una `CitaDelPortal` (fecha/hora ES, profesional, servicio, etiqueta de estado), accesible y sin jerga (FR-006, FR-018)
- [x] T019 [P] [US1] Implementar `components/portal/lista-citas.tsx`: renderiza los grupos "Próximas citas" e "Historial" con `tarjeta-cita`, incluyendo estados vacíos claros es-ES (FR-005, FR-008). Depende de T018
- [x] T020 [US1] Completar la vista en `app/p/[token]/page.tsx`: cuando el acceso es válido, obtener la `VistaPortal` y renderizar `lista-citas`, con diseño responsive prioridad móvil y textos es-ES (FR-005, FR-006, FR-018, FR-019). Depende de T013, T017, T019

**Checkpoint**: US1 funcional e independiente — MVP de lectura entregable.

---

## Phase 5: User Story 2 - Cancelar una cita futura (Priority: P1)

**Goal**: Desde el portal, el paciente cancela una cita futura cancelable (política 005) con
confirmación explícita; la transición y liberación del hueco las realiza 001; los reintentos son
idempotentes.

**Independent Test**: Con la semilla, cancelar una cita "reservada" a ≥24 h y verificar "cancelada"
+ hueco libre; comprobar que dentro de ventana no se ofrece cancelar (muestra teléfono) y que un
segundo intento no produce cambios.

### Tests for User Story 2 ⚠️ (escribir primero, deben FALLAR)

- [x] T021 [P] [US2] Test unitario en `tests/unit/portal-cancelacion.test.ts`: elegibilidad `cancelable` (estado + ventana 005) y mapeo de resultados de 001 a mensajes del portal (`TRANSICION_INVALIDA` → "esta cita ya no puede cancelarse"); textos de plazo derivados de la política, sin constante "24 horas" propia (FR-011, FR-012, FR-014, 005 FR-012)
- [x] T022 [P] [US2] Test de integración de cancelación en `tests/integration/contract-portal-cancelacion.test.ts` contra PostgreSQL real: flujo feliz `POST /api/portal/<token>/cancelar` `{citaId}` → `200 {estado:"cancelada"}` y hueco liberado; casos `404 ACCESO_DENEGADO`, `404 CITA_NO_EXISTE` (cita de otro paciente), `409 FUERA_DE_PLAZO` (con `telefonoClinica`), `400 DATOS_INCOMPLETOS` (contracts/portal-cancelacion.md; FR-009, FR-010, SC-003, SC-004)
- [x] T023 [P] [US2] Test de integración de idempotencia/concurrencia en `tests/integration/portal-cancelacion-concurrencia.test.ts`: doble cancelación y carrera portal↔recepción sobre la misma cita → exactamente una cancelación efectiva, la segunda `409 TRANSICION_INVALIDA`, ningún estado imposible, apoyándose en la garantía de 001 (FR-014, FR-015, SC-006; Principio 3)

### Implementation for User Story 2

- [x] T024 [US2] Implementar la orquestación en `src/portal/cancelar-desde-portal.ts`: (1) resolver acceso (005); (2) cargar cita y comprobar pertenencia al paciente (si no, `CITA_NO_EXISTE`); (3) `PoliticaCancelacion.evaluar` (005) → si no cancelable `FUERA_DE_PLAZO` con teléfono; (4) invocar `cambiarEstado(clinicaId, citaId, 'cancelada')` de 001; (5) traducir resultado. NO reimplementa transición ni concurrencia (data-model.md RD-3, research.md D5). Depende de T006, T007
- [x] T025 [US2] Implementar `app/api/portal/[token]/cancelar/route.ts` (POST): validar cuerpo con el esquema Zod (T005) → `400 DATOS_INCOMPLETOS`; delegar en `cancelar-desde-portal`; mapear errores a `404/409` según `contracts/portal-cancelacion.md`; nunca registrar el token. Depende de T024, T005
- [x] T026 [P] [US2] Implementar `components/portal/cancelar-cita.tsx`: diálogo de confirmación explícita (FR-013) que solo tras confirmar invoca `POST .../cancelar`; muestra mensaje de éxito, de "ya no puede cancelarse" (idempotencia) y, cuando `cancelable=false` por ventana, el teléfono de la clínica en lugar del botón (FR-011, FR-012, FR-018). Depende de T018
- [x] T027 [US2] Integrar la acción de cancelar en la vista: en `components/portal/tarjeta-cita.tsx`/`lista-citas.tsx` mostrar `cancelar-cita` solo para citas `cancelable=true` y el teléfono para las bloqueadas por ventana; recargar/actualizar el estado tras cancelar (FR-009, FR-012). Depende de T020, T026

**Checkpoint**: US1 + US2 + US3 funcionan de forma independiente — MVP completo del portal.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accesibilidad, responsive, e2e de extremo a extremo y validación del quickstart.

- [x] T028 [P] E2E ver citas en `tests/e2e/portal-ver-citas.spec.ts` (Playwright): abrir portal de la semilla, verificar grupos, orden, campos y aislamiento (V1 del quickstart; SC-001)
- [x] T029 [P] E2E cancelar en `tests/e2e/portal-cancelar.spec.ts`: cancelar dentro de plazo (V2) **aseverando que el flujo se completa en ≤3 interacciones** (abrir cita → pulsar cancelar → confirmar, SC-002), bloqueo dentro de ventana con teléfono (V3), idempotencia/segundo intento (V5), estados vacíos (V6) (SC-002, SC-003, SC-004, SC-006)
- [x] T030 [P] E2E accesibilidad y responsive en `tests/e2e/portal-accesibilidad.spec.ts`: ejes de accesibilidad (contraste/tamaños) y viewports móvil/escritorio; acceso denegado neutro (V4) (FR-018, SC-005, SC-007)
- [x] T031 [P] Verificar formato ES inequívoco (fechas/horas) en textos del portal y ausencia de cualquier plazo escrito distinto de la política de 005 (FR-019, SC-008, 005 FR-012)
- [x] T032 Ejecutar la validación completa de `specs/003-portal-paciente/quickstart.md` (V1–V6) y `npm run test:all` en verde como puerta de merge (Principio 6)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias
- **US3 (Phase 3)**: depende de Foundational (necesita el adaptador de acceso T006)
- **US1 (Phase 4)**: depende de Foundational; su endpoint GET (T017) integra la resolución de acceso de US3 (T012)
- **US2 (Phase 5)**: depende de Foundational; su UI (T027) integra la vista de US1 (T020)
- **Polish (Phase 6)**: depende de US1–US3 completas

### User Story Dependencies

- **US3 (P1)**: primera por dependencia de datos (sin acceso, no hay paciente que mostrar)
- **US1 (P1)**: usa la resolución de acceso; independientemente testable con la semilla
- **US2 (P1)**: usa la vista de US1 para ubicar la acción; independientemente testable

### Within Each User Story

- Tests escritos y en FALLO antes de implementar
- Servicios antes de endpoints; endpoints antes de UI
- Historia completa antes de pasar a la siguiente

### Parallel Opportunities

- Setup: T002 y T003 en paralelo
- Foundational: T004, T005, T008 en paralelo; luego T006 y T007 en paralelo
- Cada historia: sus tests marcados [P] en paralelo; componentes UI en archivos distintos [P]
- Polish: T028–T031 en paralelo

---

## Parallel Example: User Story 1

```bash
# Tests de US1 juntos (deben fallar primero):
Task: "Test unitario de agrupado/orden/formato en tests/unit/portal-citas.test.ts"
Task: "Test de integración de la vista en tests/integration/contract-portal-vista.test.ts"

# Componentes de UI de US1 en paralelo (archivos distintos):
Task: "components/portal/tarjeta-cita.tsx"
Task: "components/portal/lista-citas.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → 2. Phase 2 (Foundational) → 3. Phase 3 (US3 acceso) →
4. Phase 4 (US1 ver) → **VALIDAR** V1/V4 → 5. Phase 5 (US2 cancelar) → **VALIDAR** V2/V3/V5.

Las tres historias son P1: el MVP entregable mínimo es US3 + US1 (ver citas con acceso); US2
completa el valor (eliminar llamadas de cancelación).

### Incremental Delivery

1. Setup + Foundational → base lista
2. + US3 → acceso resuelto/denegado
3. + US1 → ver citas (demo)
4. + US2 → cancelar (demo completa)
5. Polish → accesibilidad, e2e, quickstart

---

## Notes

- [P] = archivos distintos, sin dependencias
- 003 nunca fija reglas de 005 (acceso/umbral) ni de 001 (transición/concurrencia): las consume
- El token opaco no se registra en claro ni aparece en errores (D3)
- Verificar que los tests fallan antes de implementar; commit tras cada tarea o grupo lógico
