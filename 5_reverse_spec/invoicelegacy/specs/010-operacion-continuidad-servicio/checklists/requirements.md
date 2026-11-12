# Specification Quality Checklist: Operación y continuidad del servicio

**Purpose**: Validar la completitud y calidad de la spec antes de pasar a planificación
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *con excepción justificada, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *describe acceso, copias, correo y configuración en términos de oficina; los nombres de fichero se limitan a la evidencia*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0 marcadores)
- [x] Requirements are testable and unambiguous (10 FR; FR-009 y FR-010 marcados «sin test»)
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (6 historias)
- [x] Edge cases are identified
- [x] Scope is clearly bounded (sección «Fuera de alcance» con el plan técnico y las specs 001 a 009)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notes

- **Excepción en «sin detalles de implementación»**: es una spec de ingeniería inversa. La Constitución (Principio II) exige citar fichero y función como evidencia. Esas referencias son evidencia, no instrucciones de construcción.
- **Sin reglas de negocio (RN)**: esta spec recoge decisiones operativas; la partición la define así.
- **Datos sensibles**: la spec no reproduce usuarios, claves ni contraseñas de `config.js`; solo el servidor y el puerto del correo.
- **Hueco de protección**: el golden master **no** cubre esta spec. Sin test alguno: A-18, A-51 y la razón y la ruta real de A-56 (FR-009, FR-010 y parte de FR-008).
- **Condición previa transversal**: A-18 es **bloqueante** para aprobar las demás specs (P20): hay que obtener una copia real de la BD y repetir las comprobaciones AD-01 a AD-15.
- **Pendientes que NO bloquean la redacción pero sí la aprobación**: A-18, A-46, A-48, A-51 y A-56 siguen PENDIENTE en el registro; no hay testigo NEGOCIO con nombre (PD-08).
