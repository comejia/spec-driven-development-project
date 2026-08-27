# Implementation Plan: Mejora de presentación

**Branch**: `002-mejora-presentacion` | **Date**: 2026-08-24 | **Spec**: `specs/002-mejora-presentacion/spec.md`

**Input**: Feature specification from `/specs/002-mejora-presentacion/spec.md`

**Base técnica**: Stack, convenciones y estructura definidos en `specs/001-presupuestos-pro/plan.md` y `specs/001-presupuestos-pro/data-model.md`. No se modifican.

## Summary

Mejora exclusivamente visual de PresupuestosPro: nueva página de inicio con resumen de actividad, navegación sticky mejorada con marca, rediseño de la paleta y tipografía, y PDF profesional. Cero cambios en lógica, datos o servicios.

## Technical Context

**Stack existente** (heredado de spec 001, sin cambios):
- React 18 + TypeScript + Vite
- jsPDF + jsPDF-AutoTable
- localStorage
- Vitest + React Testing Library

**Scope de esta feature**: solo archivos CSS, componentes de UI (`.tsx`) y el servicio de PDF (`pdf.ts` — solo formato visual, no lógica).

**Dependencias nuevas**: Ninguna.

**Archivos que se tocan**:
- `src/styles/global.css` — rediseño completo de variables y estilos
- `src/components/Layout/Layout.tsx` y `.css` — navegación mejorada con marca
- `src/components/Presupuestos/PresupuestosPage.tsx` — badges de estado
- `src/services/pdf.ts` — mejora del formato visual del PDF
- **Nuevo**: `src/components/Inicio/InicioPage.tsx` — página de inicio
- `src/App.tsx` — añadir ruta de inicio

**Archivos que NO se tocan**: ningún servicio de lógica (perfil, catalogo, clientes, presupuestos, calculos, numeracion), ningún type, ningún test de servicios, storage.

## Constitution Check

| Principio | Estado | Justificación |
|---|---|---|
| I. Simplicidad ante todo | ✅ PASA | Solo CSS, un componente nuevo (InicioPage), y ajustes visuales en componentes existentes. Sin dependencias nuevas. |
| II. Idioma y mercado | ✅ PASA | Todo en español de España. |
| III. Cero alcance fantasma | ✅ PASA | No se implementan estados futuros ni funcionalidades no especificadas. Solo Borrador y Numerado. |
| IV. Verificable por persona no técnica | ✅ PASA | Todos los criterios se verifican visualmente en la app. |
| V. Datos del usuario con respeto | ✅ PASA | No se añaden ni piden datos nuevos. |

**Resultado del gate**: APROBADO.

## Project Structure

### Archivos nuevos

```text
src/components/Inicio/InicioPage.tsx    # Página de inicio con resumen
```

### Archivos modificados

```text
src/styles/global.css                          # Rediseño paleta, tipografía, espaciado
src/components/Layout/Layout.tsx               # Marca clickeable + enlace Inicio
src/components/Layout/Layout.css               # Sticky top mejorado
src/components/Presupuestos/PresupuestosPage.tsx  # Badges de estado visual
src/services/pdf.ts                            # Formato profesional del PDF
src/App.tsx                                    # Ruta raíz `/` muestra InicioPage
```

## Decisiones clave (en lenguaje de negocio)

### ¿Por qué no se añade ninguna librería de CSS?

La constitución exige simplicidad. Los cambios visuales se resuelven con variables CSS nativas, que ya están en uso. Añadir Tailwind o similar requeriría configuración extra y una curva de aprendizaje que no aporta valor para el alcance de esta mejora.

### ¿Por qué la página de inicio es un componente nuevo y no una modificación?

Es una vista que no existía antes. Tiene su propia responsabilidad (resumen de actividad) y se añade como ruta independiente. No sustituye ninguna vista existente.

### ¿Por qué se toca pdf.ts si es un "servicio"?

Solo se modifica el formato visual del PDF (posiciones, tamaños, colores). La lógica de qué datos se incluyen y cómo se calculan permanece idéntica. Es un cambio de presentación dentro de un archivo que genera un documento visual.

### ¿Cómo se asegura que no se rompe nada?

Los tests existentes (32 tests de lógica de negocio) deben seguir pasando sin modificaciones. Si alguno falla, significa que se tocó lógica por error. Además, el esquema de datos en localStorage no cambia: un usuario existente abre la app actualizada y todo sigue funcionando.
