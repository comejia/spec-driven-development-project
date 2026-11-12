# Specification Quality Checklist: Maestros de clientes: identidad fiscal y bajas

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *las reglas y ejemplos usan altas, bajas y NIF de prueba; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (11 FR; FR-005 señalado como «sin test específico»)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (5 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con specs 004, 005, 006, 007, 008 y 010)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Datos sensibles**: la spec no reproduce los NIF de los clientes de la BD; los ejemplos son valores de prueba de los tests.
- **Hueco de protección**: el golden master **no** cubre esta spec. Se apoya en `test/rutas.test.js`, `test/util.test.js` y `test/remesa.test.js`.
- **Huecos de test señalados**: no hay test de que no exista ruta para modificar un cliente (FR-005), de la baja lógica de artículos, ni de la baja de un cliente inexistente.
- **Propuestas separadas del comportamiento actual**: P5 y P17 son [PROPUESTA DEL CONSULTOR] y se citan en la tabla de actas, pero no se redactan como requisitos.
- **Pendientes que NO bloquean la spec pero sí su aprobación**: A-05 y A-22 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08).
- **Estado de la BD de ejemplo**: A-18 (posible semilla en lugar de histórico); 5 de 6 NIF fallan el dígito de control (AD-08), compatible con datos anonimizados.
