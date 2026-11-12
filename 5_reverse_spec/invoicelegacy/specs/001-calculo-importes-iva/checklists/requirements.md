# Specification Quality Checklist: Cálculo de importes e IVA de una factura

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
- [x] Requirements are testable and unambiguous (13 FR, cada uno con test citado)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (5 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 002 a 008)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) y la plantilla de spec inversa exigen citar fichero y función como evidencia, y el redondeo `Math.round(x * 100) / 100` es parte del contrato (Principio I, «bit a bit»). Esas referencias son evidencia, no instrucciones de construcción.
- **Criterios de aceptación contra la suite**: los tests citados se localizaron por título en `test/calculo.test.js`, `test/util.test.js` y `test/rutas.test.js`. La suite completa pasa (273 de 273) en el estado actual del repositorio.
- **Corrección detectada en validación**: la factura FA-2026-000102 no se reproduce al céntimo con el código actual (base 115,62 frente a 115,60 grabada; H-02). La spec lo recoge y usa FA-2026-000104 como caso de reproducción exacta.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-02, A-29 y A-39 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08).
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello; los valores de SC-001 sí.
