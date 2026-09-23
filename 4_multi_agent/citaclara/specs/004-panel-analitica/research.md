# Research — Panel de Analítica (004)

**Fase 0 de `/speckit.plan`.** Consolida las decisiones técnicas. No queda ningún
`NEEDS CLARIFICATION`: la spec resolvió las definiciones de negocio (P1/P2 y S4/S5) y el resto
se resuelve reutilizando la arquitectura de la 001.

## D1 — Reutilizar el stack y el modelo de datos de la 001

- **Decisión**: no introducir proyecto ni base de datos nuevos. La 004 consulta el esquema
  existente (`clinica`, `profesional`, `servicio`, `cita`) con Drizzle, en modo solo `SELECT`.
- **Rationale**: Principio 4 (simplicidad, cero alcance fantasma). La 004 "no crea entidades
  nuevas; solo lee y agrega las de la 001" (spec, Key Entities). Evita duplicar autenticación,
  zona horaria y helpers de dinero.
- **Alternativas descartadas**: microservicio de analítica o almacén de métricas
  precalculadas (over-engineering para ~1.100 citas; añade superficie de fallo y desincroniza
  los números respecto a la fuente viva).

## D2 — Carácter de solo lectura garantizado por construcción

- **Decisión**: la capa de la 004 (dominio, servicio, Route Handler, UI) **no expone ninguna
  operación de escritura**. El servicio solo emite `SELECT`. Un test de integración
  (`analitica-solo-lectura`) compara el estado de la clínica (conteos y hash de `cita`) antes y
  después de ejercitar todos los cálculos y controles (SC-003).
- **Rationale**: FR-002 es "el capital de esta feature". Garantizarlo por ausencia de código de
  escritura es más fuerte que por convención.
- **Alternativas descartadas**: usuario de BD de solo lectura a nivel de despliegue (útil como
  defensa en profundidad, pero es configuración de entorno; no sustituye a no escribir código).

## D3 — Ingresos exactos al céntimo con enteros

- **Decisión**: los ingresos por servicio se suman en **céntimos enteros** (`servicio.precioCentimos`)
  agregando en SQL por servicio y sumando en la aplicación con `sumarCentimos`; se formatea con
  `formatearEuros` (es-ES). Solo cuentan citas en estado `completada` (FR-004).
- **Rationale**: Principio 2 y helpers de dinero existentes. El total 31.425,00 € debe cuadrar
  al céntimo con el desglose (SC-001). Los enteros evitan errores de coma flotante.
- **Alternativas descartadas**: `SUM` en tipo `numeric` de Postgres devuelto como string y
  reconvertido (funcionaría, pero mezcla dos caminos de dinero; mantener un solo camino de
  céntimos enteros es más simple y ya probado en la 001).

## D4 — Definición A de la tasa de no asistencia (propiedad de la 004)

- **Decisión**: por profesional, `tasa = no_asistida ÷ (completada + cancelada + no_asistida)`
  sobre citas pasadas con desenlace (estado ≠ `reservada`), en porcentaje. Se calcula en el
  dominio a partir de conteos agregados por estado; si el denominador es 0 → "sin datos"
  (no 0 %, no error). Se acompaña siempre de la nota FR-006c.
- **Rationale**: FR-006/FR-006a; la 004 es propietaria única de la métrica (S4). Se cita el
  significado de `no_asistida` de la 001 (FR-009) sin redefinirlo (FR-006b).
- **Alternativas descartadas**: Definición B (excluye canceladas del denominador) — la spec la
  documenta solo como contraste, no es la oficial.

## D5 — Ocupación por profesional y semana

- **Decisión**: `ocupación = minutos de citas (reservada|completada) ÷ minutos de jornada`,
  jornada 09:00–19:00 en días laborables (600 min/día laborable), por semana ISO. Los estados
  que ocupan hueco se **consumen por referencia a la 001 (FR-010, RN1)** = `reservada` +
  `completada`; la 004 no publica una constante propia (S5). Solo se pintan semanas hasta la
  semana en curso (FR-007a). Si no hay jornada esa semana → "sin datos"; nunca > 100 %.
- **Rationale**: definición acordada en Clarifications 2026-09-19; nota de dependencia FR-007b.
- **Alternativas descartadas**: usar `ESTADOS_ACTIVOS` de `schema.ts` como fuente autoritativa
  con nombre propio — la spec exige describir el conjunto citando su fuente real (001), no
  inventar/atribuir una constante; el valor es el mismo, pero la propiedad conceptual es de 001.

## D6 — Semanas ISO como etiqueta inequívoca

- **Decisión**: identificar cada semana por su **semana ISO-8601** (lunes–domingo) calculada en
  `Europe/Madrid` con `getISOWeek`/`startOfISOWeek` de date-fns; se etiqueta de forma legible
  para España (p. ej. "Semana 33 · 11–17 ago"). La evolución muestra como máximo 8 semanas
  hacia atrás desde la semana en curso, ordenadas cronológicamente (FR-008/FR-009, SC-006).
- **Rationale**: los números de referencia de la spec usan semanas ISO (31–37). ISO evita
  ambigüedad entre dos personas (FR-009).
- **Alternativas descartadas**: ventana móvil de 56 días con etiqueta por fecha de inicio —
  válida pero no reproduce las etiquetas ISO de los ejemplos; la spec permite decidirlo en el
  plan, y ISO es lo más inequívoco y coincide con los datos citados.

## D7 — Recharts para los gráficos

- **Decisión**: usar **Recharts** (SVG, React) para ocupación y evolución, en componentes
  cliente aislados; las tarjetas de ingresos y tasa pueden ser tabla/gráfico simple. El cálculo
  siempre en el servidor; el cliente solo pinta datos ya agregados.
- **Rationale**: FR-003/FR-011 (gráficos claros, accesibles, responsive). Única dependencia
  nueva, justificada (Principio 4). SVG es accesible y responsive por defecto.
- **Alternativas descartadas**: Chart.js (canvas, menos accesible/semántico); construir SVG a
  mano (más coste, menos mantenible sin ganancia).

## D8 — Autenticación reutilizada (clave de clínica)

- **Decisión**: proteger la página con el guard de sesión existente
  (`clinicaDeSesionEnServidor` en Server Component; `exigirClinicaDeSesion` en el Route
  Handler). Sin sesión válida → redirección a `/acceso` y ningún dato (FR-001, SC-002).
- **Rationale**: FR-001 exige la MISMA clave que la agenda (001, FR-018); no se crean usuarios,
  roles ni permisos nuevos (Assumptions de la spec).
- **Alternativas descartadas**: middleware nuevo o token distinto — innecesario y contrario a la
  simplicidad y a la Assumption de reutilizar la autenticación existente.
