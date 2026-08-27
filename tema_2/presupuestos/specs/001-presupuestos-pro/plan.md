# Implementation Plan: PresupuestosPro v0

**Branch**: `001-presupuestos-pro` | **Date**: 2026-08-21 | **Spec**: `specs/001-presupuestos-pro/spec.md`

**Input**: Feature specification from `/specs/001-presupuestos-pro/spec.md`

## Summary

PresupuestosPro es una aplicación web de una sola página (SPA) que permite a un freelancer español crear presupuestos profesionales y descargarlos en PDF. Funciona completamente en el navegador sin servidor: los datos se guardan en localStorage. Debe ser publicable online inmediatamente (despliegue como sitio estático) y funcionar bien en el móvil.

**Enfoque técnico**: aplicación frontend pura con React, almacenamiento en localStorage, y generación de PDF en el cliente. Cero backend, cero base de datos, cero autenticación.

## Technical Context

**Language/Version**: JavaScript/TypeScript (ES2020+)

**Primary Dependencies**:
- React 18 (interfaz de usuario)
- jsPDF + jsPDF-AutoTable (generación de PDF en el cliente)
- Vite (empaquetador, desarrollo rápido)

**Storage**: localStorage del navegador

**Testing**: Vitest + React Testing Library

**Target Platform**: Navegador web moderno (Chrome, Firefox, Safari, Edge). Diseño responsive para móvil y escritorio.

**Project Type**: web-app (SPA estática, sin servidor)

**Performance Goals**: Generación de PDF en menos de 3 segundos. Interfaz fluida sin esperas perceptibles.

**Constraints**: Offline-capable una vez cargada. Sin servidor. localStorage como único almacenamiento (~5 MB límite por origen).

**Scale/Scope**: 1 usuario (el freelancer), ~50-100 presupuestos/año, ~20 clientes, ~30 servicios en catálogo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Justificación |
|---|---|---|
| I. Simplicidad ante todo | ✅ PASA | SPA estática, sin backend, sin abstracciones innecesarias. Una sola dependencia para PDF. |
| II. Idioma y mercado | ✅ PASA | Todo en español de España. Moneda euro. Sin i18n. |
| III. Cero alcance fantasma | ✅ PASA | Solo se implementa lo que está en la spec. Sin auth, sin nube, sin descuentos. |
| IV. Verificable por persona no técnica | ✅ PASA | Todos los criterios de éxito se comprueban usando la app en el navegador. |
| V. Datos del usuario con respeto | ✅ PASA | Solo se piden datos del perfil/clientes necesarios para el presupuesto. Todo en localStorage bajo control del usuario. Sin secretos en código. |

**Resultado del gate**: APROBADO — sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-presupuestos-pro/
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas
├── data-model.md        # Modelo de datos
├── quickstart.md        # Guía de validación
└── tasks.md             # Tareas (generado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/          # Componentes React reutilizables
│   ├── Layout/          # Estructura general y navegación
│   ├── Perfil/          # Formulario de perfil del freelancer
│   ├── Catalogo/        # CRUD de servicios
│   ├── Clientes/        # CRUD de clientes
│   └── Presupuestos/    # Creación, edición, listado de presupuestos
├── services/            # Lógica de negocio (cálculos, numeración, PDF)
├── storage/             # Capa de acceso a localStorage
├── utils/               # Utilidades (formateo de moneda, fechas)
├── App.tsx              # Componente raíz con enrutamiento
└── main.tsx             # Punto de entrada

public/
└── index.html

tests/
├── services/            # Tests de lógica de negocio (cálculos, numeración)
└── components/          # Tests de componentes
```

**Structure Decision**: Proyecto único sin separación frontend/backend porque no hay backend. Estructura plana con carpetas por dominio dentro de `components/`. La lógica de negocio (cálculos, PDF, numeración) vive en `services/` separada de la UI para poder testearla independientemente.

## Decisiones clave (en lenguaje de negocio)

### ¿Por qué no hay servidor?

La spec dice que los datos viven en el ordenador del freelancer. Un servidor añadiría costes de hosting, mantenimiento, cuentas de usuario y complejidad. Con localStorage el freelancer abre la web y funciona, incluso sin conexión una vez cargada.

### ¿Por qué generar el PDF en el navegador?

Si el PDF se generara en un servidor, necesitaríamos infraestructura, un endpoint, y gestionar la conexión. Generándolo en el navegador con jsPDF: funciona offline, es instantáneo, y no hay costes de servidor.

### ¿Por qué React y no algo más simple (HTML puro)?

La app tiene formularios interactivos con recálculo en tiempo real, múltiples vistas (perfil, catálogo, clientes, presupuestos), y estado compartido. React simplifica esto sin necesitar un framework más pesado. Alternativas como Vue o Svelte serían igualmente válidas; React se elige por ecosistema y documentación abundante.

### ¿Cómo se publica?

Es un sitio estático. Se sube a cualquier hosting gratuito (Netlify, Vercel, GitHub Pages) sin configuración de servidor. El freelancer accede desde una URL y la app funciona.

### ¿Y si localStorage se llena?

Con ~5 MB de límite y presupuestos que pesan ~2-5 KB cada uno, caben más de 1.000 presupuestos + logos comprimidos. Para v0 es más que suficiente. Si en el futuro se necesita más espacio, se migraría a IndexedDB (cambio interno, sin impacto en la UI).

### ¿Funciona en el móvil?

Sí. Diseño responsive con CSS estándar. El freelancer puede crear un presupuesto desde el móvil a las once de la noche y descargarlo en PDF.

## Complexity Tracking

> No hay violaciones de la constitución. No se requiere justificación.
