# Specification Quality Checklist: Informes fiscales y exportación a la gestoría

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan IVA, trimestres y facturas reales; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (13 FR; FR-011 señalado como «sin test»)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (6 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 001, 003, 004, 005 y 007)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Datos sensibles**: la spec no reproduce la clave del CSV ni los NIF de los clientes (aparecen como `<clave de config>` y `<NIF>`).
- **Hueco de protección**: el golden master **no** cubre esta spec. Se apoya en `test/rutas.test.js` y `test/semilla.test.js`. A-61 no tiene test (es un hecho fiscal, no de código).
- **Dato verificado en esta spec y sin test**: el IVA anual por líneas (647,98 €) frente al de cabeceras (783,78 €) se comprobó con una consulta sobre una BD temporal de la semilla.
- **A-01 sin cerrar**: la sección de A-01 describe las dos fuentes y documenta sin especificar los 6 documentos. No puede cerrarse hasta que se resuelvan PD-01 a PD-05 y firme una persona identificada (PD-08), como pide el orden de lanzamiento de la partición.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-01, A-61 y A-40 siguen PENDIENTE en el registro.
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico). Las reglas no dependen de ello; las cifras sí.
