# Implementation Plan: Recordatorios de Cita

**Branch**: `002-recordatorios-cita` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-recordatorios-cita/spec.md`

## Summary

CitaClara 002 entrega los recordatorios de cita por email para reducir la no asistencia. Un
**proceso diario** selecciona las citas en estado `reservada` cuyo inicio cae entre 24 y 48 h por
delante (FR-012), y genera **como máximo un recordatorio por cita en toda su vida** (FR-003,
idempotencia por cita). Sin SMTP configurado, el envío se **simula** escribiendo un fichero `.eml`
por recordatorio en `datos/salida-correo/` (FR-013). El email incluye los datos de la cita y el
**enlace personal de acceso `/p/[token]` del paciente**, que es propiedad de la spec **005**; desde
ahí el paciente puede cancelar cuando la **política de cancelación de 005** (umbral único de 24 h)
lo permita, y dentro de la ventana se le remite al teléfono de la clínica.

Enfoque técnico: reutilizar el proyecto Next.js full-stack de 001 (TypeScript, Drizzle ORM sobre
PostgreSQL, Zod, date-fns-tz, Vitest/Playwright). 002 **consume** y **no reimplementa**:

- **001 (Núcleo de Agenda)**: propietario del ciclo de vida de la cita; la transición
  `reservada → cancelada`, la liberación del hueco y la atomicidad ante concurrencia las aporta
  el servicio de citas de 001 (FR-010/FR-010a de 002; S2/S7 de la revisión cruzada).
- **005 (Acceso y cancelación del paciente)**: propietario del acceso `/p/[token]` y de la política
  de cancelación (24 h). 002 solo incrusta el enlace de 005 y deriva de él los textos (FR-005,
  FR-007, FR-008, FR-009).
- **004 (Panel de Analítica)**: propietario de la tasa oficial de no asistencia; la métrica SC-008
  de 002 es de *eficacia del recordatorio* y remite a 004.

Lo nuevo y propio de 002 es: (a) una **entidad `recordatorio`** que registra que una cita ya fue
recordada (garantía de no duplicación anclada por un índice único), (b) un **servicio de proceso
diario** idempotente y reproducible sobre la semilla determinista (FR-015), y (c) un **emisor de
correo** con un adaptador de salida simulada a fichero `.eml`.

## Technical Context

**Language/Version**: TypeScript 5.9 sobre Node.js ≥ 22 (mismo runtime que 001).

**Primary Dependencies**:
- **Next.js 15** (App Router) como marco del proyecto; el proceso diario se ejecuta como script
  (`tsx`), no como endpoint HTTP público.
- **Drizzle ORM 0.45** + **pg 8** para la tabla `recordatorio` y las consultas de citas elegibles.
- **Zod 4** para validar argumentos del proceso (fecha de ejecución) y la configuración de correo.
- **date-fns-tz 4** para la ventana de 24-48 h y el formateo de fecha/hora en `Europe/Madrid`
  (se reutiliza `src/domain/tiempo.ts`).
- Generación de `.eml`: **sin dependencia nueva**; se compone el mensaje MIME (RFC 5322) con
  utilidades propias mínimas. (Ver research.md, decisión D3.)

**Storage**: **PostgreSQL 16** (el de 001). Nueva tabla `recordatorio` con **índice único por
`cita_id`** que hace de la no duplicación una garantía del motor de datos, no una comprobación de
aplicación susceptible a carreras (coherente con el enfoque de 001 para RN1).

**Testing**:
- Unitario: **Vitest** para la lógica pura (cálculo de ventana, elegibilidad, composición del `.eml`).
- Integración: **Vitest + Testcontainers** (PostgreSQL efímero) para idempotencia, reejecución y
  reproducibilidad sobre la semilla.
- E2E/validación: **Playwright** no es imprescindible aquí (el proceso es de servidor); la
  validación end-to-end se hace con el script del proceso + inspección de `datos/salida-correo/`
  (ver quickstart.md).

**Target Platform**: Servidor Linux (ejecución del proceso diario por programador externo o
manual). El email se consume en el cliente de correo del paciente; el enlace abre el portal de 005
en navegador de escritorio o móvil.

**Project Type**: Web application (extensión del proyecto Next.js de 001; no se añade un proyecto
nuevo).

**Performance Goals**: El proceso diario procesa las citas elegibles de la ventana (decenas por
clínica y día en el volumen objetivo) en segundos; no es un objetivo de alta escala. La escritura
de cada `.eml` es local y O(1) por recordatorio.

**Constraints**:
- Zona horaria de negocio fija `Europe/Madrid`; instantes en UTC (`timestamptz`), igual que 001.
- Idempotencia por cita garantizada a nivel de base de datos (índice único + inserción condicional).
- Español de España en todos los textos; fecha/hora inequívocas (constitución p.2, p.8).
- **Cero redefinición** de conceptos ajenos: umbral de cancelación (005), transición/hueco (001),
  tasa de no asistencia (004).

**Scale/Scope**: Clínicas de 2-5 profesionales; decenas de citas elegibles por día; la semilla de
001 aporta 2 semanas de reservas futuras suficientes para poblar la ventana de 24-48 h.

## Constitution Check

*GATE: debe pasar antes de la Fase 0 y revalidarse tras la Fase 1.*

| Principio | Cómo lo cumple el plan | Estado |
|-----------|------------------------|--------|
| 1. Spec primero | El plan deriva de `spec.md` (002); propiedad registrada en `specs/MAPA.md`; consume 005/001/004 por referencia. | ✅ |
| 2. Números exactos | Fecha/hora del recordatorio en `Europe/Madrid`, formato ES inequívoco (reutiliza `tiempo.ts`); la ventana 24-48 h se calcula en instantes UTC exactos. | ✅ |
| 3. Solape = fallo capital | 002 no escribe en la agenda ni crea citas; no puede introducir solapes. La cancelación la ejecuta 001 (que preserva sus invariantes). No aplica escritura anti-solape aquí. | ✅ (N/A por diseño) |
| 4. Simplicidad, cero alcance fantasma | Reutiliza el proyecto de 001; una sola tabla nueva; sin dependencias nuevas (`.eml` compuesto a mano); no se emite token propio (se usa el de 005). | ✅ |
| 5. Datos reproducibles | El proceso diario es determinista: misma semilla + misma fecha de ejecución → mismo conjunto de recordatorios (FR-015). | ✅ |
| 6. Tests acompañan a la spec | Cada FR/SC mapeado a tests (Vitest unit + integración con Testcontainers para idempotencia/concurrencia/reproducibilidad). Suite verde como puerta de merge. | ✅ |
| 7. UI clara y moderna | El contenido del email es claro, en es-ES y legible; la vista de cancelación es del portal de 005 (usable en móvil). 002 no añade UI propia más allá del contenido del email. | ✅ |
| 8. Español de España | Todo el contenido del recordatorio y los mensajes en es-ES. | ✅ |

**Resultado del gate**: PASA. No hay violaciones que justificar (Complexity Tracking vacío).

## Project Structure

### Documentation (this feature)

```text
specs/002-recordatorios-cita/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md        # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/           # Fase 1 (/speckit.plan)
│   ├── README.md
│   ├── proceso-diario.md
│   └── correo-eml.md
├── checklists/
│   └── requirements.md  # Checklist de calidad de la spec
└── tasks.md             # Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Source Code (repository root)

```text
app/
└── api/
    └── recordatorios/           # (opcional) endpoint interno para disparar el proceso en dev
        └── route.ts             #   — protegido; el disparo principal es por script/cron

src/
├── domain/
│   ├── recordatorio.ts          # Lógica pura: elegibilidad, ventana 24-48h, decisión de envío
│   └── correo.ts                # Composición del mensaje (.eml / MIME) y textos es-ES
├── db/
│   ├── schema.ts                # + tabla `recordatorio` (índice único por cita_id)
│   └── migrations/              # + migración de la tabla `recordatorio`
├── services/
│   ├── generar-recordatorios.ts # Proceso diario: selecciona citas elegibles e inserta (idempotente)
│   └── correo/
│       ├── emisor.ts            # Interfaz EmisorCorreo
│       └── emisor-eml.ts        # Adaptador de salida simulada a datos/salida-correo/*.eml
├── validation/
│   └── recordatorios.ts         # Zod: fecha de ejecución, configuración de correo
└── scripts/
    └── generar-recordatorios.ts # Entrada CLI (tsx) del proceso diario

datos/
└── salida-correo/               # Bandeja de salida simulada (.eml) cuando no hay SMTP

tests/
├── unit/                        # recordatorio (ventana/elegibilidad), correo (.eml/textos)
└── integration/                 # idempotencia, reejecución, reproducibilidad sobre semilla
```

**Structure Decision**: Se extiende el proyecto Next.js de 001 sin crear un proyecto nuevo
(Principio 4). La lógica pura (elegibilidad, ventana, composición del `.eml`) vive en `src/domain`,
testeable sin DB. La no duplicación se ancla en el esquema de PostgreSQL (`src/db`) mediante un
**índice único por `cita_id`** más una inserción condicional, replicando el enfoque de 001 de poner
las garantías capitales en la capa más fiable. El proceso diario es un **servicio** invocado por un
**script CLI** (patrón `tsx`, igual que `db:seed`), no un endpoint público, para que su disparo sea
operativo y reproducible. El envío de correo se abstrae tras una interfaz `EmisorCorreo` con un
adaptador `.eml` por defecto, dejando la puerta abierta a un adaptador SMTP futuro sin cambiar el
proceso.

## Complexity Tracking

> No aplica: el Constitution Check pasa sin violaciones.
