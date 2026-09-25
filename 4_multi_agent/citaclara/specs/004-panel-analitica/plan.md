# Implementation Plan: Panel de Analítica

**Branch**: `004-panel-analitica` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-panel-analitica/spec.md`

## Summary

La 004 añade una **página de analítica de solo lectura** al panel de la clínica, accesible con
la MISMA clave de clínica que la agenda (001, FR-018). En una sola página muestra cuatro
bloques: (a) ocupación semanal por profesional, (b) tasa de no asistencia por profesional
(Definición A, métrica propiedad de la 004), (c) ingresos por servicio de citas completadas
(exactos al céntimo) y (d) evolución de las últimas 8 semanas. La feature **no escribe nada**:
solo lee y agrega las entidades de la 001 (`cita`, `servicio`, `profesional`, `clinica`).

Enfoque técnico: reutilizar el stack full-stack Next.js/PostgreSQL/Drizzle ya presente. La
lógica de agregación vive en un **servicio de consulta puro y testeable** (`src/services/analitica.ts`)
apoyado en **funciones de dominio nuevas** para semanas ISO, ocupación y tasa (en `src/domain/analitica.ts`),
reutilizando los helpers de dinero (`formatearEuros`, `sumarCentimos`) y de tiempo
(`ZONA_NEGOCIO`, `fechaEnMadrid`) existentes. Todas las agregaciones se restringen a la clínica
autenticada y se calculan en `Europe/Madrid`. La página se renderiza como Server Component bajo
`app/(panel)/analitica/`, con gráficos claros, accesibles y responsive. Los números son
reproducibles con la semilla determinista de la 001 (día de referencia 16/09/2026).

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 22 LTS (mismo monorepo Next.js de la 001).

**Primary Dependencies**:
- Frontend: **Next.js 15** (App Router, React 19 Server Components) + **Tailwind CSS 4** con
  **shadcn/ui** (Radix UI), reutilizando los componentes de `components/ui`.
- Gráficos: **Recharts** (biblioteca de gráficos accesible sobre SVG, integración natural con
  React), única dependencia nueva y justificada por FR-003/FR-011 (gráficos claros). Se pinta
  en un componente cliente aislado; el cálculo permanece en el servidor.
- Backend/datos: Route Handlers / Server Components de Next.js con **Drizzle ORM** (solo `SELECT`).
- Validación: **Zod** para las entradas del servicio de consulta (rango temporal derivado).
- Dinero y tiempo: helpers existentes `src/domain/dinero.ts` y `src/domain/tiempo.ts`
  (`Europe/Madrid`, formato es-ES). Semanas ISO con **date-fns** (`getISOWeek`, `startOfISOWeek`).

**Storage**: **PostgreSQL 16** existente (esquema de la 001). La 004 **no crea tablas ni
migraciones**; solo consulta. No usa `btree_gist` ni exclusiones (no escribe agenda).

**Testing**:
- Unitario: **Vitest** para el dominio de analítica (semana ISO, ocupación, tasa, división por
  cero, "sin datos").
- Integración: **Vitest + Testcontainers** (PostgreSQL efímero) sembrando la historia
  determinista y verificando los números exactos de la spec (ingresos 31.425,00 €, tasas, etc.).
- E2E de UI: **Playwright**, incluidos acceso denegado sin clave, ejes de accesibilidad y
  responsive, y comprobación de que el panel **no escribe** (estado idéntico antes/después).

**Target Platform**: Navegadores modernos de escritorio (portátil de recepción) y móvil;
servidor desplegado en Linux. Igual que la 001.

**Project Type**: Web application (frontend + Route Handlers en el mismo proyecto Next.js).

**Performance Goals**: Carga del panel por debajo de percepción humana (< 300 ms p95) en el
volumen objetivo (~1.100 citas de la semilla). Las agregaciones se hacen en SQL (`GROUP BY`)
para evitar traer todas las filas a la aplicación.

**Constraints**:
- **Solo lectura absoluta** (FR-002): ninguna interacción escribe, modifica o borra datos.
- Importes exactos al céntimo (enteros de céntimos; nunca coma flotante para dinero).
- Zona de negocio fija `Europe/Madrid`; semanas etiquetadas de forma inequívoca (ISO).
- Aislamiento por clínica (FR-012): toda consulta filtra por `clinica_id` de la sesión.
- Interfaz en español de España, accesible y responsive.

**Scale/Scope**: Clínicas de 2-5 profesionales; ~1.100 citas en la semilla; ventana de 8
semanas para la evolución. Escala baja y acotada.

## Constitution Check

*GATE: debe pasar antes de la Fase 0 y revalidarse tras la Fase 1.*

| Principio | Cómo lo cumple el plan | Estado |
|-----------|------------------------|--------|
| 1. Spec primero | El plan deriva íntegramente de `spec.md` (004); propiedad en `specs/MAPA.md`. La 004 consume la 001 por referencia (S4/S5) sin redefinir su comportamiento. | ✅ |
| 2. Números exactos | Ingresos en enteros de céntimos con `sumarCentimos`/`formatearEuros`; total 31.425,00 € al céntimo. Fechas/semanas en `Europe/Madrid` con etiqueta ISO inequívoca. | ✅ |
| 3. Solape = fallo capital | **No aplica por escritura**: la 004 es solo lectura y NO escribe en la agenda. Se preserva el invariante por no tocarlo. Se añade un test que verifica cero escrituras (SC-003). | ✅ |
| 4. Simplicidad, cero alcance fantasma | Reutiliza el proyecto Next.js y los helpers existentes; única dependencia nueva (Recharts) justificada por FR-003/FR-011. Sin exportación, sin multiclínica, sin filtros extra (fuera de alcance). | ✅ |
| 5. Datos reproducibles | Todos los indicadores se verifican contra la semilla determinista de la 001 (día ref. 16/09/2026); tests que reproducen los números de la spec. | ✅ |
| 6. Tests acompañan a la spec | Cada FR/SC mapeado a tests que lo referencian (Vitest dominio + integración con Postgres + Playwright); suite verde como puerta de merge. Trazabilidad en `trazabilidad.md`. | ✅ |
| 7. UI clara y moderna | Next.js + Tailwind + shadcn/ui + Recharts: gráficos claros, sin jerga, con "sin datos" explícito, contraste y tamaños accesibles, usable en portátil y móvil. | ✅ |
| 8. Español de España | Toda la interfaz, textos, etiquetas de semana y la nota FR-006c en es-ES. | ✅ |

**Resultado del gate**: PASA. No hay violaciones que justificar (Complexity Tracking vacío).

## Project Structure

### Documentation (this feature)

```text
specs/004-panel-analitica/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md        # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/           # Fase 1 (/speckit.plan)
│   ├── README.md
│   └── analitica.md
├── checklists/          # /speckit.checklist
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Source Code (repository root)

```text
app/                              # Next.js App Router
├── (panel)/
│   └── analitica/                # NUEVA página del panel (Server Component, protegida por sesión)
│       └── page.tsx
└── api/
    └── analitica/                # NUEVO Route Handler de solo lectura (contrato HTTP interno)
        └── route.ts

src/
├── domain/                       # Lógica pura y testeable
│   └── analitica.ts              # NUEVO: semana ISO, ocupación, tasa (Def. A), "sin datos"
├── services/
│   └── analitica.ts              # NUEVO: agregaciones SQL por clínica (ingresos, tasa, ocupación, evolución)
├── validation/
│   └── index.ts                  # AMPLIADO: esquema Zod de la entrada de analítica (si procede)
└── db/                           # Sin cambios (no hay migraciones nuevas): solo SELECT

components/
└── analitica/                    # NUEVOS componentes de presentación (gráficos + tarjetas)
    ├── panel-analitica.tsx       # Composición de los 4 bloques
    ├── grafico-ocupacion.tsx     # Cliente (Recharts) — ocupación semanal por profesional
    ├── grafico-evolucion.tsx     # Cliente (Recharts) — evolución 8 semanas
    ├── tasa-no-asistencia.tsx    # Tasa por profesional + nota FR-006c
    └── ingresos-servicio.tsx     # Tabla/gráfico de ingresos por servicio (al céntimo)

tests/
├── unit/
│   └── analitica.test.ts         # Dominio: semana ISO, ocupación, tasa, división por cero
├── integration/
│   ├── analitica-numeros.test.ts # Números exactos de la spec sobre la semilla (SC-001/004/005/006)
│   └── analitica-solo-lectura.test.ts # Cero escrituras (SC-003) + aislamiento por clínica (FR-012)
└── e2e/
    └── analitica.spec.ts         # Acceso denegado sin clave, render de bloques, accesibilidad, responsive
```

**Structure Decision**: Se mantiene el **único proyecto Next.js full-stack** de la 001. El
cálculo de indicadores vive en `src/domain/analitica.ts` (puro, sin UI ni DB) y en
`src/services/analitica.ts` (agregaciones SQL con Drizzle, filtradas por clínica). La UI se
compone en `app/(panel)/analitica/page.tsx` (Server Component protegido por el guard de sesión
existente `clinicaDeSesionEnServidor`) y delega los gráficos a componentes cliente aislados en
`components/analitica`. Esta separación mantiene la simplicidad (Principio 4), garantiza el
carácter de solo lectura (Principio 3, sin capa de escritura) y hace verificables los números
sin arrancar la UI (Principios 5 y 6).

## Complexity Tracking

> No aplica: el Constitution Check pasa sin violaciones.
