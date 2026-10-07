# Implementation Plan: Núcleo de Agenda

**Branch**: `001-agenda-core` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-agenda-core/spec.md`

## Summary

CitaClara 001 entrega el núcleo de agenda para clínicas pequeñas: gestión de clínica,
profesionales, servicios, pacientes y citas, con alta de citas sin solapes (RN1, incluida
concurrencia del mismo hueco), sin citas en el pasado (RN2), vista de "agenda del día" por
profesional, transiciones de estado de la cita, acceso por clave de clínica y datos de
demostración deterministas.

Enfoque técnico: aplicación web full-stack con un backend transaccional sobre **PostgreSQL**,
que hace cumplir el invariante anti-solape a nivel de base de datos mediante una **restricción
de exclusión** sobre un rango temporal por profesional (y otra por paciente). Esto convierte
RN1/FR-012a en una garantía del motor de datos, no en una comprobación de aplicación
susceptible a condiciones de carrera. Importes en tipo decimal exacto y fechas/horas en zona
`Europe/Madrid` con formato español. UI moderna, accesible y responsive en español de España.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 22 LTS (backend y frontend en un monorepo).

**Primary Dependencies**:
- Frontend: **Next.js 15** (App Router, React 19 Server Components) + **Tailwind CSS 4** con
  **shadcn/ui** (Radix UI) para una estética profesional 2026, accesible y responsive.
- Backend: rutas de servidor de Next.js (Route Handlers / Server Actions) con **Drizzle ORM**
  para acceso tipado a PostgreSQL.
- Validación de datos: **Zod** (esquemas compartidos frontend/backend).
- Dinero y tiempo: **decimal.js** (o entero de céntimos) para importes; **Temporal** (polyfill)
  / **date-fns-tz** para fechas y horas en `Europe/Madrid`.

**Storage**: **PostgreSQL 16** con la extensión **btree_gist** para restricciones de exclusión
sobre rangos temporales (`tstzrange`). Migraciones con **drizzle-kit**.

**Testing**:
- Unitario/integración: **Vitest**.
- Contra base de datos real (concurrencia y exclusión): **Testcontainers** (PostgreSQL efímero)
  o servicio Postgres en CI.
- E2E de UI: **Playwright** (incluye ejes de accesibilidad y responsive).

**Target Platform**: Navegadores modernos de escritorio (portátil de recepción) y móvil
(navegador del paciente para futuras features); despliegue del servidor en Linux.

**Project Type**: Web application (frontend + backend en el mismo proyecto Next.js, monorepo simple).

**Performance Goals**: Latencia de alta de cita y de carga de la agenda del día por debajo de
percepción humana (< 300 ms p95) en el volumen objetivo. No es un objetivo de alta escala.

**Constraints**:
- Zona horaria de negocio fija `Europe/Madrid`; almacenamiento en UTC (`timestamptz`).
- Importes exactos al céntimo, sin aritmética en coma flotante para dinero.
- Interfaz en español de España, accesible (contraste y tamaños) y responsive.

**Scale/Scope**: Clínicas de 2-5 profesionales; decenas de citas por profesional y día;
~40 pacientes y ~cientos de citas en la semilla. Escala baja y acotada.

## Constitution Check

*GATE: debe pasar antes de la Fase 0 y revalidarse tras la Fase 1.*

| Principio | Cómo lo cumple el plan | Estado |
|-----------|------------------------|--------|
| 1. Spec primero | El plan deriva íntegramente de `spec.md` (001); propiedad en `specs/MAPA.md`. | ✅ |
| 2. Números exactos | Importes en decimal exacto/entero de céntimos; fechas/horas en `Europe/Madrid` con formato ES inequívoco. | ✅ |
| 3. Solape = fallo capital | Restricción de exclusión en PostgreSQL (`EXCLUDE USING gist`) por profesional y por paciente; garantía a nivel de motor incluso bajo concurrencia. Tests hostiles obligatorios. | ✅ |
| 4. Simplicidad, cero alcance fantasma | Un solo proyecto Next.js full-stack; sin microservicios ni dependencias no justificadas; solo lo que exige la 001. | ✅ |
| 5. Datos reproducibles | Script de semilla determinista con semilla fija → misma historia (importes, fechas, estados). | ✅ |
| 6. Tests acompañan a la spec | Cada FR/RN mapeado a tests que la referencian (Vitest + Testcontainers + Playwright); suite verde como puerta de merge. | ✅ |
| 7. UI clara y moderna | Next.js + Tailwind + shadcn/ui: estética 2026, accesible, responsive, sin jerga; usable sin manual. | ✅ |
| 8. Español de España | Todo el producto y los datos de demostración en es-ES. | ✅ |

**Resultado del gate**: PASA. No hay violaciones que justificar (Complexity Tracking vacío).

## Project Structure

### Documentation (this feature)

```text
specs/001-agenda-core/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md        # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/           # Fase 1 (/speckit.plan)
│   ├── README.md
│   ├── citas.md
│   ├── agenda.md
│   ├── pacientes.md
│   └── acceso.md
└── tasks.md             # Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Source Code (repository root)

```text
app/                         # Next.js App Router (UI de recepción + Route Handlers)
├── (panel)/
│   ├── acceso/              # Pantalla de acceso por clave de clínica
│   └── agenda/              # Agenda del día por profesional + alta y estados de cita
├── api/                     # Route Handlers (contratos HTTP internos)
│   ├── citas/
│   ├── agenda/
│   ├── pacientes/
│   └── acceso/
└── layout.tsx               # Layout base, idioma es-ES, estilos globales

src/
├── domain/                  # Lógica de negocio pura (solape, estados, dinero, tiempo)
│   ├── cita.ts
│   ├── solape.ts
│   ├── dinero.ts
│   └── tiempo.ts
├── db/                      # Drizzle: esquema, migraciones, cliente
│   ├── schema.ts
│   └── migrations/
├── services/                # Casos de uso (crear cita, cambiar estado, consultar agenda)
├── validation/              # Esquemas Zod compartidos
└── seed/                    # Semilla determinista (Clínica Eleva, 3 prof., 4 servicios...)
    └── seed.ts

components/                  # UI (shadcn/ui): agenda, formulario de cita, estados
└── ui/

tests/
├── unit/                    # Dominio: solape, dinero, tiempo, transiciones de estado
├── integration/             # Contra PostgreSQL real: exclusión, concurrencia (RN1)
└── e2e/                     # Playwright: acceso, agenda del día, alta, accesibilidad
```

**Structure Decision**: Aplicación web en un único proyecto Next.js (frontend + Route Handlers
en el mismo repositorio). La lógica de negocio vive en `src/domain` (pura y testeable sin UI ni
DB), y el invariante anti-solape se ancla además en el esquema de PostgreSQL (`src/db`). Esta
estructura mantiene la simplicidad exigida por el Principio 4 y coloca la garantía capital
(Principio 3) en la capa más fiable posible.

## Complexity Tracking

> No aplica: el Constitution Check pasa sin violaciones.
