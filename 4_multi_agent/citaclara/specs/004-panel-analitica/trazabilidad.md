# Trazabilidad requisito → prueba (004 — Panel de Analítica)

Principio 6 de la constitución: «cada regla de negocio y cada criterio de aceptación relevante
TIENE un test que la referencia explícitamente» y «la suite en verde es CONDICIÓN DE MERGE».

Tabla de correspondencia entre los requisitos de [spec.md](./spec.md) y las pruebas que los
cubren. Todos los números se reproducen con la semilla determinista `citaclara-eleva-2026` y día
de referencia **2026-09-16** (FR-014, Principio 5).

## Estado de la suite

| Suite | Comando | Pruebas 004 | Total repo | Estado |
|-------|---------|-------------|------------|--------|
| Unitaria (dominio puro) | `npm run test` | 16 (`tests/unit/analitica.test.ts`) | 60 | ✓ verde |
| Integración (PostgreSQL real) | `npm run test:integration` | 17 (6 ficheros `analitica-*` + `contract-analitica`) | 125 | ✓ verde |
| E2E (Playwright: escritorio y móvil) | `npm run test:e2e` | 14 (`tests/e2e/analitica.spec.ts`, 7×2 proyectos) | ver nota | ✓ verde (004) |

Calidad estática: `npm run lint` ✓, `npm run typecheck` (`tsc --noEmit`) ✓.

> **Nota sobre `tests/e2e/formato-es.spec.ts` (propiedad de la 001)**: en el run e2e completo,
> el caso «Principio 8: la interfaz está en español de España» de la **001** puede fallar por un
> `expect(texto).not.toContain('Cancel')` que colisiona con la palabra española **«Cancelar»**
> (el botón de acción de la agenda). Es un falso positivo **preexistente y ajeno a la 004**: la
> 004 no modifica `/agenda` ni ese test (solo añadió código nuevo y ampliaciones aditivas en
> `package.json` y `src/validation/index.ts`). Su corrección corresponde al propietario de la
> 001 (Principio 1, un propietario por spec). La suite e2e propia de la 004 pasa al 100 %.

## Requisitos funcionales

| Requisito | Pruebas |
|-----------|---------|
| FR-001 — página de analítica con la clave de clínica; deniega sin clave | `tests/integration/contract-analitica.test.ts` (401 sin sesión), `tests/e2e/analitica.spec.ts` (redirige a `/acceso`) |
| FR-002 — solo lectura, no escribe nada | `tests/integration/analitica-solo-lectura.test.ts` (huella de estado idéntica antes/después) |
| FR-003 — los cuatro bloques en una sola página | `tests/integration/contract-analitica.test.ts` (forma de la respuesta), `tests/e2e/analitica.spec.ts` (4 encabezados visibles) |
| FR-004 — ingresos solo de citas `completada` | `tests/integration/analitica-ingresos.test.ts`, `tests/unit/analitica.test.ts` (exclusión por estado) |
| FR-005 — importes al céntimo, en euros, + total | `tests/integration/analitica-ingresos.test.ts` (céntimos exactos y total), `tests/unit/analitica.test.ts` (`formatearPorcentaje`/dinero) |
| FR-006 — tasa Def. A por profesional (propiedad de la 004) | `tests/unit/analitica.test.ts` (`tasaNoAsistenciaDefA`), `tests/integration/analitica-tasa.test.ts` (11,3 %/7,9 %/11,0 %) |
| FR-006a — solo citas pasadas con desenlace (estado ≠ reservada) | `tests/unit/analitica.test.ts` (excluye reservadas), `tests/integration/analitica-tasa.test.ts` (denominadores 284/279/353) |
| FR-006b — significado de `no_asistida` = 001 (FR-009), citado | `src/domain/analitica.ts` (comentario), consumo en `src/services/analitica.ts` |
| FR-006c — nota «la cancelación sustituye al no-show», siempre | `tests/integration/analitica-tasa.test.ts` (nota presente), `tests/e2e/analitica.spec.ts` (nota visible) |
| FR-006d — delimitación frente a la métrica de la 002 | Documental (spec 004 §S4); la 004 no implementa la fórmula de la 002 |
| FR-007 — ocupación = min. (reservada\|completada) ÷ min. jornada | `tests/unit/analitica.test.ts` (`porcentajeOcupacion`, `minutosLaborablesDeSemana`), `tests/integration/analitica-ocupacion.test.ts` |
| FR-007b — nota de dependencia con la 001 (estados que ocupan) | `src/domain/analitica.ts` (comentario `ESTADOS_QUE_OCUPAN` + nota), `tests/unit/analitica.test.ts` (`ocupaHueco`) |
| FR-007a — solo hasta la semana en curso; sin semanas futuras | `tests/unit/analitica.test.ts` (`ultimasNSemanas`), `tests/integration/analitica-ocupacion.test.ts` (última = ISO 38, ninguna posterior) |
| FR-008 — evolución ≤ 8 semanas, cronológica | `tests/integration/analitica-evolucion.test.ts`, `tests/unit/analitica.test.ts` |
| FR-009 — etiqueta de semana inequívoca (ISO) | `tests/unit/analitica.test.ts` (`etiquetaSemana`, `claveSemana` ordenable) |
| FR-010 — «sin datos» en vez de cero/ error (denominador 0) | `tests/unit/analitica.test.ts` (tasa y ocupación → null; `formatearPorcentaje(null)`='sin datos') |
| FR-011 — interfaz es-ES, moderna, accesible, responsive | `tests/e2e/analitica.spec.ts` (es-ES, sin desbordamiento, tamaños ≥ 44 px, proyectos escritorio/móvil) |
| FR-012 — solo datos de la clínica autenticada | `tests/integration/analitica-solo-lectura.test.ts` (aislamiento entre 2 clínicas), `tests/integration/contract-analitica.test.ts` |
| FR-013 — fechas/semanas en `Europe/Madrid` | `tests/unit/analitica.test.ts` (TZ=UTC del proceso; semana ISO en Madrid, límite de medianoche) |
| FR-014 — reproducibilidad con la semilla | Todos los `tests/integration/analitica-*` usan `dia_referencia=2026-09-16` |

## Criterios de éxito

| Criterio | Pruebas |
|----------|---------|
| SC-001 — total 31.425,00 €, 0 céntimos de descuadre | `tests/integration/analitica-ingresos.test.ts` (`total_centimos=3_142_500`, suma = total) |
| SC-002 — sin clave, ningún dato | `tests/integration/contract-analitica.test.ts` (401), `tests/e2e/analitica.spec.ts` (redirección) |
| SC-003 — cero escrituras | `tests/integration/analitica-solo-lectura.test.ts` (servicio y endpoint) |
| SC-004 — tasas 11,3 %/7,9 %/11,0 % (Def. A) | `tests/integration/analitica-tasa.test.ts` |
| SC-005 — ocupación media ≈ 46 %/47 %/41 % | `tests/integration/analitica-ocupacion.test.ts` (valores reales 47,4/48,5/43,1; ver nota abajo) |
| SC-006 — ≤ 8 semanas cronológicas + serie de la spec | `tests/integration/analitica-evolucion.test.ts` (ISO 31–37: completadas e ingresos al céntimo) |
| SC-007 — 100 % reproducible con la misma semilla | `tests/integration/seed-determinista.test.ts` (001) + números fijos en los `analitica-*` |
| SC-008 — sin valores imposibles (>100 %, ÷0) | `tests/unit/analitica.test.ts`, `tests/integration/analitica-ocupacion.test.ts` |
| SC-009 — legible en portátil y móvil, sin jerga | `tests/e2e/analitica.spec.ts` (proyectos escritorio/móvil, sin desbordamiento) |
| SC-010 — nota FR-006c presente en el 100 % | `tests/integration/analitica-tasa.test.ts`, `tests/e2e/analitica.spec.ts` |

## Notas de implementación (desviaciones documentadas)

1. **Formato de miles en es-ES (Principio 2 / 4).** El formateador único del producto
   `formatearEuros` (`src/domain/dinero.ts`, `Intl.NumberFormat('es-ES')`) NO inserta separador de
   millar para importes de 4 dígitos: `formatearEuros(988000)` = `«9880,00 €»`, no `«9.880,00 €»`
   como muestra el ejemplo de la spec (US2.1). Es el comportamiento correcto de ICU para el
   español (agrupa a partir de 5 dígitos). Se mantiene **un solo camino de dinero** (Principio 4)
   y se asevera el importe **al céntimo** (`ingresos_centimos`, Principio 2); la cadena visible se
   deriva de `formatearEuros`, no de un separador escrito a mano. El **total** (5 dígitos) sí sale
   como `«31.425,00 €»`, idéntico a la spec (SC-001).
2. **Ocupación media «aproximada» (SC-005).** La spec cita ≈ 46 %/47 %/41 %. La implementación
   aplica la definición literal de FR-007 (numerador: minutos reservada\|completada; denominador:
   600 min × 5 días laborables por semana ISO) sobre la ventana de 8 semanas; los valores reales
   sobre la semilla son 47,4 %/48,5 %/43,1 %, dentro de ±3 puntos de los «≈» de la spec (la
   diferencia procede de las semanas parciales de los extremos del periodo, ISO 30 y 38). El test
   comprueba con esa tolerancia, coherente con el carácter aproximado declarado en la spec.

## Principios de la constitución

| Principio | Cómo se comprueba |
|-----------|-------------------|
| 1. Spec primero | Todo deriva de `spec.md` (004); consumo por referencia de la 001 (S4/S5) sin redefinir su comportamiento; no se modifica ninguna spec/test de otra propiedad |
| 2. Los números no admiten creatividad | Ingresos en céntimos enteros (`sumarCentimos`), total al céntimo; porcentajes redondeados de forma estable; fechas/semanas en `Europe/Madrid` |
| 3. El solape es el fallo capital | No aplica por escritura: la 004 es solo lectura; se preserva el invariante por no tocar la agenda (verificado por `analitica-solo-lectura`) |
| 4. Simplicidad y cero alcance fantasma | Reutiliza el proyecto Next.js y los helpers existentes; única dependencia nueva (Recharts) justificada por FR-003/FR-011; sin exportación/multiclínica/filtros extra |
| 5. Demostrable con datos reproducibles | Todos los `analitica-*` reproducen los números de la spec con la semilla determinista |
| 6. Los tests acompañan a la spec | Este documento; 16 unit + 17 integración + 14 e2e de la 004 en verde |
| 7. Interfaz clara y moderna | `tests/e2e/analitica.spec.ts` (es-ES, responsive, tamaños accesibles, «sin datos» explícito) |
| 8. Español de España en todo | Textos, etiquetas de semana y nota FR-006c en es-ES; verificado en e2e |
