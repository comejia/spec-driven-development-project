# Implementation Plan: Portal del Paciente

**Branch**: `003-portal-paciente` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-portal-paciente/spec.md`

## Summary

El Portal del Paciente entrega una página personal, moderna y responsive (prioridad móvil)
donde un paciente ve sus **citas futuras y pasadas** y puede **cancelar una cita futura**
cuando la política de cancelación lo permite, sin cuentas ni contraseñas. Tras la revisión
cruzada, **003 es consumidor**, no propietario, de dos conceptos:

- **Acceso e identidad del paciente** (enlace `/p/[token]`, token opaco, regeneración,
  denegación ante tokens inválidos): propiedad de **005**.
- **Política de cancelación** (umbral único de 24 h y acción dentro de la ventana): propiedad
  de **005**.
- **Ciclo de vida de la cita** (`reservada → cancelada`, liberación del hueco) y **concurrencia**
  atómica/idempotente: propiedad del núcleo **001**.

Enfoque técnico: reutilizar la misma aplicación **Next.js 15 (App Router) + Drizzle ORM +
PostgreSQL** de la 001. El portal es una **ruta pública** `app/p/[token]/` (fuera del grupo
`(panel)` de recepción) que: (1) resuelve la identidad del paciente a través de un **seam de
acceso** que 005 poseerá; (2) lee las citas del paciente con un servicio de solo lectura
propio de 003; y (3) para cancelar, evalúa la política de 005 y **invoca la operación de
cancelación de 001**. Como 005 aún no está implementada, el plan define **interfaces (puertos)**
que 003 consume y un **adaptador de desarrollo** temporal basado en la semilla, sustituible por
la implementación real de 005 sin tocar la UI ni los servicios de 003.

## Technical Context

**Language/Version**: TypeScript 5.9 sobre Node.js 22 LTS (mismo monorepo Next.js de la 001).

**Primary Dependencies**:
- Frontend: **Next.js 15** (App Router, React 19 Server Components) + **Tailwind CSS 4** con
  componentes **shadcn/ui** (Radix) ya presentes en `components/ui`.
- Backend: **Route Handlers** de Next.js + **Drizzle ORM** para lectura de citas.
- Validación: **Zod** (esquemas en `src/validation`).
- Tiempo/formato ES: **date-fns-tz** con `Europe/Madrid` (reutiliza `src/domain/tiempo.ts`).
- Sin dependencias nuevas: todo lo necesario ya está en `package.json` (Principio 4).

**Storage**: **PostgreSQL 16** (mismo esquema de la 001). 003 **no crea tablas nuevas**; lee
`cita`, `paciente`, `profesional`, `servicio`. El almacén del token `/p/[token]` es **propiedad
de 005**; 003 solo lo consume a través del puerto de acceso (ver Dependencias).

**Testing**:
- Unitario: **Vitest** (lógica de agrupado futuras/pasadas, orden, formato ES, elegibilidad de
  cancelación derivada de la política).
- Integración contra PostgreSQL real: **Vitest + Testcontainers** (lectura de citas por
  paciente; cancelación que invoca 001; idempotencia/concurrencia garantizada por 001).
- E2E de UI: **Playwright** (ver citas, cancelar dentro/fuera de ventana, acceso denegado,
  accesibilidad y responsive móvil/escritorio).

**Target Platform**: navegador **móvil** del paciente (prioridad) y escritorio; servidor Linux.

**Project Type**: Web application (frontend + Route Handlers en el mismo proyecto Next.js).

**Performance Goals**: carga de la vista del portal por debajo de la percepción humana
(< 300 ms p95) en el volumen objetivo; sin objetivos de alta escala.

**Constraints**:
- Zona de negocio fija `Europe/Madrid`; instantes en UTC (`timestamptz`).
- Fechas/horas inequívocas para España (formato es-ES) e importes al céntimo (Principio 2).
- Interfaz en **español de España**, accesible (contraste y tamaños) y responsive (Principio 7/8).
- 003 **no** define acceso, umbral de cancelación, transición de estado ni control de
  concurrencia: los **consume** de 005/001.

**Scale/Scope**: clínicas de 2-5 profesionales; ~40 pacientes y cientos de citas en la semilla;
un paciente ve del orden de decenas de citas entre futuras e historial. Escala baja y acotada.

## Dependencias entre features (consumidor)

003 depende de contratos que pertenecen a otras specs. Para no acoplarse a implementaciones aún
inexistentes (005 solo existe como spec), el plan define **puertos** (interfaces) que 003 consume
y que la feature propietaria implementa:

| Puerto (consumido por 003) | Propietario | Responsabilidad | Estado hoy |
|----------------------------|-------------|-----------------|------------|
| `PortalAccessGateway.resolverPaciente(token)` | **005** | Traducir `/p/[token]` → `pacienteId` o denegar (token inexistente/manipulado/regenerado), con mensaje neutro | 005 sin implementar → **adaptador de desarrollo** en 003 |
| `PoliticaCancelacion.puedeCancelar(cita, ahora)` | **005** | Decidir si una cita es cancelable por el paciente (umbral 24 h) y qué mostrar dentro de ventana (teléfono clínica) | 005 sin implementar → **adaptador** que aplica 24 h según 005 FR-007/008 |
| `cancelarCita(clinicaId, citaId)` (transición atómica/idempotente) | **001** | `reservada → cancelada` + liberar hueco; una sola cancelación efectiva ante concurrencia | **existe**: `src/services/cambiar-estado.ts` |

**Regla de acoplamiento (Principio 4 + Spec Primero)**: los puertos viven en `src/portal/puertos.ts`
(tipos e interfaces). 003 programa contra los tipos, no contra 005. Cuando 005 se implemente,
sustituye al adaptador de desarrollo sin cambios en UI ni en los servicios de lectura de 003. El
adaptador de desarrollo se marca explícitamente como **provisional** y **no** reimplementa reglas
de 005: solo materializa el comportamiento ya especificado por 005 sobre los datos de la semilla
para poder desarrollar y probar 003 de forma aislada.

> Nota de coordinación (constitución, un propietario por spec): cualquier discrepancia entre el
> adaptador provisional y 005 se resuelve **en 005**; 003 nunca fija una regla paralela.

## Constitution Check

*GATE: debe pasar antes de la Fase 0 y revalidarse tras la Fase 1.*

| Principio | Cómo lo cumple el plan | Estado |
|-----------|------------------------|--------|
| 1. Spec primero | El plan deriva de `spec.md` (003); acceso y cancelación remiten a 005, ciclo de vida a 001; propiedad en `specs/MAPA.md`. | ✅ |
| 2. Números exactos | Fechas/horas en `Europe/Madrid` con formato ES (reutiliza `tiempo.ts`); importes al céntimo con `dinero.ts` de la 001. | ✅ |
| 3. Solape = fallo capital | 003 no escribe huecos nuevos; la cancelación libera hueco vía 001 (transición atómica). No introduce caminos que puedan crear solapes. | ✅ |
| 4. Simplicidad, cero alcance fantasma | Sin dependencias nuevas; sin tablas nuevas; puertos mínimos hacia 005; solo lo que exige la 003. | ✅ |
| 5. Datos reproducibles | Ejemplos y pruebas citan la semilla determinista (Clínica Eleva; pacientes con citas futuras "reservada" e historial). | ✅ |
| 6. Tests acompañan a la spec | Cada FR de 003 mapeado a tests (Vitest + Testcontainers + Playwright); concurrencia probada contra la garantía de 001; suite verde como puerta de merge. | ✅ |
| 7. UI clara y moderna | Next.js + Tailwind + shadcn/ui, prioridad móvil, accesible, sin jerga, en es-ES. | ✅ |
| 8. Español de España | Toda la UI, mensajes y ejemplos en es-ES. | ✅ |

**Resultado del gate**: PASA. No hay violaciones que justificar (Complexity Tracking vacío).

**Re-evaluación tras Fase 1**: PASA. El diseño (puertos + ruta pública + servicio de lectura +
delegación de cancelación) no introduce complejidad no justificada ni dependencias nuevas; el
invariante capital sigue siendo propiedad de 001.

## Project Structure

### Documentation (this feature)

```text
specs/003-portal-paciente/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md        # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/           # Fase 1 (/speckit.plan)
│   ├── README.md
│   ├── portal-vista.md          # GET de la vista del portal (citas del paciente)
│   ├── portal-cancelacion.md    # POST de cancelación desde el portal
│   └── puertos-005.md           # Puertos que 003 consume de 005 (acceso + política)
└── tasks.md             # Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── p/                         # NUEVA ruta pública del paciente (fuera de (panel))
│   └── [token]/
│       ├── page.tsx           # Vista del portal: próximas citas + historial (Server Component)
│       └── acceso-denegado.tsx# Estado de acceso denegado (mensaje neutro)
└── api/
    └── portal/                # Route Handlers del portal
        ├── [token]/route.ts           # GET: citas del paciente resueltas por el puerto de acceso
        └── [token]/cancelar/route.ts  # POST: cancelar una cita (política 005 + transición 001)

src/
├── portal/                    # NUEVO: lógica del portal (consumidor)
│   ├── puertos.ts             # Interfaces: PortalAccessGateway, PoliticaCancelacion (props. de 005)
│   ├── acceso-desarrollo.ts   # Adaptador PROVISIONAL de acceso sobre la semilla (sustituible por 005)
│   ├── politica-desarrollo.ts # Adaptador PROVISIONAL de política 24 h (según 005 FR-007/008)
│   ├── consultar-citas-paciente.ts # Servicio de solo lectura: futuras/historial ordenadas
│   └── cancelar-desde-portal.ts    # Orquesta: política(005) → cancelarCita(001) → mensaje
├── validation/                # Se añade el esquema Zod del token/cancelación del portal
└── services/                  # (001) cambiar-estado.ts: reutilizado para la transición

components/
└── portal/                    # UI del portal (shadcn/ui): lista de citas, tarjeta, diálogo cancelar
    ├── lista-citas.tsx
    ├── tarjeta-cita.tsx
    └── cancelar-cita.tsx

tests/
├── unit/                      # Agrupado futuras/pasadas, orden, formato ES, elegibilidad
│   └── portal-citas.test.ts
├── integration/               # Contra PostgreSQL real
│   ├── contract-portal-vista.test.ts
│   └── contract-portal-cancelacion.test.ts
└── e2e/                       # Playwright
    ├── portal-ver-citas.spec.ts
    ├── portal-cancelar.spec.ts
    └── portal-accesibilidad.spec.ts
```

**Structure Decision**: Se reutiliza el único proyecto Next.js de la 001. El portal vive en una
**ruta pública** `app/p/[token]/` claramente separada del grupo de recepción `(panel)`, para no
mezclar la sesión de clínica (cookie HMAC) con el acceso del paciente (token de 005). La lógica
propia de 003 se concentra en `src/portal/`, programando contra **puertos** que 005 poseerá; la
cancelación **delega** en `src/services/cambiar-estado.ts` (001). Así se respeta el Principio 4
(simplicidad, sin duplicar reglas) y la propiedad única de cada concepto.

## Complexity Tracking

> No aplica: el Constitution Check pasa sin violaciones. El único elemento "extra" (adaptadores
> de desarrollo para los puertos de 005) está justificado por el desacoplamiento entre features
> y es provisional y sustituible; no reimplementa reglas de 005.
