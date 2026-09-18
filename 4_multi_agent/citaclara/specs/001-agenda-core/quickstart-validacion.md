# Constancia de validación del quickstart (001 — Núcleo de Agenda)

**Fecha de ejecución**: 2026-09-17
**Entorno**: Node.js 22.23, PostgreSQL 16 (contenedor `postgres:16-alpine`), navegadores Chromium
(Playwright 1.63), zona de negocio `Europe/Madrid`.

Este documento deja constancia de la ejecución de los escenarios V1–V12 de
[quickstart.md](./quickstart.md). Cada escenario indica cómo se comprobó y con qué resultado.
Los escenarios están cubiertos por pruebas automáticas, de modo que la validación es repetible
por cualquier persona o agente con `npm run test`, `npm run test:integration` y `npm run test:e2e`.

## Puesta en marcha

| Paso | Comando | Resultado |
|------|---------|-----------|
| 1. Dependencias | `npm install` | 619 paquetes instalados |
| 2. PostgreSQL 16 | `docker compose up -d` | contenedor `citaclara-postgres` sano (puerto 5433) |
| 3. Migraciones | `npm run db:migrate` | «Migraciones aplicadas correctamente»; `btree_gist` activa y restricciones `cita_sin_solape_profesional` y `cita_sin_solape_paciente` creadas (`contype = x`) |
| 4. Semilla | `npm run db:seed` | Clínica Eleva, 3 profesionales, 4 servicios, 40 pacientes, 1141 citas (2026-07-24 → 2026-10-02) |
| 5. Aplicación | `npm run dev` | panel accesible en `/acceso` y `/agenda` |

Reejecutar los pasos 3 y 4 produce el mismo resultado (migraciones idempotentes y misma
historia), lo que se comprobó ejecutándolos dos veces: ambas ejecuciones dieron 1141 citas y
31.425,00 € de ingresos en citas completadas.

## Escenarios de validación

| Escenario | Comprobación | Resultado |
|-----------|--------------|-----------|
| **V1** — Acceso por clave (FR-018, US4) | `tests/integration/contract-acceso.test.ts` (8 pruebas) y `tests/e2e/acceso.spec.ts` (7 pruebas × 2 dispositivos) | ✅ Clave correcta concede acceso; clave incorrecta o vacía lo deniega y no muestra ninguna agenda |
| **V2** — Agenda del día (FR-015/016/016a, US2) | `tests/integration/contract-agenda.test.ts` (10 pruebas) y `tests/e2e/agenda-dia.spec.ts` (7 pruebas × 2) | ✅ Citas en orden cronológico con inicio, fin, servicio, paciente y estado; franja 08:00–21:00; libre/ocupado diferenciado; agendas de profesionales disjuntas |
| **V3** — Alta válida (FR-005/005a/006/007, US1) | `tests/integration/citas-alta.test.ts` (6) y `tests/integration/contract-citas.test.ts` | ✅ Sesión de fisioterapia de 45 min a las 10:00 → fin 10:45, estado `reservada`. Inicio 10:07 → `GRANULARIDAD_INVALIDA` (422) |
| **V4** — Anti-solape del profesional (RN1, FR-010/012) | `tests/integration/citas-solape-profesional.test.ts` (11) | ✅ Solape parcial, exacto y por contención rechazados con `SOLAPE_PROFESIONAL`; cita adyacente a las 10:45 aceptada |
| **V5** — Concurrencia del mismo hueco (RN1, FR-011) | `tests/integration/citas-concurrencia.test.ts` (5) | ✅ Dos altas simultáneas → exactamente una `201` y una `409`; con seis intentos simultáneos solo una cita queda registrada |
| **V6** — Anti-solape del paciente (FR-012a) | `tests/integration/citas-solape-paciente.test.ts` (8) | ✅ Cita solapada del mismo paciente con otro profesional rechazada con `SOLAPE_PACIENTE` |
| **V7** — No citas en el pasado (RN2, FR-013) | `tests/integration/citas-validacion.test.ts` (11) | ✅ Inicio anterior a ahora rechazado con `CITA_EN_PASADO` y sin dejar rastro en la agenda |
| **V8** — Estados de la cita (FR-008/009/017, US3) | `tests/unit/estado-cita.test.ts` (7), `tests/integration/contract-estado.test.ts` (10), `tests/integration/estado-libera-hueco.test.ts` (6), `tests/e2e/estados-cita.spec.ts` (5 × 2) | ✅ Transiciones válidas desde `reservada`; estados finales rechazados con `TRANSICION_INVALIDA`; tras cancelar o marcar no asistida el hueco admite una cita nueva |
| **V9** — Unicidad de teléfono (FR-004a) | `tests/integration/contract-pacientes.test.ts` (12) | ✅ Teléfono repetido en la clínica rechazado con `TELEFONO_DUPLICADO` |
| **V10** — Exactitud numérica y temporal (FR-019) | `tests/unit/dinero.test.ts` (9), `tests/unit/tiempo.test.ts` (17), `tests/e2e/formato-es.spec.ts` (8 × 2) | ✅ Importes al céntimo en formato español («40,00 €») y fechas/horas 24 h sin ambigüedad; sin restos de am/pm ni punto decimal |
| **V11** — Reproducibilidad de la semilla (SC-007, FR-021) | `tests/integration/seed-determinista.test.ts` (10) y doble ejecución de `npm run db:seed` | ✅ Misma semilla → historia idéntica (citas, fechas, estados e importes); semilla distinta → historia distinta |
| **V12** — Calidad de interfaz (SC-005/006/008) | `tests/e2e/accesibilidad.spec.ts` (9 × 2), `tests/e2e/alta-flujo.spec.ts` (4 × 2) | ✅ Contraste AA en texto, botón primario y texto secundario; botones ≥ 44 px; todos los campos con etiqueta; sin desbordamiento horizontal en portátil (1440×900) ni en móvil (Pixel 7); alta de cita en 4 interacciones (límite: 5) |

## Resultado de la suite completa

```text
Unitarias      (Vitest)                 44 pruebas  ✓
Integración    (Vitest + Testcontainers) 108 pruebas ✓
E2E            (Playwright, 2 proyectos)  78 pruebas ✓
                                        ---------------
Total                                    230 pruebas ✓
```

`npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores.

**Conclusión**: los doce escenarios del quickstart quedan validados. El invariante capital
(Principio 3) está anclado en PostgreSQL mediante restricciones de exclusión y comprobado con
pruebas hostiles de solape y de concurrencia contra el motor real.
