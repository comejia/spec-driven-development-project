# Specification Quality Checklist: Descuento por volumen

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos están en euros y facturas reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (12 FR, cada uno con test citado)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (5 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 001, 004, 005 y 007)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Criterios de aceptación contra la suite**: los tests citados se localizaron por título en `test/calculo.test.js` y `test/rutas.test.js`; los casos G04 a G08, en `test/golden/casos.js`.
- **Facturas que no se reproducen**: FA-2026-000103 (A-69) y FA-2026-000105 (A-28, H-04) no coinciden con el código actual. La spec las documenta sin especificar y fija solo la regla.
- **Discrepancia menor detectada**: la FA-2026-000105 de la BD lleva la leyenda sin espacio inicial; el código la genera con espacio (FR-009). Es un dato de la semilla, no una contradicción de la regla.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-07, A-25, A-26, A-28 y A-69 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08).
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello; los datos de las facturas sí.
