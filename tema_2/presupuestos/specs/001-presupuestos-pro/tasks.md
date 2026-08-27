# Tasks: PresupuestosPro v0

**Input**: Design documents from `/specs/001-presupuestos-pro/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos para la lógica de negocio crítica (cálculos y numeración). Tests de componentes opcionales.

**Organization**: Tasks agrupadas por user story para implementación y validación independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: User story a la que pertenece (US1–US7)
- Rutas exactas incluidas en cada tarea

---

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Inicialización del proyecto y estructura base

- [x] T001 Inicializar proyecto con Vite + React + TypeScript en la raíz del repositorio
- [x] T002 [P] Configurar dependencias: jspdf, jspdf-autotable, uuid
- [x] T003 [P] Configurar Vitest + React Testing Library en vitest.config.ts
- [x] T004 [P] Crear estructura de carpetas: src/components/, src/services/, src/storage/, src/utils/, tests/
- [x] T005 Configurar CSS Modules y variables CSS globales (responsive mobile-first) en src/styles/global.css

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: Capa de almacenamiento y utilidades que TODAS las user stories necesitan

**⚠️ CRITICAL**: No se puede empezar ninguna user story hasta completar esta fase

- [x] T006 Implementar módulo de almacenamiento genérico en src/storage/storage.ts (wrapper de localStorage con serialización JSON y prefijo `presupuestospro_`)
- [x] T007 [P] Implementar utilidades de formateo de moneda (formato español: 1.500,00 €) en src/utils/currency.ts
- [x] T008 [P] Implementar utilidades de fechas (formato español, cálculo +30 días) en src/utils/dates.ts
- [x] T009 [P] Implementar utilidad de generación de UUID en src/utils/uuid.ts
- [x] T010 Crear contexto global de la aplicación (React Context + useReducer) en src/App.tsx con providers
- [x] T011 Crear componente Layout con navegación entre secciones en src/components/Layout/Layout.tsx
- [x] T012 Configurar enrutamiento entre vistas (Perfil, Catálogo, Clientes, Presupuestos) en src/App.tsx

**Checkpoint**: Estructura navegable con almacenamiento funcional — listo para user stories

---

## Phase 3: User Story 1 — Perfil del freelancer (Priority: P1) 🎯 MVP

**Goal**: El freelancer puede guardar su perfil (nombre, NIF, dirección, teléfono, email, logo) y los datos persisten entre sesiones.

**Independent Test**: Rellenar todos los campos, guardar, recargar la app, verificar que persisten.

### Implementation for User Story 1

- [x] T013 [US1] Implementar servicio de perfil (guardar, cargar, validar completitud) en src/services/perfil.ts
- [x] T014 [US1] Implementar lógica de carga y validación de logo (PNG/JPG, max 2 MB, conversión a Data URL) en src/services/perfil.ts
- [x] T015 [P] [US1] Crear componente formulario de perfil en src/components/Perfil/PerfilForm.tsx
- [x] T016 [US1] Crear vista/página de perfil con carga de logo y feedback de validación en src/components/Perfil/PerfilPage.tsx
- [x] T017 [US1] Test unitario: validación de perfil completo/incompleto en tests/services/perfil.test.ts

**Checkpoint**: Perfil completo funcional y persistente

---

## Phase 4: User Story 2 — Catálogo de servicios (Priority: P2)

**Goal**: El freelancer puede crear, editar y eliminar servicios con nombre único y precio base.

**Independent Test**: Crear servicio, editarlo, borrarlo, verificar duplicado por nombre (insensible a mayúsculas).

### Implementation for User Story 2

- [x] T018 [US2] Implementar servicio de catálogo (CRUD, validación nombre único case-insensitive) en src/services/catalogo.ts
- [x] T019 [US2] Test unitario: unicidad de nombre insensible a mayúsculas en tests/services/catalogo.test.ts
- [x] T020 [P] [US2] Crear componente lista de servicios en src/components/Catalogo/CatalogoList.tsx
- [x] T021 [P] [US2] Crear componente formulario de servicio (crear/editar) en src/components/Catalogo/ServicioForm.tsx
- [x] T022 [US2] Crear vista/página de catálogo con CRUD completo en src/components/Catalogo/CatalogoPage.tsx

**Checkpoint**: Catálogo funcional con validación de duplicados

---

## Phase 5: User Story 3 — Lista de clientes (Priority: P2)

**Goal**: El freelancer puede crear y editar clientes (no eliminar) con tipo empresa/particular.

**Independent Test**: Crear cliente, editarlo, verificar que no se puede eliminar.

### Implementation for User Story 3

- [x] T023 [US3] Implementar servicio de clientes (crear, editar, listar, sin eliminar) en src/services/clientes.ts
- [x] T024 [P] [US3] Crear componente lista de clientes en src/components/Clientes/ClientesList.tsx
- [x] T025 [P] [US3] Crear componente formulario de cliente (crear/editar, con selector de tipo) en src/components/Clientes/ClienteForm.tsx
- [x] T026 [US3] Crear vista/página de clientes en src/components/Clientes/ClientesPage.tsx

**Checkpoint**: Lista de clientes funcional y persistente

---

## Phase 6: User Story 4 — Crear presupuesto (Priority: P1) 🎯 MVP

**Goal**: El freelancer puede crear un presupuesto asociado a un cliente, con líneas del catálogo o a mano, en estado borrador.

**Independent Test**: Crear presupuesto, añadir líneas, editar línea, eliminar línea, verificar que queda en borrador.

### Implementation for User Story 4

- [x] T027 [US4] Implementar servicio de presupuestos (crear, guardar, listar, cargar borrador) en src/services/presupuestos.ts
- [x] T028 [US4] Implementar lógica de líneas (añadir desde catálogo, añadir manual, editar, eliminar) en src/services/presupuestos.ts
- [x] T029 [P] [US4] Crear componente selector de cliente para nuevo presupuesto en src/components/Presupuestos/ClienteSelector.tsx
- [x] T030 [P] [US4] Crear componente formulario de línea (manual o desde catálogo) en src/components/Presupuestos/LineaForm.tsx
- [x] T031 [P] [US4] Crear componente tabla de líneas (editar/eliminar en cada fila) en src/components/Presupuestos/LineasTable.tsx
- [x] T032 [US4] Crear vista/página de edición de presupuesto en src/components/Presupuestos/PresupuestoEditor.tsx
- [x] T033 [P] [US4] Crear componente listado de presupuestos (borradores y numerados) en src/components/Presupuestos/PresupuestosList.tsx
- [x] T034 [US4] Crear vista/página principal de presupuestos en src/components/Presupuestos/PresupuestosPage.tsx

**Checkpoint**: Flujo completo de creación de presupuesto en borrador

---

## Phase 7: User Story 5 — Cálculos automáticos (Priority: P1) 🎯 MVP

**Goal**: Base imponible, IVA, retención y total se calculan correctamente en tiempo real con redondeo por línea.

**Independent Test**: Con las líneas del ejemplo de referencia, verificar que los totales cuadran al céntimo en los 3 casos.

### Implementation for User Story 5

- [x] T035 [US5] Implementar motor de cálculos (importeLinea, base, IVA, retención, total) con redondeo a 2 decimales por línea en src/services/calculos.ts
- [x] T036 [US5] Test unitario: caso A (retención 15%, total = 2.120,00 €) en tests/services/calculos.test.ts
- [x] T037 [US5] Test unitario: caso B (retención 7%, total = 2.280,00 €) en tests/services/calculos.test.ts
- [x] T038 [US5] Test unitario: caso C (particular sin retención, total = 2.420,00 €) en tests/services/calculos.test.ts
- [x] T039 [US5] Test unitario: retención activada con cliente particular → no se aplica en tests/services/calculos.test.ts
- [x] T040 [US5] Crear componente desglose de totales (base, IVA, retención, total) en src/components/Presupuestos/Desglose.tsx
- [x] T041 [US5] Crear selector de retención (ninguna/15%/7%) en src/components/Presupuestos/RetencionSelector.tsx
- [x] T042 [US5] Integrar cálculos en tiempo real en PresupuestoEditor (recálculo al añadir/editar/eliminar líneas o cambiar retención) en src/components/Presupuestos/PresupuestoEditor.tsx

**Checkpoint**: Cálculos correctos al céntimo, recálculo en tiempo real

---

## Phase 8: User Story 6 — Generar y descargar PDF (Priority: P1) 🎯 MVP

**Goal**: El freelancer puede generar un PDF profesional con número, logo, datos, tabla y desglose. El número se asigna al generar.

**Independent Test**: Generar PDF, verificar visualmente todos los elementos. Segundo PDF recibe número consecutivo.

### Implementation for User Story 6

- [x] T043 [US6] Implementar servicio de numeración (siguiente número, reinicio anual automático, formato AAAA-NNN) en src/services/numeracion.ts
- [x] T044 [US6] Test unitario: numeración secuencial y reinicio de año en tests/services/numeracion.test.ts
- [x] T045 [US6] Implementar generador de PDF con jsPDF (logo, datos freelancer, datos cliente, número, fechas, tabla de líneas, desglose) en src/services/pdf.ts
- [x] T046 [US6] Implementar lógica de "generar PDF" (validar perfil completo, validar líneas > 0, asignar número, congelar snapshots de cliente y perfil, cambiar estado a numerado) en src/services/presupuestos.ts
- [x] T047 [US6] Crear botón "Generar PDF" con validaciones y avisos en src/components/Presupuestos/PresupuestoEditor.tsx
- [x] T048 [US6] Implementar re-descarga de PDF de presupuesto ya numerado (usar snapshots congelados) en src/services/pdf.ts
- [x] T049 [US6] Test unitario: no genera PDF sin líneas, no genera PDF sin perfil completo en tests/services/presupuestos.test.ts

**Checkpoint**: PDF descargable con todos los elementos, numeración correcta

---

## Phase 9: User Story 7 — Editar presupuesto numerado (Priority: P3)

**Goal**: Al editar un presupuesto numerado, el original queda como histórico y se crea una copia borrador que recibirá número nuevo.

**Independent Test**: Editar presupuesto numerado, verificar original intacto, generar PDF de copia con número nuevo.

### Implementation for User Story 7

- [x] T050 [US7] Implementar lógica de "editar presupuesto numerado" (clonar a borrador, marcar original como histórico) en src/services/presupuestos.ts
- [x] T051 [US7] Añadir botón "Editar" en presupuestos numerados con confirmación en src/components/Presupuestos/PresupuestosList.tsx
- [x] T052 [US7] Test unitario: original intacto tras edición, copia recibe número nuevo en tests/services/presupuestos.test.ts

**Checkpoint**: Flujo de edición de presupuesto numerado completo

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a múltiples user stories

- [x] T053 [P] Diseño responsive: verificar y ajustar formularios y tablas para móvil en src/styles/global.css
- [x] T054 [P] Mensajes de aviso y feedback consistentes en toda la app (estilo unificado) en src/components/Layout/Feedback.tsx
- [x] T055 [P] Estados vacíos: mensajes claros cuando no hay servicios, clientes o presupuestos en cada listado
- [x] T056 Validación end-to-end siguiendo los 9 escenarios de quickstart.md
- [x] T057 Build de producción (npm run build) y verificar que funciona desde dist/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — empieza inmediatamente
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las user stories
- **US1 Perfil (Phase 3)**: Depende de Foundational
- **US2 Catálogo (Phase 4)**: Depende de Foundational
- **US3 Clientes (Phase 5)**: Depende de Foundational
- **US4 Crear presupuesto (Phase 6)**: Depende de US3 (necesita lista de clientes) y US2 (necesita catálogo para cargar líneas, pero puede funcionar solo con líneas manuales)
- **US5 Cálculos (Phase 7)**: Depende de US4 (necesita presupuesto con líneas)
- **US6 Generar PDF (Phase 8)**: Depende de US1 (perfil) + US5 (cálculos)
- **US7 Editar numerado (Phase 9)**: Depende de US6 (necesita presupuestos numerados)
- **Polish (Phase 10)**: Depende de todas las user stories completadas

### Orden mínimo para MVP

```text
Setup → Foundational → US1 (Perfil) → US3 (Clientes) → US4 (Presupuesto) → US5 (Cálculos) → US6 (PDF)
```

### Parallel Opportunities

- Dentro de Setup: T002, T003, T004, T005 en paralelo
- Dentro de Foundational: T007, T008, T009 en paralelo
- US1 y US2 y US3 pueden avanzar en paralelo tras Foundational
- Dentro de US4: T029, T030, T031, T033 en paralelo
- Dentro de US5: T036, T037, T038, T039 en paralelo (tests)

---

## Parallel Example: User Story 5

```bash
# Tests en paralelo:
Task: "Test caso A (retención 15%) en tests/services/calculos.test.ts"
Task: "Test caso B (retención 7%) en tests/services/calculos.test.ts"
Task: "Test caso C (particular) en tests/services/calculos.test.ts"
Task: "Test retención con particular en tests/services/calculos.test.ts"
```

---

## Implementation Strategy

### MVP First (Stories P1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational
3. Completar US1: Perfil → verificar persistencia
4. Completar US3: Clientes → verificar CRUD
5. Completar US4: Crear presupuesto → verificar flujo borrador
6. Completar US5: Cálculos → verificar con ejemplo de referencia (2.120,00 €)
7. Completar US6: Generar PDF → verificar todos los elementos
8. **PARAR Y VALIDAR**: Ejecutar escenarios 1-6 y 8-9 de quickstart.md
9. Desplegar MVP

### Incremental Delivery

1. Setup + Foundational → base lista
2. + US1 Perfil → freelancer puede guardar sus datos
3. + US2 Catálogo + US3 Clientes → freelancer prepara su entorno
4. + US4 + US5 → presupuestos con cálculos correctos
5. + US6 → PDF descargable (¡MVP funcional!)
6. + US7 → edición de históricos
7. Polish → app pulida para publicar

---

## Notes

- Todos los precios son base imponible en euros
- Redondeo a 2 decimales en cada línea antes de sumar
- El logo se almacena como Data URL base64 en localStorage
- Formato moneda español: punto para miles, coma para decimales (1.500,00 €)
- Comparación de nombres de servicio: insensible a mayúsculas/minúsculas
- PDF histórico = foto fija (snapshots de cliente y perfil congelados)
