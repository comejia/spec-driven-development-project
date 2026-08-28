# Implementation Plan: Exportar todos los presupuestos en un .zip

**Branch**: `003-exportar-zip` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-exportar-zip/spec.md`

## Summary

Añadir un botón "Exportar todo (.zip)" en la cabecera de la lista de presupuestos que genere,
100 % en el cliente, un único `.zip` con un PDF por cada presupuesto **numerado** (idéntico al PDF
individual) y un único `datos.json` con el estado interno restaurable (presupuestos, catálogo,
perfil con logo y contador; sin clientes). Enfoque técnico: reutilizar la generación de PDF actual
refactorizándola para separar construcción de guardado, empaquetar con **JSZip**, mostrar una barra
de progreso con contador real de PDF generados, y ejecutar todo como operación atómica de solo
lectura (aborta y no descarga nada si falla cualquier PDF).

## Technical Context

**Language/Version**: TypeScript 6 + React 19

**Primary Dependencies**: Vite 8, jsPDF + jsPDF-AutoTable (ya presentes), react-router-dom 7;
**nueva**: JSZip (versión fijada)

**Storage**: `localStorage` (claves con prefijo `presupuestospro_`); la exportación es de solo lectura

**Testing**: Vitest + React Testing Library + jsdom (tests en `tests/`)

**Target Platform**: Navegador moderno (SPA estática, offline-capable)

**Project Type**: Aplicación web SPA de una sola página (frontend puro, sin backend)

**Performance Goals**: Exportación fluida hasta 200+ presupuestos numerados; barra de progreso
perceptible con 50+ (RF-010, RF-012, CE-006)

**Constraints**: Sin backend, sin red; moneda EUR fija; UI en español de España; PDF del `.zip`
idénticos al céntimo con los individuales (ejemplo de control 3.604,00 €)

**Scale/Scope**: 1 freelancer, de 1 a 200+ presupuestos numerados; 1 botón, 1 servicio de
exportación, refactor mínimo del servicio PDF

## Constitution Check

*GATE: Debe pasar antes de Phase 0 y re-evaluarse tras Phase 1.*

| Principio | Evaluación | Estado |
|-----------|-----------|--------|
| I. Simplicidad ante todo | Una sola dependencia nueva (JSZip); refactor mínimo de PDF (extraer builder); generación secuencial sin paralelismo; sin abstracciones nuevas | PASS |
| II. Idioma y mercado | Toda la UI, mensajes y avisos en español de España; moneda EUR intacta (RF-013) | PASS |
| III. Cero alcance fantasma | Solo se implementa lo del spec; importar/restaurar queda fuera; `version` en `datos.json` es metadato mínimo, no funcionalidad de importación | PASS |
| IV. Verificable por persona no técnica | Todos los CE se comprueban usando la app y descomprimiendo el `.zip` en el explorador; nada requiere leer código ni inspeccionar storage | PASS |
| V. Datos del usuario con respeto | Operación de solo lectura; no se añaden datos; no hay secretos en código; `clientes` excluidos por spec | PASS |

**Resultado**: PASS (sin violaciones). No se requiere Complexity Tracking.

**Re-evaluación post-Phase 1**: PASS — el diseño (data-model, contracts, quickstart) mantiene una
sola dependencia nueva, un servicio aislado en `services/`, y lógica de negocio testeable sin UI.

## Project Structure

### Documentation (this feature)

```text
specs/003-exportar-zip/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Phase 0 (/speckit.plan)
├── data-model.md        # Phase 1 (/speckit.plan)
├── quickstart.md        # Phase 1 (/speckit.plan)
├── contracts/           # Phase 1 (/speckit.plan)
│   └── exportacion.md   # Contrato del servicio de exportación
├── checklists/
│   └── requirements.md  # Ya existente
└── tasks.md             # Phase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── pdf.ts               # REFACTOR: extraer construirDocumentoPDF(); generarDocumentoPDF() lo reutiliza
│   └── exportacion.ts       # NUEVO: lógica de exportación ZIP (reúne PDFs + datos.json, saneado, progreso, atomicidad)
├── utils/
│   ├── dates.ts             # AÑADIR: fechaLocalISO() para el nombre del zip (fecha local, no UTC)
│   └── nombreArchivo.ts     # NUEVO: sanearNombreArchivo() para nombres válidos de fichero
├── storage/
│   └── storage.ts           # Sin cambios (se reutiliza getItem)
└── components/
    └── Presupuestos/
        └── PresupuestosPage.tsx  # AÑADIR: botón "Exportar todo (.zip)" en cabecera + barra de progreso + tooltip

tests/
└── services/
    ├── exportacion.test.ts  # NUEVO: tests de lógica de exportación (selección numerados, datos.json, saneado, atomicidad)
    └── nombreArchivo.test.ts # NUEVO: tests de saneado de nombres
```

**Structure Decision**: SPA de un solo proyecto (Opción 1). La lógica de negocio se aísla en
`src/services/exportacion.ts` y utilidades puras en `src/utils/`, siguiendo la convención del
proyecto (lógica testeable fuera de la UI). El componente `PresupuestosPage.tsx` solo orquesta:
llama al servicio, muestra progreso y dispara la descarga.

## Complexity Tracking

> No aplica: Constitution Check pasa sin violaciones.
