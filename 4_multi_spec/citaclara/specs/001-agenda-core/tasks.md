# Tasks: Núcleo de Agenda

**Input**: Design documents from `/specs/001-agenda-core/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDOS y obligatorios. La constitución (Principio 6) exige que cada regla de
negocio y criterio de aceptación relevante tenga su test que la referencia, y la suite en verde
es condición de merge. Los tests de RN1 (anti-solape) son obligatorios en toda tarea que escriba
en la agenda (Principio 3).

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y prueba
independientes, y trabajo en paralelo por varios agentes (objetivo del proyecto).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1..US4 según spec.md; Setup/Foundational/Polish sin etiqueta de historia
- Rutas exactas relativas a la raíz del proyecto CitaClara

## Path Conventions

Aplicación web Next.js en un único proyecto (ver plan.md → Structure Decision): `app/`, `src/`,
`components/`, `tests/` en la raíz.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el proyecto y el tooling.

- [X] T001 Inicializar proyecto Next.js 15 (App Router, React 19, TypeScript 5) con `app/layout.tsx` en español (es-ES) y estructura de carpetas de plan.md (`app/`, `src/`, `components/`, `tests/`)
- [X] T002 [P] Añadir y configurar Tailwind CSS 4 y shadcn/ui (Radix) en `components/ui/` y estilos globales en `app/globals.css`
- [X] T003 [P] Configurar ESLint + Prettier y scripts de lint/format en `package.json`
- [X] T004 [P] Configurar Vitest (unit/integration) y Playwright (e2e) con directorios `tests/unit`, `tests/integration`, `tests/e2e` y scripts `test`, `test:e2e`
- [X] T005 [P] Configurar Drizzle ORM y drizzle-kit con la cadena de conexión a PostgreSQL en `src/db/` y variables de entorno en `.env.example`

**Checkpoint**: Proyecto arranca, tooling y test runners listos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura común que DEBE existir antes de cualquier historia. Aquí se ancla el
invariante capital (Principio 3) en el esquema.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase.

- [X] T006 Habilitar la extensión `btree_gist` y definir el esquema base en `src/db/schema.ts`: tablas clínica, profesional, servicio, paciente, cita y el enum de estado (data-model.md)
- [X] T007 Añadir a `src/db/schema.ts` las restricciones capitales: `EXCLUDE USING gist` por profesional y por paciente sobre `franja` filtradas a estados activos (FR-010/011/012a), `UNIQUE (clinica_id, telefono)` (FR-004a) y el `CHECK` de granularidad de 5 min (FR-005a)
- [X] T008 Generar y aplicar la migración inicial con drizzle-kit desde `src/db/schema.ts` a `src/db/migrations/`
- [X] T009 [P] Implementar utilidades de dominio de dinero (enteros de céntimos + formato es-ES) en `src/domain/dinero.ts` (FR-019, D2)
- [X] T010 [P] Implementar utilidades de tiempo (zona `Europe/Madrid`, granularidad de 5 min, formato es-ES) en `src/domain/tiempo.ts` (FR-005a/019, D3)
- [X] T011 [P] Implementar detección de solape de intervalos `[inicio, fin)` en `src/domain/solape.ts` (FR-012)
- [X] T012 [P] Definir esquemas Zod compartidos (cita, paciente, acceso, agenda) en `src/validation/` (contracts/)
- [X] T013 Implementar middleware/guard de sesión de clínica y manejo de errores es-ES `{codigo,mensaje}` en `src/services/session.ts` y `app/api/_lib/`
- [X] T014 [P] Tests unitarios de fundamentos en `tests/unit/`: dinero (`dinero.test.ts`), tiempo/granularidad (`tiempo.test.ts`), solape de intervalos (`solape.test.ts`) — referencian FR-019, FR-005a, FR-012

**Checkpoint**: Esquema con invariante anti-solape aplicado; dominio base probado. Las historias pueden empezar en paralelo.

---

## Phase 3: User Story 1 - Alta de cita sin solapes (Priority: P1) 🎯 MVP

**Goal**: La recepción da de alta una cita (profesional + servicio + paciente + inicio); el fin se
deriva y solo se registra si no hay solape (RN1) ni está en el pasado (RN2).

**Independent Test**: Crear una cita en hueco libre (éxito) y otra que solape una activa del mismo
profesional (rechazo), incluida la prueba de concurrencia del mismo hueco.

### Tests for User Story 1 (obligatorios — Principios 3 y 6) ⚠️

> Escribir estos tests PRIMERO y verificar que FALLAN antes de implementar.

- [X] T015 [P] [US1] Test de integración contra PostgreSQL real (Testcontainers) del alta válida y del cálculo de fin en `tests/integration/citas-alta.test.ts` (FR-005/005a/006/007)
- [X] T016 [P] [US1] Test hostil de anti-solape del profesional: solape parcial, total, contención y adyacente-no-solapa en `tests/integration/citas-solape-profesional.test.ts` (FR-010/012)
- [X] T017 [P] [US1] Test hostil de **concurrencia**: dos altas simultáneas del mismo hueco → exactamente una queda, en `tests/integration/citas-concurrencia.test.ts` (RN1, FR-011)
- [X] T018 [P] [US1] Test de anti-solape del paciente entre profesionales en `tests/integration/citas-solape-paciente.test.ts` (FR-012a)
- [X] T019 [P] [US1] Test de RN2 (cita en el pasado rechazada) y de datos incompletos/paciente inexistente en `tests/integration/citas-validacion.test.ts` (FR-013/014)
- [X] T020 [P] [US1] Contract test de `POST /api/citas` (códigos 201 y errores 400/404/409/422) en `tests/integration/contract-citas.test.ts` (contracts/citas.md)

### Implementation for User Story 1

- [X] T021 [US1] Implementar el caso de uso "crear cita" en `src/services/crear-cita.ts`: valida entrada (Zod), granularidad, RN2 y existencia de paciente; deriva fin/franja; inserta y traduce la violación de exclusión a `409 SOLAPE_PROFESIONAL`/`SOLAPE_PACIENTE` (FR-005..FR-014)
- [X] T022 [US1] Implementar `POST /api/citas` en `app/api/citas/route.ts` usando el servicio y el guard de sesión (contracts/citas.md)
- [X] T023 [US1] Implementar el formulario de alta de cita (selección de profesional, servicio, paciente e inicio) en `components/cita-nueva.tsx` con mensajes de error es-ES sin jerga (FR-020)
- [X] T024 [US1] Integrar el alta en la pantalla de agenda `app/(panel)/agenda/page.tsx` (acción "nueva cita")

**Checkpoint**: US1 funcional y probada de forma independiente; MVP mínimo alcanzable junto a US2.

---

## Phase 4: User Story 2 - Agenda del día por profesional (Priority: P1)

**Goal**: La recepción ve la agenda de un profesional para un día, con huecos ocupados y libres en
la franja 08:00–21:00, solo del profesional elegido.

**Independent Test**: Con la semilla, abrir la agenda de María en un día con citas y comprobar el
orden cronológico, libre vs. ocupado y que no aparecen citas de otros profesionales.

### Tests for User Story 2 (obligatorios — Principio 6) ⚠️

- [X] T025 [P] [US2] Contract test de `GET /api/agenda` (solo citas del profesional, orden, franja 08:00–21:00) en `tests/integration/contract-agenda.test.ts` (contracts/agenda.md, FR-015/016/016a)
- [X] T026 [P] [US2] Test e2e de la agenda del día (ocupado/libre, aislamiento por profesional) en `tests/e2e/agenda-dia.spec.ts` (US2, SC-006)

### Implementation for User Story 2

- [X] T027 [US2] Implementar consulta de agenda del día en `src/services/consultar-agenda.ts` (filtra por profesional y fecha en `Europe/Madrid`, ordena por inicio) (FR-015/016)
- [X] T028 [US2] Implementar `GET /api/agenda` en `app/api/agenda/route.ts` (contracts/agenda.md)
- [X] T029 [US2] Implementar la vista de agenda del día con franja fija 08:00–21:00 y distinción libre/ocupado en `components/agenda-dia.tsx` (FR-016a, Principio 7)
- [X] T030 [US2] Montar la página `app/(panel)/agenda/page.tsx` con selector de profesional y fecha (responsive, accesible)

**Checkpoint**: US1 + US2 forman el MVP operativo (alta + vista diaria).

---

## Phase 5: User Story 3 - Marcar estado de la cita (Priority: P2)

**Goal**: La recepción marca una cita como completada, cancelada o no asistida, solo desde
`reservada`.

**Independent Test**: Aplicar cada transición válida desde `reservada` y comprobar que las
transiciones desde estados finales se rechazan.

### Tests for User Story 3 (obligatorios — Principio 6) ⚠️

- [X] T031 [P] [US3] Test unitario de la máquina de estados (transiciones válidas e inválidas) en `tests/unit/estado-cita.test.ts` (FR-008/009)
- [X] T032 [P] [US3] Contract test de `POST /api/citas/{id}/estado` (200 y 409 TRANSICION_INVALIDA) en `tests/integration/contract-estado.test.ts` (contracts/citas.md)
- [X] T033 [P] [US3] Test de integración: tras cancelar/no_asistida el hueco se libera y admite nueva cita en `tests/integration/estado-libera-hueco.test.ts` (FR-010 nota, US1 §4)

### Implementation for User Story 3

- [X] T034 [P] [US3] Implementar la máquina de estados en `src/domain/cita.ts` (solo desde `reservada`) (FR-008/009)
- [X] T035 [US3] Implementar el caso de uso "cambiar estado" en `src/services/cambiar-estado.ts`
- [X] T036 [US3] Implementar `POST /api/citas/{id}/estado` en `app/api/citas/[id]/estado/route.ts` (contracts/citas.md)
- [X] T037 [US3] Añadir acciones de estado (completada/cancelada/no asistida) en `components/agenda-dia.tsx` con confirmación clara (Principio 7)

**Checkpoint**: US1–US3 funcionales de forma independiente.

---

## Phase 6: User Story 4 - Acceso con clave de clínica (Priority: P2)

**Goal**: La recepción accede al panel con la clave de la clínica; sin clave correcta no se ve
ninguna agenda.

**Independent Test**: Acceder con clave correcta (concede) y con clave incorrecta/vacía (deniega).

### Tests for User Story 4 (obligatorios — Principio 6) ⚠️

- [X] T038 [P] [US4] Contract test de `POST /api/acceso` (200 con cookie, 401 CLAVE_INVALIDA) en `tests/integration/contract-acceso.test.ts` (contracts/acceso.md, FR-018)
- [X] T039 [P] [US4] Test e2e de acceso concedido/denegado y protección de rutas de agenda en `tests/e2e/acceso.spec.ts` (US4)

### Implementation for User Story 4

- [X] T040 [US4] Implementar validación de clave contra hash (argon2/bcrypt) y apertura de sesión en `src/services/acceso.ts` (FR-018, D5)
- [X] T041 [US4] Implementar `POST /api/acceso` y `POST /api/acceso/salir` en `app/api/acceso/route.ts` (cookie HTTP-only) (contracts/acceso.md)
- [X] T042 [US4] Implementar la pantalla de acceso en `app/(panel)/acceso/page.tsx` y proteger `(panel)/agenda` con el guard de sesión (T013)

**Checkpoint**: Las cuatro historias funcionan de forma independiente.

---

## Phase 7: Pacientes (soporte transversal a US1)

**Purpose**: Fichas de paciente necesarias para el alta de cita; unicidad de teléfono.

- [X] T043 [P] Contract test de `POST /api/pacientes` (201, 409 TELEFONO_DUPLICADO) y `GET /api/pacientes?buscar=` en `tests/integration/contract-pacientes.test.ts` (contracts/pacientes.md, FR-004/004a)
- [X] T044 Implementar caso de uso de alta/búsqueda de paciente en `src/services/pacientes.ts` (unicidad de teléfono por clínica)
- [X] T045 Implementar `POST /api/pacientes` y `GET /api/pacientes` en `app/api/pacientes/route.ts` (contracts/pacientes.md)

---

## Phase 8: Semilla determinista (Principio 5)

**Purpose**: Datos de demostración reproducibles que specs, ejemplos y analítica pueden citar.

- [X] T046 Implementar la semilla determinista (PRNG sembrado) en `src/seed/seed.ts`: Clínica Eleva, 3 profesionales, 4 servicios con precios en céntimos, ~40 pacientes con teléfonos únicos, 8 semanas pasadas (~10% no asistencia, ~8% cancelaciones) y 2 semanas futuras, sin solapes (FR-021, D6)
- [X] T047 [P] Test de reproducibilidad: re-seed con la misma semilla produce la misma historia en `tests/integration/seed-determinista.test.ts` (SC-007)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Calidad transversal y validación final.

- [X] T048 [P] Comprobaciones de accesibilidad y responsive (contraste, tamaños, portátil/móvil) con Playwright en `tests/e2e/accesibilidad.spec.ts` (Principio 7, SC-005/006/008)
- [X] T049 [P] Test e2e de exactitud de presentación: importes al céntimo en es-ES y fechas/horas 24h inequívocas en `tests/e2e/formato-es.spec.ts` (FR-019, SC-004)
- [X] T050 Ejecutar la validación completa de `quickstart.md` (V1–V12) y dejar constancia
- [X] T051 [P] Verificar la suite completa en verde como condición de merge y documentar la trazabilidad FR/RN→test (Principio 6)
- [X] T052 [P] Test e2e que verifica que el alta de una cita válida se completa en ≤ 5 interacciones sin pasos técnicos en `tests/e2e/alta-flujo.spec.ts` (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias.
- **Foundational (Fase 2)**: depende de Setup; BLOQUEA todas las historias. T006→T007→T008 en orden; T009–T012, T014 en paralelo tras T006.
- **US1 (Fase 3)** y **US2 (Fase 4)** (ambas P1): tras Foundational; independientes entre sí (US2 solo lee, US1 escribe).
- **US3 (Fase 5)** y **US4 (Fase 6)** (P2): tras Foundational; independientes.
- **Pacientes (Fase 7)**: necesaria para probar el alta de US1 con fichas reales; puede ir en paralelo con US2/US3/US4 tras Foundational.
- **Semilla (Fase 8)**: tras el esquema (Fase 2) y las entidades; alimenta pruebas e2e de US2.
- **Polish (Fase 9)**: tras completar las historias deseadas.

### User Story Dependencies

- US1 (P1): solo Foundational. Se apoya en Pacientes (Fase 7) para datos reales.
- US2 (P1): solo Foundational. Independiente de US1.
- US3 (P2): solo Foundational. Opera sobre citas existentes; independiente.
- US4 (P2): solo Foundational. Independiente.

### Within Each User Story

- Tests primero (deben fallar) → dominio → servicio → endpoint → UI/integración.

### Parallel Opportunities

- Fase 1: T002, T003, T004, T005 en paralelo tras T001.
- Fase 2: T009, T010, T011, T012, T014 en paralelo tras T006/T008.
- Tras Foundational, varios agentes pueden tomar US1, US2, US3, US4 y Pacientes en paralelo.
- Dentro de cada historia, los tests marcados [P] corren en paralelo.

---

## Parallel Example: User Story 1

```bash
# Tests de US1 (escribir primero, deben fallar):
Task: "Alta válida y cálculo de fin en tests/integration/citas-alta.test.ts"
Task: "Anti-solape profesional en tests/integration/citas-solape-profesional.test.ts"
Task: "Concurrencia mismo hueco en tests/integration/citas-concurrencia.test.ts"
Task: "Anti-solape paciente en tests/integration/citas-solape-paciente.test.ts"
Task: "RN2 y validación en tests/integration/citas-validacion.test.ts"
Task: "Contract POST /api/citas en tests/integration/contract-citas.test.ts"
```

---

## Implementation Strategy

### MVP First

1. Fase 1 (Setup) → Fase 2 (Foundational, con el invariante anti-solape en el esquema).
2. Fase 7 (Pacientes) + Fase 3 (US1) + Fase 4 (US2).
3. **PARAR y VALIDAR**: alta sin solapes + agenda del día con la semilla. Este es el MVP.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 + US2 (+ Pacientes + Semilla) → MVP demostrable.
3. US3 (estados) → demo.
4. US4 (acceso) → demo.

### Parallel Team / Multi-Agent Strategy

Tras Foundational, con propiedad por spec (specs/MAPA.md): un agente por historia (US1, US2, US3,
US4) y otro para Pacientes/Semilla, integrando de forma independiente con la suite en verde como
puerta (Principio 6).

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- La etiqueta [Story] mapea cada tarea a su historia para trazabilidad.
- Toda tarea que escribe en la agenda incluye pruebas anti-solape (Principio 3).
- Verificar que los tests fallan antes de implementar.
- Commit tras cada tarea o grupo lógico.
- Evitar: tareas vagas, conflictos en el mismo archivo, dependencias entre historias que rompan su independencia.
