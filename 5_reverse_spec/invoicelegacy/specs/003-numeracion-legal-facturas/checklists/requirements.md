# Specification Quality Checklist: Numeración legal de facturas

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan números de factura reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (11 FR; todos con test citado o con nota explícita de «sin test»)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (5 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 004, 005, 007 y 008)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia, y el año del reloj es parte del contrato (Principio I). Esas referencias son evidencia, no instrucciones de construcción.
- **Criterios de aceptación contra la suite**: los tests citados se localizaron por título en `test/numeracion.test.js`, `test/remesa.test.js` y `test/semilla.test.js`; los casos G10 y G12, en `test/golden/casos.js` y `master.json`.
- **Sin test**: la carrera real de dos grabaciones simultáneas (A-11, RN-39) no es reproducible de forma determinista; solo se prueba que la BD no exige unicidad. La spec lo dice expresamente (US4, escenario 3 y FR-007).
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-10 sigue PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08). La gestoría debe validar si una remesa lanzada el 1 de enero puede llevar fecha 31 de diciembre.
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello; los valores de los contadores sí.
