# Trazabilidad requisito → prueba (001 — Núcleo de Agenda)

Principio 6 de la constitución: «cada regla de negocio y cada criterio de aceptación relevante
TIENE un test que la referencia explícitamente» y «la suite en verde es CONDICIÓN DE MERGE».

Este documento es la tabla de correspondencia entre los requisitos de [spec.md](./spec.md) y las
pruebas que los cubren. Todas las pruebas citan su requisito en el nombre o en el comentario de
cabecera, de modo que la relación es verificable en el propio código.

## Estado de la suite (condición de merge)

| Suite | Comando | Pruebas | Estado |
|-------|---------|---------|--------|
| Unitaria (dominio puro) | `npm run test` | 44 | ✓ verde |
| Integración (PostgreSQL real, Testcontainers) | `npm run test:integration` | 108 | ✓ verde |
| E2E (Playwright: portátil y móvil) | `npm run test:e2e` | 78 | ✓ verde |
| **Total** | `npm run test:all` | **230** | **✓ verde** |

Calidad estática: `npm run lint` ✓, `npx tsc --noEmit` ✓, `npm run build` ✓.

## Reglas de negocio capitales

| Regla | Dónde se garantiza | Pruebas |
|-------|--------------------|---------|
| **RN1 — El solape es el fallo capital** (FR-010/011) | Restricción `EXCLUDE USING gist (profesional_id WITH =, franja WITH &&)` en `src/db/migrations/0001_invariantes_agenda.sql`; el motor la evalúa de forma atómica | `tests/integration/citas-solape-profesional.test.ts` (11), `tests/integration/citas-concurrencia.test.ts` (5, pruebas hostiles con altas simultáneas), `tests/integration/contract-citas.test.ts`, `tests/e2e/alta-flujo.spec.ts` |
| **RN2 — No hay citas en el pasado** (FR-013) | `src/services/crear-cita.ts` compara el inicio con «ahora» | `tests/integration/citas-validacion.test.ts` |

## Requisitos funcionales

| Requisito | Pruebas |
|-----------|---------|
| FR-001/002/003 — aprovisionamiento de clínica, profesionales y servicios | `tests/integration/seed-determinista.test.ts` (catálogo literal de la spec) |
| FR-004 — fichas de paciente | `tests/integration/contract-pacientes.test.ts` |
| FR-004a — teléfono único por clínica | `tests/integration/contract-pacientes.test.ts` (`TELEFONO_DUPLICADO`), `tests/integration/seed-determinista.test.ts` |
| FR-005 — alta con profesional, servicio, paciente e inicio | `tests/integration/citas-alta.test.ts`, `tests/integration/contract-citas.test.ts` |
| FR-005a — granularidad de 5 minutos | `tests/unit/tiempo.test.ts`, `tests/integration/citas-validacion.test.ts`, `tests/integration/contract-citas.test.ts`, `tests/e2e/alta-flujo.spec.ts`; además `CHECK cita_granularidad_5min` en el esquema |
| FR-006 — fin derivado de la duración | `tests/unit/tiempo.test.ts` (`calcularFin`), `tests/integration/citas-alta.test.ts`, `tests/integration/contract-citas.test.ts` (el `fin` enviado por el cliente se ignora) |
| FR-007 — estado inicial `reservada` | `tests/unit/estado-cita.test.ts`, `tests/integration/citas-alta.test.ts` |
| FR-008 — transiciones válidas solo desde `reservada` | `tests/unit/estado-cita.test.ts`, `tests/integration/contract-estado.test.ts`, `tests/e2e/estados-cita.spec.ts` |
| FR-009 — «no asistida» solo desde `reservada` | `tests/unit/estado-cita.test.ts`, `tests/integration/contract-estado.test.ts`, `tests/e2e/estados-cita.spec.ts` |
| FR-010 — sin solapes del profesional; cancelada y no asistida liberan hueco | `tests/integration/citas-solape-profesional.test.ts`, `tests/integration/estado-libera-hueco.test.ts`, `tests/e2e/estados-cita.spec.ts` |
| FR-011 — reservas simultáneas del mismo hueco | `tests/integration/citas-concurrencia.test.ts`, `tests/integration/contract-citas.test.ts` |
| FR-012 — intervalos `[inicio, fin)`: las adyacentes no solapan | `tests/unit/solape.test.ts`, `tests/integration/citas-solape-profesional.test.ts` |
| FR-012a — sin solapes del paciente entre profesionales | `tests/integration/citas-solape-paciente.test.ts`, `tests/integration/contract-citas.test.ts` |
| FR-013 — no citas en el pasado | `tests/integration/citas-validacion.test.ts`, `tests/integration/contract-citas.test.ts` |
| FR-014 — datos incompletos o paciente inexistente | `tests/integration/citas-validacion.test.ts`, `tests/integration/contract-citas.test.ts` |
| FR-015 — agenda del día con inicio, fin, servicio, paciente y estado | `tests/integration/contract-agenda.test.ts`, `tests/e2e/agenda-dia.spec.ts` |
| FR-016 — libre vs. ocupado y solo el profesional elegido | `tests/integration/contract-agenda.test.ts`, `tests/e2e/agenda-dia.spec.ts`, `tests/e2e/accesibilidad.spec.ts` (distinción también por texto) |
| FR-016a — franja fija 08:00–21:00 | `tests/unit/tiempo.test.ts`, `tests/integration/contract-agenda.test.ts`, `tests/e2e/agenda-dia.spec.ts` |
| FR-017 — marcar estado desde la agenda | `tests/integration/contract-estado.test.ts`, `tests/e2e/estados-cita.spec.ts` |
| FR-017a — sin reprogramación: cancelar y crear de nuevo | `tests/integration/estado-libera-hueco.test.ts` |
| FR-018 — clave de clínica obligatoria | `tests/integration/contract-acceso.test.ts`, `tests/e2e/acceso.spec.ts`; además todos los contract tests comprueban el `401 NO_AUTORIZADO` sin sesión |
| FR-019 — importes al céntimo y fechas/horas inequívocas | `tests/unit/dinero.test.ts`, `tests/unit/tiempo.test.ts`, `tests/integration/contract-agenda.test.ts`, `tests/e2e/formato-es.spec.ts` |
| FR-020 — interfaz en es-ES, sin jerga, portátil y móvil | `tests/e2e/alta-flujo.spec.ts`, `tests/e2e/accesibilidad.spec.ts`, `tests/e2e/formato-es.spec.ts` (proyectos `escritorio` y `movil`) |
| FR-021 — datos de demostración deterministas | `tests/integration/seed-determinista.test.ts` |

## Criterios de éxito

| Criterio | Pruebas |
|----------|---------|
| SC-004 — exactitud de presentación | `tests/e2e/formato-es.spec.ts`, `tests/unit/dinero.test.ts` |
| SC-005 — alta en ≤ 5 interacciones sin pasos técnicos | `tests/e2e/alta-flujo.spec.ts` (contador explícito de interacciones: 4), `tests/e2e/accesibilidad.spec.ts` (tamaños de pulsación) |
| SC-006 — uso en portátil y móvil | proyectos `escritorio` (1440×900) y `movil` (Pixel 7) de `playwright.config.ts`; `tests/e2e/agenda-dia.spec.ts`, `tests/e2e/accesibilidad.spec.ts` |
| SC-007 — reproducibilidad de la semilla | `tests/integration/seed-determinista.test.ts` |
| SC-008 — contraste y tamaños accesibles | `tests/e2e/accesibilidad.spec.ts` (contraste WCAG calculado en el navegador) |

## Principios de la constitución

| Principio | Cómo se comprueba |
|-----------|-------------------|
| 1. Spec primero | Todo el código deriva de `spec.md`; las desviaciones detectadas durante la implementación se corrigieron a favor de la spec (catálogo de servicios: 50,00 € y «Primera visita de nutrición») |
| 2. Los números no admiten creatividad | `tests/unit/dinero.test.ts` (enteros de céntimos), `tests/unit/tiempo.test.ts` (Europe/Madrid, horario de verano e invierno, día de 25 horas) |
| 3. El solape es el fallo capital | Restricciones de exclusión en el esquema + `citas-solape-profesional`, `citas-solape-paciente` y `citas-concurrencia` contra PostgreSQL real |
| 4. Simplicidad y cero alcance fantasma | Un único proyecto Next.js; selector nativo en lugar de menú personalizado; solo las dependencias usadas (se retiraron las que no se usan) |
| 5. Demostrable con datos reproducibles | `src/seed/seed.ts` con PRNG sembrado (incluida la sal del hash) + `seed-determinista.test.ts` |
| 6. Los tests acompañan a la spec | Este documento; 230 pruebas en verde |
| 7. Interfaz clara y moderna | `tests/e2e/accesibilidad.spec.ts` y `tests/e2e/alta-flujo.spec.ts` (sin jerga técnica) |
| 8. Español de España en todo | `tests/e2e/formato-es.spec.ts`; catálogo de errores es-ES en `src/domain/errores.ts` |
