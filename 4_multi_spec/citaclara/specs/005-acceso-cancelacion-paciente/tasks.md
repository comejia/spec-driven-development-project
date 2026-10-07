# Tasks: Acceso y cancelación del paciente (005)

**Input**: Design documents from `/specs/005-acceso-cancelacion-paciente/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDOS y obligatorios. La constitución (Principio 6: los tests acompañan a la spec;
suite verde como condición de merge) y el quickstart (prueba hostil de concurrencia V9) los exigen.

**Organization**: tareas agrupadas por historia de usuario (US1, US2, US3), todas P1, para
implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece la tarea (US1, US2, US3)
- Rutas de archivo exactas incluidas en cada descripción

## Path Conventions

Aplicación web en un único proyecto Next.js (ver plan.md): `app/` (App Router + Route Handlers),
`src/` (dominio, servicios, db, validación, semilla), `tests/` (unit, integration, e2e) en la raíz.

## Contexto de dependencia con 001

La 005 **no** reimplementa el ciclo de vida de la cita: la cancelación **invoca**
`cambiarEstado(clinicaId, citaId, 'cancelada')` de la 001 (`src/services/cambiar-estado.ts`), que
libera el hueco y aporta atomicidad/idempotencia. El invariante anti-solape de 001 (restricciones
de exclusión) permanece intacto y se reutiliza para validar el hueco liberado.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar el entorno; no hay dependencias nuevas respecto a la 001.

- [X] T001 Verificar entorno de la 001 operativo (Node 22, PostgreSQL 16 con `btree_gist`, `.env.local`) ejecutando `npm install` y `npm run typecheck` en la raíz del proyecto
- [X] T002 [P] Confirmar que lint y formato pasan con `npm run lint` y `npm run format:check` antes de empezar

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema, migraciones, validación, dominio de política y semilla que TODAS las
historias necesitan.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase.

- [X] T003 Añadir la tabla `acceso_paciente` (1:1 con `paciente`: `id`, `paciente_id` único FK, `token` texto único, `creado_en` timestamptz) en `src/db/schema.ts`, con tipos `AccesoPaciente` exportados (data-model.md)
- [X] T004 Añadir la columna de contacto `telefono` (texto) a la tabla `clinica` en `src/db/schema.ts` (FR-008, data-model.md; atributo consumido de la entidad de 001)
- [X] T005 Generar y revisar la migración con `npm run db:generate`; asegurar índice único sobre `acceso_paciente.token` y único sobre `paciente_id` en `src/db/migrations/`
- [X] T006 [P] Añadir helper de generación de token opaco (`node:crypto` `randomBytes(32)` → base64url) en `src/domain/token.ts` (research D2)
- [X] T007 [P] Implementar la función pura de política de cancelación `decidirCancelacion(inicio, estado, ahora)` → `{ ofrecerCancelar, permitirCancelar, motivoBloqueo }` con umbral de 24 h (24 h exactas = cancelable) en `src/domain/politica-cancelacion.ts` (FR-007/008/009, data-model.md, research D5)
- [X] T008 [P] Añadir esquemas Zod (`tokenSchema`, `cancelarPorPacienteSchema` con `citaId`) en `src/validation/index.ts`
- [X] T009 Añadir el código de error `FUERA_DE_PLAZO` (403, mensaje es-ES que remite al teléfono de la clínica) al catálogo en `src/domain/errores.ts` (contracts/cancelacion.md, FR-008)
- [X] T010 Extender la semilla determinista para asignar un `token` estable por paciente (en `acceso_paciente`) y un `telefono` por clínica en `src/seed/seed.ts` y sus datos en `src/seed/datos.ts` (Principio 5, research D9)

**Checkpoint**: esquema + política + semilla listos; las historias pueden empezar (en paralelo).

---

## Phase 3: User Story 1 - Acceso del paciente por enlace personal (Priority: P1) 🎯 MVP

**Goal**: un token opaco por paciente da acceso, vía `/p/[token]`, únicamente a las citas de ese
paciente; token inexistente/manipulado → denegación neutra; token regenerado invalida el anterior.

**Independent Test**: con la semilla, abrir `/p/[token]` de un paciente → ve solo sus citas; abrir
un token inexistente/alterado → denegación neutra; tras regenerar, el enlace viejo falla y el nuevo
da acceso a las mismas citas.

### Tests for User Story 1 ⚠️ (escribir primero, deben FALLAR antes de implementar)

- [X] T011 [P] [US1] Test de integración de acceso por token (válido, inexistente, manipulado, aislamiento entre pacientes, regeneración) contra PostgreSQL real en `tests/integration/contract-acceso-paciente.test.ts` (FR-001/002/003/004, SC-001/002/003)
- [X] T012 [P] [US1] Test unitario de generación/formato del token opaco en `tests/unit/token.test.ts` (research D2)

### Implementation for User Story 1

- [X] T013 [US1] Implementar el servicio de acceso: `resolverToken(token)` → paciente + `clinicaId`; `listarCitasDePaciente(pacienteId)`; `regenerarToken(clinicaId, pacienteId)` en `src/services/acceso-paciente.ts` (FR-001/002/003/004, data-model.md, research D3/D7) — depende de T003, T006, T008
- [X] T014 [US1] Implementar la página pública `app/p/[token]/page.tsx`: resuelve el token, lista las citas del paciente ordenadas por inicio (formato es-ES, `Europe/Madrid`), y en token inválido muestra la vista neutra de "enlace no válido" (FR-002/003/005/006/013, D4) — depende de T013, T007
- [X] T015 [US1] Aplicar `decidirCancelacion` por cita en la vista para calcular `ofrecerCancelar`/`motivoBloqueo` y mostrar el teléfono de la clínica cuando no se ofrece cancelar (FR-008) — depende de T014, T007

**Checkpoint**: US1 funcional y testeable de forma independiente (acceso + listado + denegación neutra).

---

## Phase 4: User Story 2 - Cancelación por el paciente dentro de plazo (Priority: P1)

**Goal**: desde `/p/[token]`, el paciente cancela una cita `reservada` con ≥ 24 h de antelación; la
cita pasa a `cancelada` (transición de 001) y el hueco queda libre; concurrencia → una sola
cancelación efectiva.

**Independent Test**: cita `reservada` a 25 h → cancelar desde el enlace → queda `cancelada` y el
hueco admite una nueva cita; dos cancelaciones simultáneas → exactamente una efectiva.

### Tests for User Story 2 ⚠️ (escribir primero, deben FALLAR antes de implementar)

- [X] T016 [P] [US2] Test de integración de cancelación dentro de plazo + liberación de hueco (crear nueva cita en el hueco liberado) contra PostgreSQL real en `tests/integration/cancelacion-paciente.test.ts` (FR-010, SC-004/005) — reutiliza el invariante de 001
- [X] T017 [P] [US2] Test de integración de concurrencia: dos cancelaciones simultáneas sobre la misma cita → una `cancelada`, la otra `TRANSICION_INVALIDA` (prueba hostil V9) en `tests/integration/cancelacion-concurrencia.test.ts` (FR-011, SC-006, Principio 3/6)
- [X] T018 [P] [US2] Test unitario de la política para el caso "cancelable" (estado `reservada` y ≥ 24 h, incluido el límite exacto de 24 h) en `tests/unit/politica-cancelacion.test.ts` (FR-007)

### Implementation for User Story 2

- [X] T019 [US2] Implementar el servicio `cancelarPorPaciente(token, citaId)`: resuelve token, verifica pertenencia de la cita al paciente (FR-003), aplica `decidirCancelacion` y delega en `cambiarEstado` de 001 en `src/services/cancelar-por-paciente.ts` (FR-009/010/011, research D6) — depende de T013, T007, T008
- [X] T020 [US2] Implementar el endpoint `POST app/api/p/[token]/cancelar/route.ts`: valida `citaId`, invoca el servicio y traduce errores de negocio a HTTP (`{ error: { codigo, mensaje } }`); éxito → `{ cita: { id, estado: 'cancelada' } }` (contracts/cancelacion.md) — depende de T019
- [X] T021 [US2] Conectar la acción de cancelar en `app/p/[token]/page.tsx` (botón visible solo cuando `ofrecerCancelar`), con confirmación y refresco tras cancelar; mensaje "ya no procede" ante `TRANSICION_INVALIDA` (FR-011) — depende de T020, T015

**Checkpoint**: US1 y US2 funcionan de forma independiente; el hueco se libera vía 001.

---

## Phase 5: User Story 3 - Bloqueo de cancelación dentro de la ventana (Priority: P1)

**Goal**: a < 24 h del inicio (o cita ya iniciada/pasada, o estado no `reservada`), el enlace NO
ofrece cancelar y muestra el teléfono de la clínica; un intento directo se rechaza.

**Independent Test**: cita a 23 h → la vista no ofrece cancelar y muestra el teléfono; forzar la
cancelación → `FUERA_DE_PLAZO` sin cambios; cita ya pasada → mismo bloqueo.

### Tests for User Story 3 ⚠️ (escribir primero, deben FALLAR antes de implementar)

- [X] T022 [P] [US3] Test unitario de la política para los casos bloqueados (< 24 h `fuera_de_plazo`, ya iniciada/pasada `ya_iniciada`, estado no `reservada` `estado_no_cancelable`, y el borde 23 h 59 min) en `tests/unit/politica-cancelacion.test.ts` (FR-008/009, edge cases) — mismo archivo que T018, ejecutar tras él
- [X] T023 [P] [US3] Test de integración: intento directo de cancelar fuera de plazo o sobre estado no `reservada` → rechazo sin cambios en `tests/integration/cancelacion-paciente.test.ts` (FR-008/009) — mismo archivo que T016, ejecutar tras él

### Implementation for User Story 3

- [X] T024 [US3] Verificar/ajustar en `app/p/[token]/page.tsx` que, cuando `ofrecerCancelar` es falso, se muestra el teléfono de la clínica y el mensaje según `motivoBloqueo`, sin botón de cancelar (FR-008) — depende de T015
- [X] T025 [US3] Verificar/ajustar en `src/services/cancelar-por-paciente.ts` que un intento directo fuera de plazo o sobre estado no `reservada` lanza el error de negocio adecuado (`FUERA_DE_PLAZO` / `TRANSICION_INVALIDA`) sin invocar la transición (FR-008/009) — depende de T019

**Checkpoint**: las tres historias funcionan de forma independiente; política única de 24 h coherente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: coherencia de textos, accesibilidad, E2E y validación final.

- [X] T026 [P] Test E2E de `/p/[token]` (listado, cancelar dentro de plazo, bloqueo + teléfono dentro de la ventana, ejes de accesibilidad y responsive móvil) en `tests/e2e/portal-paciente.spec.ts` (FR-013, SC-008; patrón de `tests/e2e/apoyo.ts`)
- [X] T027 [P] Revisar coherencia de textos de política (todos comunican 24 h; dentro de la ventana remiten al teléfono) en la vista y el catálogo de errores (FR-012, SC-007)
- [X] T028 Actualizar `specs/005-acceso-cancelacion-paciente/` con un `trazabilidad.md` que mapee FR/SC → tests (paridad con 001) — depende de T011–T023, T026
- [X] T029 Ejecutar la suite completa `npm run test:all` (unit + integración + e2e) y `npm run typecheck`/`npm run lint`; dejar todo en verde (condición de merge, Principio 6)
- [X] T030 Ejecutar la validación del `quickstart.md` (V1–V12) contra la semilla determinista y confirmar cada escenario

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato.
- **Foundational (Phase 2)**: depende del Setup — BLOQUEA todas las historias.
- **User Stories (Phase 3–5)**: dependen de Foundational; luego pueden ir en paralelo o en orden.
- **Polish (Phase 6)**: depende de que las historias deseadas estén completas.

### User Story Dependencies

- **US1 (P1)**: tras Foundational. Sin dependencias de otras historias (base de acceso/vista).
- **US2 (P1)**: tras Foundational. Reutiliza el servicio de acceso de US1 (T013) y la vista (T015);
  es testeable de forma independiente por sus tests de integración.
- **US3 (P1)**: tras Foundational. Comparte la vista (T015) y el servicio de cancelación (T019) con
  US2; su comportamiento (bloqueo) es independientemente testeable.

### Within Each User Story

- Tests primero (deben fallar) → servicio → endpoint/vista → integración de UI.
- Modelos/entidades (Fase 2) antes que servicios; servicios antes que endpoints.

### Parallel Opportunities

- Fase 1: T002 en paralelo con T001 tras `npm install`.
- Fase 2: T006, T007, T008 en paralelo (archivos distintos); T003/T004 preceden a T005 y T010.
- US1: T011 y T012 en paralelo (tests). US2: T016, T017, T018 en paralelo. US3: T022, T023 en paralelo.
- Fase 6: T026 y T027 en paralelo.
- Nota de coordinación de archivos: T018 y T022 tocan `tests/unit/politica-cancelacion.test.ts`
  (secuenciar); T016 y T023 tocan `tests/integration/cancelacion-paciente.test.ts` (secuenciar).

---

## Parallel Example: User Story 2

```bash
# Lanzar los tests de US2 juntos (deben fallar antes de implementar):
Task: "Integración: cancelación + liberación de hueco en tests/integration/cancelacion-paciente.test.ts"
Task: "Integración: concurrencia (una sola cancelación) en tests/integration/cancelacion-concurrencia.test.ts"
Task: "Unitario: política caso cancelable en tests/unit/politica-cancelacion.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Setup) y Fase 2 (Foundational: tabla, política, semilla).
2. Completar Fase 3 (US1: acceso por token + vista + denegación neutra).
3. **PARAR y VALIDAR**: probar US1 de forma independiente (V1–V3 del quickstart).

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → probar → demo (MVP: acceso del paciente).
3. US2 → probar (incluida concurrencia) → demo (cancelación dentro de plazo).
4. US3 → probar → demo (bloqueo dentro de la ventana; política única completa).
5. Polish → E2E, coherencia de textos, trazabilidad, suite verde.

### Nota de propiedad (multiagente)

- La transición `reservada → cancelada` y la liberación del hueco son de **001**: aquí solo se
  invocan (no modificar `src/services/cambiar-estado.ts` ni la tabla `cita`).
- La columna `clinica.telefono` es un atributo de la entidad de 001 que 005 consume; coordinar con
  el propietario de 001 si cambia su semántica.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- Cada historia es completable y testeable de forma independiente.
- Verificar que los tests fallan antes de implementar (Principio 6).
- Hacer commit tras cada tarea o grupo lógico.
- La prueba hostil de concurrencia (T017) es obligatoria por su relación con el ciclo de vida de 001.
