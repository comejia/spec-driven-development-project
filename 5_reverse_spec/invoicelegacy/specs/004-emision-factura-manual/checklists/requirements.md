# Specification Quality Checklist: Emisión de una factura manual

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan facturas, fechas y euros reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (15 FR; todos con test citado o con nota explícita)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (5 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 001, 002, 003, 005, 007, 009 y 010)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Criterios de aceptación contra la suite**: los tests citados se localizaron por título en `test/rutas.test.js`, `test/util.test.js` y `test/remesa.test.js`; los casos G01, G04, G09 y G10, en `test/golden/casos.js`.
- **Huecos de test señalados en la spec**: (1) A-36 solo tiene test en el camino de la remesa (misma expresión `dias_pago || 30`); el alta manual con plazo 0 no tiene test propio. (2) FR-004 (tipo de IVA leído como entero) y el escenario «28.9» no tienen test específico. (3) El tipo de IVA decimal no se prueba.
- **Tamaño**: es la spec más cargada junto con la 001 y la 007 (9 RN y 10 anomalías). Lleva preparada su división en 004a (validación y lectura de datos) y 004b (fecha y vencimiento) si la lectura de 30 minutos no llega.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-09 y A-36 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08).
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello; los datos de las facturas sí.
