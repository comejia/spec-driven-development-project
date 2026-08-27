# Tasks: Mejora de presentación de PresupuestosPro

**Input**: Design documents from `/specs/002-mejora-presentacion/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: No se requieren tests nuevos. Los 32 tests existentes deben seguir pasando sin modificación (validación de regresión).

**Organization**: Tasks agrupadas por user story. Esta feature solo modifica la capa visual.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: User story a la que pertenece (US1–US4)
- Rutas exactas incluidas en cada tarea

---

## Phase 1: Foundational — Rediseño del sistema de diseño

**Purpose**: Redefinir las variables CSS y la base tipográfica que afectan a toda la app. DEBE completarse antes de las user stories porque todas dependen de estos valores.

**⚠️ CRITICAL**: Todas las user stories usan estos estilos base.

- [x] T001 Rediseñar variables CSS: paleta de colores profesional y sobria (máximo 5 colores + neutros), escala tipográfica (familia, pesos, tamaños para h1–h3, body, label, small), y sistema de espaciado (escala consistente 4/8/12/16/24/32/48px) en src/styles/global.css
- [x] T002 Rediseñar estilos base de tablas: cabeceras diferenciadas (fondo, peso), separadores de fila, alternancia de color de fondo, padding uniforme en src/styles/global.css
- [x] T003 Rediseñar estilos base de formularios: etiquetas consistentes, campos con bordes definidos, estados de foco visibles, grupos de campos con espaciado uniforme en src/styles/global.css
- [x] T004 Rediseñar jerarquía de botones: primario (destacado), secundario (sutil), peligroso (rojo diferenciado), y estados hover/focus en src/styles/global.css
- [x] T005 Verificar que los 32 tests existentes siguen pasando tras cambios CSS: ejecutar `npm run test`

**Checkpoint**: Sistema de diseño coherente aplicado a toda la app — la tipografía, colores y espaciado ya se ven consistentes en todas las páginas existentes.

---

## Phase 2: User Story 1 — Página de inicio (Priority: P1) 🎯

**Goal**: El freelancer ve una página de inicio al abrir la app con resumen de actividad y accesos directos.

**Independent Test**: Abrir la URL raíz → ver resumen (presupuestos por estado, clientes, servicios) y accesos a las 4 secciones.

### Implementation for User Story 1

- [x] T006 [US1] Crear componente InicioPage con resumen de actividad (conteo de presupuestos borrador/numerado, clientes, servicios) y accesos directos (tarjetas enlazando a Presupuestos, Clientes, Catálogo, Perfil) en src/components/Inicio/InicioPage.tsx
- [x] T007 [US1] Implementar estado vacío: si no hay datos, mostrar mensaje de bienvenida con orientación para empezar en src/components/Inicio/InicioPage.tsx
- [x] T008 [US1] Implementar aviso de perfil incompleto: si el perfil no está completo, mostrar banner destacado con texto "Completa tu perfil para poder generar PDFs" y enlace directo a /perfil en src/components/Inicio/InicioPage.tsx
- [x] T009 [US1] Actualizar App.tsx: cambiar ruta raíz `/` para que muestre InicioPage (en lugar de redirigir a /presupuestos) en src/App.tsx

**Checkpoint**: Página de inicio funcional con resumen y accesos directos.

---

## Phase 3: User Story 2 — Navegación común mejorada (Priority: P1) 🎯

**Goal**: Barra de navegación sticky con marca "PresupuestosPro" clickeable y enlace a Inicio en todas las páginas.

**Independent Test**: Desde cualquier sección, ir a cualquier otra con un clic. La marca lleva al inicio. Sticky top siempre visible.

### Implementation for User Story 2

- [x] T010 [US2] Actualizar Layout.tsx: añadir enlace "Inicio" en la navegación, hacer la marca "PresupuestosPro" clickeable hacia `/`, y resaltar la sección activa en src/components/Layout/Layout.tsx
- [x] T011 [US2] Actualizar Layout.css: navegación sticky top mejorada, marca con estilo de logo/brand, enlace activo con resaltado visual claro, responsive en móvil sin desbordamiento en src/components/Layout/Layout.css

**Checkpoint**: Navegación completa, sticky, con marca y enlace activo resaltado en todas las páginas.

---

## Phase 4: User Story 3 — Rediseño visual de componentes (Priority: P1) 🎯

**Goal**: Todas las páginas se ven profesionales y sobrias con jerarquía visual clara.

**Independent Test**: Navegar por todas las secciones y verificar consistencia visual (tipografía, colores, espaciado uniformes).

### Implementation for User Story 3

- [x] T012 [P] [US3] Actualizar PerfilPage.tsx: aplicar nueva jerarquía visual (título, formulario con etiquetas alineadas, preview de logo con mejor presentación) en src/components/Perfil/PerfilPage.tsx
- [x] T013 [P] [US3] Actualizar CatalogoPage.tsx: tabla con nuevo estilo (cabeceras, alternancia), formulario con jerarquía, feedback visual mejorado en src/components/Catalogo/CatalogoPage.tsx
- [x] T014 [P] [US3] Actualizar ClientesPage.tsx: tabla con nuevo estilo, formulario con selector de tipo bien diferenciado, feedback visual en src/components/Clientes/ClientesPage.tsx
- [x] T015 [US3] Actualizar PresupuestosPage.tsx: badges de estado visual para Borrador (color neutro/gris) y Numerado (color primario/verde), tabla con nuevo estilo en src/components/Presupuestos/PresupuestosPage.tsx
- [x] T016 [US3] Actualizar PresupuestoEditor.tsx: desglose con total destacado visualmente, selector de retención con mejor presentación, tabla de líneas con nuevo estilo en src/components/Presupuestos/PresupuestoEditor.tsx

**Checkpoint**: Todas las páginas tienen aspecto profesional y consistente.

---

## Phase 5: User Story 4 — PDF profesional (Priority: P2)

**Goal**: El PDF descargado transmite profesionalidad con diseño sobrio, tipografía consistente y desglose bien jerarquizado.

**Independent Test**: Generar un PDF y verificar visualmente: logo nítido, número prominente, tabla con cabeceras, total destacado.

### Implementation for User Story 4

- [x] T017 [US4] Rediseñar formato del PDF: logo bien posicionado y dimensionado, datos del freelancer con tipografía clara, datos del cliente diferenciados, número y fechas prominentes en src/services/pdf.ts
- [x] T018 [US4] Rediseñar tabla de líneas del PDF: cabeceras con fondo, columnas alineadas (descripción izquierda, números derecha), separadores de fila en src/services/pdf.ts
- [x] T019 [US4] Rediseñar desglose del PDF: subtotales con tipografía normal, línea separadora antes del total, total con tipografía mayor/bold, retención claramente diferenciada del IVA en src/services/pdf.ts

**Checkpoint**: PDF profesional y sobrio. Misma línea visual que la app.

---

## Phase 6: Polish & Validación

**Purpose**: Verificación cruzada y ajustes finales.

- [x] T020 Ejecutar todos los tests existentes (`npm run test`) y verificar que los 32 pasan sin cambios
- [x] T021 [P] Verificar responsive en móvil (375px): navegación usable, formularios legibles, tablas con scroll si necesario
- [x] T022 [P] Verificar consistencia visual entre todas las secciones (misma paleta, tipografía y espaciado)
- [x] T023 Validación completa siguiendo los 8 escenarios de quickstart.md (incluye escenario 7: verificar con datos pre-existentes en localStorage que no se pierden ni corrompen tras el rediseño)
- [x] T024 Build de producción (`npm run build`) y verificar que funciona desde dist/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: Sin dependencias — empieza inmediatamente. BLOQUEA todo lo demás.
- **US1 Inicio (Phase 2)**: Depende de Phase 1
- **US2 Navegación (Phase 3)**: Depende de Phase 1
- **US3 Rediseño visual (Phase 4)**: Depende de Phase 1
- **US4 PDF (Phase 5)**: Depende de Phase 1 (independiente de US1-US3)
- **Polish (Phase 6)**: Depende de todas las user stories completadas

### Parallel Opportunities

- Tras Phase 1: US1, US2, US3 y US4 pueden avanzar en paralelo (archivos distintos)
- Dentro de US3: T012, T013, T014 en paralelo (páginas distintas)
- En Polish: T021 y T022 en paralelo

### Orden recomendado (un solo desarrollador)

```text
Phase 1 (CSS) → US1 (Inicio, incluye T009 que cambia ruta /) → US2 (Navegación, marca enlaza a /) → US3 (Componentes) → US4 (PDF) → Polish
```

Se recomienda US2 antes de US1 porque la página de inicio necesita que la navegación ya tenga el enlace "Inicio".

---

## Implementation Strategy

### MVP (mínimo entregable con valor)

1. Phase 1: Rediseño CSS base
2. US2: Navegación mejorada
3. US1: Página de inicio
4. **PARAR Y VALIDAR**: La app ya se ve profesional y tiene inicio + navegación

### Entrega completa

1. + US3: Todos los componentes con nuevo estilo
2. + US4: PDF profesional
3. Polish: Validación final

---

## Notes

- NO se tocan servicios de lógica (perfil, catalogo, clientes, presupuestos, calculos, numeracion)
- NO se toca storage ni types
- NO se añaden dependencias nuevas
- Los únicos archivos .ts que se modifican son pdf.ts (solo formato) y App.tsx (solo rutas)
- Si algún test falla, significa que se tocó lógica por error → revertir y corregir
- Datos en localStorage siguen funcionando sin migración
