# Specification Quality Checklist: Prorrateo comercial de cuotas y baja de contratos

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan cuotas y fechas reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (11 FR, cada uno con test citado)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (5 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 001, 004, 007 y 009)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Hueco de protección**: el golden master **no** cubre esta spec. Se apoya en `test/calculo.test.js`, `test/rutas.test.js` y `test/remesa.test.js` (contradicción 01).
- **Anomalías por referencia**: A-23 y A-04 tienen su spec principal en la 007; aquí solo se recoge su convivencia con la convención de 30 días (FR-011), para no duplicar su especificación.
- **Hecho de proceso sin test**: que Administración emita a mano la factura de la baja con el importe de la URL se apoya en comentarios del código, no en un test ni en un acta.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-23 (spec 007) sigue PENDIENTE; no hay testigo NEGOCIO con nombre (PD-08).
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello.
