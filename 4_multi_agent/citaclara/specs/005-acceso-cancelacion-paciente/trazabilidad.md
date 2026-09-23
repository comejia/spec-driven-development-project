# Trazabilidad requisito → prueba (005 — Acceso y cancelación del paciente)

Principio 6 de la constitución: «cada regla de negocio y cada criterio de aceptación relevante
TIENE un test que la referencia explícitamente» y «la suite en verde es CONDICIÓN DE MERGE».

Este documento relaciona los requisitos de [spec.md](./spec.md) con las pruebas que los cubren.
Todas las pruebas citan su requisito en el nombre o en el comentario de cabecera.

## Estado de la suite

| Suite | Comando | Pruebas de 005 | Estado |
|-------|---------|----------------|--------|
| Unitaria (dominio puro) | `npm run test` | token (6) + política (9) | ✓ verde (59 en total) |
| Integración (PostgreSQL real, Testcontainers) | `npm run test:integration` | acceso (7) + cancelación (7) + concurrencia (2) | ✓ verde (124 en total) |
| E2E (Playwright: escritorio y móvil) | `npm run test:e2e` | portal-paciente (8 = 4 × 2 proyectos) | ✓ verde (8/8) |

Calidad estática: `npm run lint` ✓, `npm run typecheck` ✓.

> **Nota sobre la suite E2E completa**: al ejecutar `npm run test:e2e` completo hay 2 fallos en
> `tests/e2e/formato-es.spec.ts:81` («la interfaz está en español de España»), **ajenos a la
> 005**: la aserción `not.toContain('Cancel')` de la **001** choca con su propio botón «**Cancel**ar
> cita» (etiqueta definida en `src/domain/cita.ts`). Es un fallo **preexistente de la 001** (no se
> ha tocado su código ni su test, propiedad de otra spec según `specs/MAPA.md`). Las 8 pruebas E2E
> del portal del paciente (005) pasan al 100 %.

## Reglas de negocio capitales de la 005

| Regla | Dónde se garantiza | Pruebas |
|-------|--------------------|---------|
| **Política única de cancelación (24 h)** (FR-007/008/009) | Función pura `src/domain/politica-cancelacion.ts` (`decidirCancelacion`), usada por la vista y por el servicio | `tests/unit/politica-cancelacion.test.ts` (9, incl. límite exacto de 24 h y borde DST) |
| **Delegación de la transición en la 001** (FR-010/011) | `src/services/cancelar-por-paciente.ts` invoca `cambiarEstado` de 001; la atomicidad/idempotencia la aporta 001 | `tests/integration/cancelacion-paciente.test.ts` (7), `tests/integration/cancelacion-concurrencia.test.ts` (2, prueba hostil) |
| **Denegación neutra** (FR-002) | `src/services/acceso-paciente.ts` (`accesoDenegado`, mismo error para inexistente/manipulado) | `tests/integration/contract-acceso-paciente.test.ts`, `tests/e2e/portal-paciente.spec.ts` |

## Requisitos funcionales

| Requisito | Pruebas |
|-----------|---------|
| FR-001 — token opaco por paciente (1:1) | `tests/unit/token.test.ts`, `tests/integration/contract-acceso-paciente.test.ts` (resuelve token → paciente); `UNIQUE(token)` y `UNIQUE(paciente_id)` en `src/db/migrations/0002_ordinary_the_twelve.sql` |
| FR-002 — denegación neutra (inexistente/manipulado) | `tests/integration/contract-acceso-paciente.test.ts`, `tests/e2e/portal-paciente.spec.ts` («token inválido… vista neutra») |
| FR-003 — solo sus propias citas (aislamiento) | `tests/integration/contract-acceso-paciente.test.ts` («SOLO las citas de su paciente»), `tests/integration/cancelacion-paciente.test.ts` («no da acceso a la cita de otro paciente») |
| FR-004 — regeneración del token | `tests/integration/contract-acceso-paciente.test.ts` («tras regenerar, el enlace antiguo deja de valer…») |
| FR-005 — `/p/[token]` único punto de acceso | `app/p/[token]/page.tsx`; `tests/e2e/portal-paciente.spec.ts` |
| FR-006 — sin cuenta ni contraseña (posesión del token) | `src/services/acceso-paciente.ts` (sin sesión de clínica); `tests/e2e/portal-paciente.spec.ts` |
| FR-007 — umbral único ≥ 24 h (incl. límite exacto) | `tests/unit/politica-cancelacion.test.ts` («límite EXACTO de 24 h»), `tests/integration/cancelacion-paciente.test.ts` |
| FR-008 — bloqueo < 24 h / iniciada + teléfono | `tests/unit/politica-cancelacion.test.ts` (`fuera_de_plazo`/`ya_iniciada`), `tests/integration/cancelacion-paciente.test.ts` (`FUERA_DE_PLAZO`), `tests/e2e/portal-paciente.spec.ts` («muestra el teléfono») |
| FR-009 — solo sobre estado `reservada` | `tests/unit/politica-cancelacion.test.ts` (`estado_no_cancelable`), `tests/integration/cancelacion-paciente.test.ts` (`TRANSICION_INVALIDA` sobre completada) |
| FR-010 — cancelar invocando la 001 (libera hueco) | `tests/integration/cancelacion-paciente.test.ts` («el hueco liberado admite una nueva cita») |
| FR-011 — idempotencia/concurrencia (1 sola efectiva) | `tests/integration/cancelacion-concurrencia.test.ts` (2 pruebas hostiles) |
| FR-012 — coherencia de textos (24 h) | Revisión T027: todos los textos de plazo dicen «24 horas» y remiten al teléfono (`src/domain/errores.ts` `FUERA_DE_PLAZO`, `app/p/[token]/page.tsx`); `tests/e2e/portal-paciente.spec.ts` («menos de 24 horas») |
| FR-013 — es-ES, accesible, responsive | `app/p/[token]/page.tsx` (es-ES, shadcn/ui); `tests/e2e/portal-paciente.spec.ts` en proyectos `escritorio` y `movil` |

## Criterios de éxito (Success Criteria)

| Criterio | Pruebas |
|----------|---------|
| SC-001 — token válido muestra solo sus citas | `tests/integration/contract-acceso-paciente.test.ts` |
| SC-002 — token inválido rechazado sin filtrar | `tests/integration/contract-acceso-paciente.test.ts`, `tests/e2e/portal-paciente.spec.ts` |
| SC-003 — regeneración invalida el antiguo, el nuevo da acceso | `tests/integration/contract-acceso-paciente.test.ts` |
| SC-004 — cancelaciones ≥ 24 h se ejecutan; < 24 h se rechazan | `tests/integration/cancelacion-paciente.test.ts` |
| SC-005 — hueco liberado admite nueva cita | `tests/integration/cancelacion-paciente.test.ts` |
| SC-006 — concurrencia → una sola cancelación efectiva | `tests/integration/cancelacion-concurrencia.test.ts` |
| SC-007 — 100 % textos de plazo comunican 24 h | Revisión T027 (0 textos con plazo distinto); `tests/e2e/portal-paciente.spec.ts` |
| SC-008 — usable y legible en móvil y portátil | `tests/e2e/portal-paciente.spec.ts` (proyectos `escritorio` y `movil`) |

## Datos reproducibles (Principio 5)

La semilla determinista (`src/seed/seed.ts`, `src/seed/datos.ts`) asigna un **token estable** por
paciente y un **teléfono** a la clínica (`910 123 456`). `tests/integration/seed-determinista.test.ts`
sigue en verde: la reproducibilidad de la historia se mantiene tras la extensión de la 005.
