# Specification Quality Checklist: Remesa mensual de contratos

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan contratos, cuotas y facturas reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (16 FR; FR-008 con una nota expresa de «sin test del fallo a mitad»)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (7 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 001, 002, 003, 006, 008 y 009)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Criterios de aceptación contra la suite**: los tests citados se localizaron por título en `test/remesa.test.js` (48 tests, el fichero más completo) y `test/util.test.js`; los casos G11 y G12, en `test/golden/casos.js` y `master.json`. El golden master cubre esta spec en parte (G11 y G12).
- **Sin test**: el fallo de BD a mitad de la remesa (RN-24, `process.exit(1)` sin deshacer lo emitido).
- **Tamaño**: es una de las specs más cargadas (9 RN y 8 anomalías). No se ha dividido; la partición propone vigilarlo en la lectura de 30 minutos.
- **Cifra del registro no reproducida tal cual**: «una segunda remesa duplicaría 393,25 €» es la suma de las tres facturas de una remesa con los tres contratos vigentes (108,90 + 175,45 + 108,90, como la de 2026-12); los tests de A-03 duplican un contrato de 90 € (108,90 €).
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-23, A-04, A-27 y A-31 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08). El Anexo A exige confirmación escrita de la gestoría antes de unificar los 30 días.
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello.
