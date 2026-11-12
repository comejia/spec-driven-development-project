# Specification Quality Checklist: Vida de la factura emitida: cobro, rectificación y consulta

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan facturas reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (15 FR; FR-010 señalado como «sin test»)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (6 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 001, 002, 003, 004, 008 y 009)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Hueco de protección principal**: el golden master **no** cubre esta spec (solo emisión y remesa). Se apoya en `test/rutas.test.js` y `test/semilla.test.js`. Sin test: el fallo a mitad de una rectificación con líneas (FR-010).
- **Criterios de aceptación contra la suite**: los tests citados se localizaron por título en `test/rutas.test.js` y `test/semilla.test.js`.
- **A-01 no se especifica aquí**: se referencia a la spec 008. La spec no puede cerrarse hasta que se decida la corrección de las 6 facturas (PD-01 a PD-05); su sección de A-01 queda sin cerrar a propósito, como pide el orden de lanzamiento de la partición.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-08, A-16, A-32, A-33 y A-49 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08).
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello; los datos de las facturas sí.
