# Tasks: Panel de Analítica

**Input**: Design documents from `/specs/004-panel-analitica/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/analitica.md, quickstart.md

**Tests**: INCLUIDOS. La spec exige verificación reproducible (Independent Tests por historia,
SC-001…SC-010) y la constitución (Principio 6) hace de la trazabilidad spec→test una puerta de
merge. Cada FR/SC relevante tiene su test.

**Organization**: Las tareas se agrupan por historia de usuario para permitir implementación y
prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias entre sí)
- **[Story]**: Historia a la que pertenece (US1…US5)
- Rutas de archivo exactas en cada descripción

## Path Conventions

Aplicación web en un único proyecto Next.js (decisión de `plan.md`): `app/`, `src/`,
`components/`, `tests/` en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la única dependencia nueva y el andamiaje de la feature. El resto del
stack ya existe (001).

- [ ] T001 Añadir dependencias de gráficos y semanas: instalar `recharts` y confirmar `date-fns` en `package.json` (versiones fijadas), sin tocar otras dependencias
- [ ] T002 [P] Crear los directorios de la feature: `components/analitica/` y `app/(panel)/analitica/`, y `app/api/analitica/`
- [ ] T003 [P] Verificar que lint/format (`eslint.config.mjs`, `.prettierrc.json`) y los runners (`vitest.config.ts`, `vitest.integration.config.ts`, `playwright.config.ts`) cubren las nuevas rutas sin cambios de configuración

**Checkpoint**: Dependencias listas y estructura creada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dominio puro y contrato del servicio de agregación compartidos por TODAS las
historias. Sin esto ninguna historia puede calcular sus números.

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta completar esta fase.

- [ ] T004 [P] Crear utilidades de semana ISO en `src/domain/analitica.ts`: `semanaIso(instante)`, `inicioDeSemanaIso`, `etiquetaSemana` (es-ES, p. ej. "Semana 33 · 11–17 ago") y `ultimasNSemanas(diaRef, n)` acotado a la semana en curso (FR-009, FR-007a, FR-008) en `Europe/Madrid`
- [ ] T005 [P] Añadir en `src/domain/analitica.ts` el conjunto de estados que ocupan hueco consumido POR REFERENCIA a la 001 (reservada+completada) con comentario a 001 FR-010/RN1 y nota de dependencia FR-007b; NO publicar una constante con nombre propia (S5)
- [ ] T006 [P] Implementar en `src/domain/analitica.ts` `minutosLaborablesDeSemana(semana)` (600 min × días laborables L–V) y `porcentajeOcupacion(minutosOcupados, minutosJornada)` con regla "sin datos" si jornada 0 y tope ≤ 100 % (FR-007, FR-010, SC-008)
- [ ] T007 [P] Implementar en `src/domain/analitica.ts` `tasaNoAsistenciaDefA(conteos)` = no_asistida ÷ (completada+cancelada+no_asistida) con `null`→"sin datos" si denominador 0, y redondeo a 1 decimal en es-ES (FR-006, FR-006a, FR-010)
- [ ] T008 Definir el esquema Zod de entrada de analítica en `src/validation/index.ts`: `analiticaSchema` con `dia_referencia` opcional `YYYY-MM-DD` (por defecto hoy en Madrid), para el servicio y el Route Handler (contrato analitica.md)
- [ ] T009 Crear el esqueleto tipado del servicio de solo lectura en `src/services/analitica.ts`: tipos `IngresosPorServicio`, `TasaNoAsistencia`, `OcupacionSemanal`, `Evolucion` y firma `obtenerAnalitica(clinicaId, entrada, db)` (data-model.md), sin lógica de consulta todavía (solo SELECT en fases siguientes)

**Checkpoint**: Dominio puro testeable y contrato del servicio listos. Las historias pueden empezar.

---

## Phase 3: User Story 1 - Enseñar el valor en la renovación (Priority: P1) 🎯 MVP

**Goal**: Acceso con la clave de clínica a una única página que muestra los cuatro bloques, con
los ingresos por citas completadas sumando 31.425,00 € al céntimo.

**Independent Test**: Acceder con la clave correcta y comprobar que se ven los cuatro bloques y
que el total de ingresos por completadas es 31.425,00 € con desglose cuadrado (spec US1).

### Tests for User Story 1 ⚠️

- [ ] T010 [P] [US1] Test unitario de dinero/agregación de ingresos en `tests/unit/analitica.test.ts`: suma por servicio en céntimos enteros y total = 31.425,00 € sin descuadre (FR-004/005, SC-001)
- [ ] T011 [P] [US1] Test de contrato del endpoint en `tests/integration/contract-analitica.test.ts`: `GET /api/analitica` con sesión válida devuelve los 4 bloques; sin sesión → 401 y ningún dato (contrato analitica.md, FR-001/003, SC-002)
- [ ] T012 [P] [US1] Test de integración con Postgres+semilla en `tests/integration/analitica-ingresos.test.ts`: `dia_referencia=2026-09-16` reproduce el desglose (205/10.250,00 €, 247/9.880,00 €, 139/6.255,00 €, 144/5.040,00 €) y total 735/31.425,00 € (SC-001, FR-014); reservada/cancelada/no_asistida no aportan (US2.3)
- [ ] T013 [P] [US1] Test E2E de acceso y render en `tests/e2e/analitica.spec.ts`: sin clave redirige a `/acceso` sin datos; con clave se ven los cuatro bloques en una página (US1.1/US1.3, SC-002)

### Implementation for User Story 1

- [ ] T014 [US1] Implementar en `src/services/analitica.ts` el cálculo de ingresos por servicio (SELECT con `GROUP BY` sobre citas `completada`, filtrado por `clinica_id`; `sumarCentimos`/`formatearEuros`; orden por ingresos desc; `sin_datos`) (FR-004/005/012)
- [ ] T015 [US1] Crear el Route Handler de solo lectura en `app/api/analitica/route.ts`: `GET` con `exigirClinicaDeSesion`, valida `dia_referencia` con `analiticaSchema`, llama al servicio y responde con el formato del contrato; errores es-ES (contrato analitica.md, FR-001/002/012)
- [ ] T016 [P] [US1] Crear el componente de presentación de ingresos en `components/analitica/ingresos-servicio.tsx`: tabla/gráfico con importes al céntimo y total, es-ES, accesible; estado "sin datos" (FR-005/010/011)
- [ ] T017 [US1] Crear la página del panel en `app/(panel)/analitica/page.tsx` (Server Component, `dynamic = 'force-dynamic'`): guard `clinicaDeSesionEnServidor` → redirect `/acceso`; llama al servicio y compone los cuatro bloques con `components/analitica/panel-analitica.tsx` (FR-001/003)
- [ ] T018 [US1] Crear el contenedor `components/analitica/panel-analitica.tsx` que dispone los cuatro bloques en una sola página, con cabecera y `SalirBoton` reutilizado (FR-003/011)

**Checkpoint**: MVP — acceso protegido + ingresos exactos + página con los 4 bloques (los otros 3 pueden mostrar su bloque aunque se pulan en fases siguientes).

---

## Phase 4: User Story 2 - Ingresos por servicio, exactos al céntimo (Priority: P1)

**Goal**: Desglose de ingresos por servicio solo de citas completadas, cuadrado al céntimo, con
total general.

**Independent Test**: Sumar por servicio los importes de las citas completadas de la semilla y
comprobar coincidencia exacta con el panel, sin descuadre (spec US2).

### Tests for User Story 2 ⚠️

- [ ] T019 [P] [US2] Ampliar `tests/integration/analitica-ingresos.test.ts`: verificar conteos por servicio y que solo `completada` suma; asserts de orden por importe desc y total al céntimo (FR-004, SC-001)
- [ ] T020 [P] [US2] Test unitario en `tests/unit/analitica.test.ts` de exclusión de estados no completados en el cálculo de ingresos (US2.3, FR-004)

### Implementation for User Story 2

- [ ] T021 [US2] Refinar en `src/services/analitica.ts` el bloque de ingresos: incluir `citas_completadas` por servicio y garantizar `total_centimos == Σ ingresos_centimos` (SC-001); "sin datos" si no hay completadas
- [ ] T022 [US2] Pulir `components/analitica/ingresos-servicio.tsx`: mostrar nº de citas completadas por servicio y total destacado, lectura sin jerga (FR-005/011)

**Checkpoint**: US1 y US2 funcionan de forma independiente y verificable con la semilla.

---

## Phase 5: User Story 3 - Tasa de no asistencia por profesional (Priority: P2)

**Goal**: Porcentaje de no asistencia por profesional (Definición A) con lectura literal, nota
de efecto cancelación y "sin datos" cuando proceda.

**Independent Test**: Con la semilla y Definición A, tasas 11,3 % / 7,9 % / 11,0 % por
profesional (spec US3, SC-004).

### Tests for User Story 3 ⚠️

- [ ] T023 [P] [US3] Test unitario en `tests/unit/analitica.test.ts` de `tasaNoAsistenciaDefA`: casos con denominador 0 → "sin datos", redondeo es-ES, y exclusión de `reservada` (FR-006/006a, SC-008)
- [ ] T024 [P] [US3] Test de integración en `tests/integration/analitica-tasa.test.ts`: `dia_referencia=2026-09-16` reproduce 11,3 % (32/284), 7,9 % (22/279), 11,0 % (39/353) (SC-004, FR-014)

### Implementation for User Story 3

- [ ] T025 [US3] Implementar en `src/services/analitica.ts` la tasa por profesional (SELECT conteos por estado agrupados por profesional, filtrado por clínica y estado ≠ reservada; aplicar `tasaNoAsistenciaDefA`) (FR-006/006a/012)
- [ ] T026 [P] [US3] Crear `components/analitica/tasa-no-asistencia.tsx`: porcentaje por profesional con lectura literal ("de cada 100 citas pasadas, N…"), "sin datos", y la nota FR-006c visible siempre (SC-010, FR-006c/010/011)
- [ ] T027 [US3] Integrar el bloque de tasa en `components/analitica/panel-analitica.tsx` (FR-003)

**Checkpoint**: US1–US3 independientes y verificables.

---

## Phase 6: User Story 4 - Ocupación semanal por profesional (Priority: P2)

**Goal**: Porcentaje de jornada ocupado por profesional y semana, solo hasta la semana en curso,
sin valores imposibles.

**Independent Test**: Con la semilla y la definición acordada, ocupación media ≈ 46 % / 47 % /
41 % (spec US4, SC-005).

### Tests for User Story 4 ⚠️

- [ ] T028 [P] [US4] Test unitario en `tests/unit/analitica.test.ts` de ocupación: jornada 0 → "sin datos", nunca > 100 %, profesional sin citas en semana con jornada → 0 % (FR-007/010, SC-008)
- [ ] T029 [P] [US4] Test de integración en `tests/integration/analitica-ocupacion.test.ts`: `dia_referencia=2026-09-16` reproduce ocupación media ≈ 46 %/47 %/41 % y NO pinta semanas futuras (SC-005, FR-007a)

### Implementation for User Story 4

- [ ] T030 [US4] Implementar en `src/services/analitica.ts` la ocupación por profesional y semana (SELECT de minutos de citas reservada|completada por semana ISO, filtrado por clínica; denominador = minutos laborables; acotar a la semana en curso) usando el dominio de T004/T005/T006 (FR-007/007a/012)
- [ ] T031 [P] [US4] Crear `components/analitica/grafico-ocupacion.tsx` (componente cliente con Recharts): una serie por profesional, semanas etiquetadas ISO, accesible y responsive; "sin datos" por semana cuando proceda (FR-007/009/010/011)
- [ ] T032 [US4] Integrar el bloque de ocupación en `components/analitica/panel-analitica.tsx` (FR-003)

**Checkpoint**: US1–US4 independientes y verificables.

---

## Phase 7: User Story 5 - Evolución de las últimas 8 semanas (Priority: P3)

**Goal**: Serie temporal (≤ 8 semanas) de citas completadas e ingresos por semana, orden
cronológico, etiquetas inequívocas.

**Independent Test**: Con la semilla, la serie de semanas completas reproduce 87/3.675,00 €
(ISO 31) … 84/3.565,00 € (ISO 37) (spec US5, SC-006).

### Tests for User Story 5 ⚠️

- [ ] T033 [P] [US5] Test de integración en `tests/integration/analitica-evolucion.test.ts`: `dia_referencia=2026-09-16` reproduce la serie de semanas completas (ISO 31–37) de citas completadas e ingresos, ≤ 8 semanas, orden cronológico (SC-006, FR-008/014)
- [ ] T034 [P] [US5] Test unitario en `tests/unit/analitica.test.ts`: con < 8 semanas de historia solo se muestran las disponibles, sin inventar vacías (US5.3, FR-008)

### Implementation for User Story 5

- [ ] T035 [US5] Implementar en `src/services/analitica.ts` la evolución (SELECT de citas completadas e ingresos por semana ISO, últimas ≤ 8 hasta la semana en curso, orden ascendente, filtrado por clínica) (FR-008/012)
- [ ] T036 [P] [US5] Crear `components/analitica/grafico-evolucion.tsx` (cliente Recharts): serie única cronológica, semanas etiquetadas ISO, accesible y responsive; "sin datos" si no hay historia (FR-008/009/010/011)
- [ ] T037 [US5] Integrar el bloque de evolución en `components/analitica/panel-analitica.tsx` (FR-003)

**Checkpoint**: Los cuatro bloques completos y verificables.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Invariantes transversales, solo lectura, accesibilidad y trazabilidad.

- [ ] T038 [P] Test de solo lectura y aislamiento en `tests/integration/analitica-solo-lectura.test.ts`: capturar estado (conteos por estado + hash de `cita`) antes/después de ejercitar el servicio y el endpoint; verificar 0 escrituras y que no se mezclan datos de otras clínicas (SC-003, FR-002/012)
- [ ] T039 [P] Test E2E de accesibilidad y responsive en `tests/e2e/analitica.spec.ts`: ejes de accesibilidad (contraste, tamaños), sin jerga en pantalla, uso en móvil y portátil (SC-009, FR-011)
- [ ] T040 [P] Crear `specs/004-panel-analitica/trazabilidad.md`: mapear cada FR (001–014) y SC (001–010) a su(s) test(s), siguiendo el formato de `specs/001-agenda-core/trazabilidad.md` (Principio 6)
- [ ] T041 Ejecutar la validación de `specs/004-panel-analitica/quickstart.md` (V1–V7) y confirmar los números de la spec; dejar la suite completa en verde (`test:unit`, `test:integration`, `test:e2e`) como puerta de merge
- [ ] T042 [P] Actualizar `specs/MAPA.md` si procede (estado de la 004) y revisar textos es-ES del panel

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias.
- **Foundational (Phase 2)**: Depende de Setup. BLOQUEA todas las historias.
- **User Stories (Phases 3–7)**: Dependen de Foundational. US1 (MVP) primero; luego pueden ir
  en paralelo o por prioridad (US2 P1 → US3/US4 P2 → US5 P3).
- **Polish (Phase 8)**: Depende de las historias deseadas completas.

### User Story Dependencies

- **US1 (P1)**: Tras Foundational. Entrega el andamiaje de página + endpoint + ingresos (MVP).
- **US2 (P1)**: Refina ingresos; comparte servicio/UI con US1 pero es testeable de forma aislada.
- **US3 (P2)**, **US4 (P2)**, **US5 (P3)**: Tras Foundational; cada una añade su bloque al
  servicio y al panel sin romper las anteriores. Comparten `src/services/analitica.ts` y
  `components/analitica/panel-analitica.tsx` (integración secuencial en esos archivos).

### Within Each User Story

- Los tests se escriben primero y deben FALLAR antes de implementar.
- Dominio (Phase 2) → servicio (SELECT) → endpoint/página → componentes → integración.

### Parallel Opportunities

- Setup: T002, T003 en paralelo.
- Foundational: T004–T007 en paralelo (mismo archivo `analitica.ts` → coordinar merge o dividir
  por funciones); T008 y T009 tras ellas.
- Dentro de cada historia: los tests marcados [P] en paralelo; los componentes nuevos [P] son
  independientes; la edición de `panel-analitica.tsx` y de `analitica.ts` es secuencial.

---

## Parallel Example: User Story 1

```bash
# Tests de US1 en paralelo (deben fallar antes de implementar):
Task: "Test unitario de ingresos en tests/unit/analitica.test.ts"
Task: "Test de contrato en tests/integration/contract-analitica.test.ts"
Task: "Test de integración con semilla en tests/integration/analitica-ingresos.test.ts"
Task: "Test E2E de acceso/render en tests/e2e/analitica.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup.
2. Phase 2: Foundational (dominio + contrato del servicio).
3. Phase 3: US1 → acceso protegido + ingresos al céntimo + página con los 4 bloques.
4. **PARAR y VALIDAR**: total 31.425,00 € y acceso denegado sin clave.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 (+US2) → bloque económico exacto (corazón de la renovación).
3. US3 → tasa de no asistencia con nota FR-006c.
4. US4 → ocupación semanal.
5. US5 → evolución 8 semanas.
6. Polish → solo lectura, accesibilidad, trazabilidad, quickstart.

---

## Notes

- [P] = archivos distintos, sin dependencias. Coordinar los que comparten `analitica.ts` y
  `panel-analitica.tsx`.
- La feature es SOLO LECTURA (FR-002): ninguna tarea introduce escrituras, migraciones ni
  cambios de esquema. El invariante anti-solape (Principio 3) se preserva por no tocar la agenda.
- Números reproducibles con la semilla `citaclara-eleva-2026`, día de referencia 16/09/2026
  (Principio 5, FR-014).
- Suite verde y trazabilidad spec→test como puerta de merge (Principio 6).
