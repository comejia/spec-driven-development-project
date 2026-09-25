# MAPA de Specs — CitaClara

Mapa global de las especificaciones de CitaClara. Es la fuente de verdad de la **propiedad**
(constitución, Principio 1: Spec Primero — un único propietario por spec) y de las **relaciones**
entre specs (qué consume cada una y quién la consume).

Regla: **un único propietario por spec**. Todo cambio de comportamiento de una spec lo coordina
su propietario. Toda spec nueva se añade a esta tabla en el momento de su creación
(`/speckit.specify`).

Leyenda de estado: **borrador** = redactada, aún sin revisión formal · **en revisión** =
en clarificación/plan o resolviendo conflictos · **implementada** = spec estable con código y
tests en verde que la referencian.

## Tabla global

| # | Nombre | Directorio | Propietario | Estado | Consume (depende de) | Consumida por |
|---|--------|------------|-------------|--------|----------------------|---------------|
| 001 | Núcleo de Agenda | `specs/001-agenda-core` | recepción-core (por asignar nominalmente) | implementada | — | 002, 003, 004, 005 |
| 002 | Recordatorios de Cita | `specs/002-recordatorios-cita` | recordatorios (por asignar nominalmente) | en revisión | 001, 004, 005 | — |
| 003 | Portal del Paciente | `specs/003-portal-paciente` | portal (por asignar nominalmente) | en revisión | 001, 005 | — |
| 004 | Panel de Analítica | `specs/004-panel-analitica` | analítica (por asignar nominalmente) | implementada | 001 | 002 (remite a su métrica) |
| 005 | Acceso y cancelación del paciente | `specs/005-acceso-cancelacion-paciente` | acceso-paciente (por asignar nominalmente) | implementada | 001 | 002, 003 |

> Documento de contexto (no es una feature): `specs/000-revision-cruzada-jul2026.md` es el
> informe de revisión cruzada (jul 2026) que detecta los solapamientos entre specs. La 005 se
> crea para resolver S1 (política de cancelación) y S3 (acceso del paciente), y consolida por
> referencia S2/S7 (ciclo de vida y concurrencia, propiedad de 001).

## Matriz de propiedad de conceptos (un concepto → un dueño)

| Concepto | Propietario | Consumidores |
|----------|-------------|--------------|
| Ciclo de vida y transición `reservada→cancelada` + liberación de hueco + atomicidad/idempotencia | 001 | 002, 003, 005 |
| Estado/significado de `no_asistida` | 001 | 002, 004 |
| Estados que ocupan hueco (reservada + completada, FR-010 RN1) | 001 | 004 |
| Semántica "mover cita = cancelar + crear" | 001 | 002 |
| Acceso del paciente sin cuenta (`/p/[token]`, token opaco, regeneración) | 005 | 002, 003 |
| Política de cancelación del paciente (umbral único de 24 h) | 005 | 002, 003 |
| Métrica oficial "tasa de no asistencia" (Definición A) | 004 | 002 (remite) |
| Métrica de eficacia del recordatorio | 002 | — |

## Dominio de cada spec (una frase)

**001 — Núcleo de Agenda**: la agenda de la clínica gestionada por recepción (clínicas,
profesionales, servicios, pacientes y citas con estados), incluyendo la regla capital anti-solape
y el ciclo de vida de la cita del que dependen todas las demás specs.

**002 — Recordatorios de Cita**: el proceso diario que envía un único recordatorio por email a
cada cita reservada de las próximas 24–48 horas para reducir la no asistencia, delegando el acceso
y la cancelación del paciente en la 005 y la transición de estado en la 001.

**003 — Portal del Paciente**: la página personal donde el paciente ve sus citas futuras y pasadas
y puede cancelar una cita futura desde el móvil, consumiendo el acceso (`/p/[token]`) y la política
de cancelación definidos por la 005 y la transición de estado de la 001.

**004 — Panel de Analítica**: el panel de solo lectura que muestra a la clínica su ocupación,
ingresos por servicio y la tasa oficial de no asistencia (Definición A), calculados sobre los
estados y conceptos de ocupación propiedad de la 001.

**005 — Acceso y cancelación del paciente**: la fuente de verdad de cómo un paciente accede a sus
datos sin cuenta (un enlace estable `/p/[token]`) y cuándo puede cancelar (umbral único de 24 h),
que 002 y 003 consumen y nunca redefinen.

## Notas

- Cuando se asigne un propietario nominal, sustituir el marcador de la columna "Propietario" por
  la persona o agente responsable.
- Las relaciones de "Consume"/"Consumida por" se mantienen coherentes con la matriz de propiedad
  de conceptos; ningún consumidor redefine un concepto ajeno (constitución: un propietario por
  spec).
