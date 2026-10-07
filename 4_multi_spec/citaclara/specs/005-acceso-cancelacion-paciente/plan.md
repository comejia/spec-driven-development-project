# Implementation Plan: Acceso y cancelación del paciente

**Branch**: `005-acceso-cancelacion-paciente` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-acceso-cancelacion-paciente/spec.md`

## Summary

La 005 es la **única fuente de verdad** de dos conceptos que 002 y 003 consumen por referencia:
(1) cómo accede un paciente a sus datos sin cuenta ni contraseña —un **enlace personal estable
`/p/[token]`** con token opaco, regenerable por recepción— y (2) cuándo puede cancelar por
autoservicio —**umbral único de 24 horas** antes del inicio—. La feature **no** reimplementa el
ciclo de vida de la cita: al cancelar dentro de plazo **invoca** la transición `reservada →
cancelada` de la 001 (`cambiarEstado`), que es la que libera el hueco y aporta atomicidad e
idempotencia.

Enfoque técnico: se extiende el esquema existente con una relación 1:1 `paciente ↔ token opaco`
(nueva tabla `acceso_paciente`), sobre el mismo stack de la 001 (Next.js 15 App Router +
Route Handlers, Drizzle sobre PostgreSQL 16, Zod, `date-fns-tz` en `Europe/Madrid`). La
autorización del paciente se resuelve por **posesión del token** (lookup del token opaco →
paciente), sin sesión de clínica. La política de 24 h es una **función pura de dominio**
(`src/domain/politica-cancelacion.ts`) testeable sin DB ni UI, que decide *si* se ofrece/permite
cancelar; el efecto sobre el hueco lo garantiza 001. La vista `/p/[token]` es una página pública
del App Router, en español de España, accesible y responsive.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 22 LTS (mismo proyecto Next.js de la 001).

**Primary Dependencies**:
- Frontend: **Next.js 15** (App Router, React 19 Server Components) + **Tailwind CSS 4** con
  **shadcn/ui** (Radix UI). Reutiliza los componentes `ui/` existentes.
- Backend: **Route Handlers** de Next.js (`app/api/...`) con **Drizzle ORM** sobre PostgreSQL.
- Validación: **Zod** (esquemas compartidos), ampliando `src/validation/index.ts`.
- Tiempo: **date-fns-tz** con zona de negocio fija `Europe/Madrid` (reutiliza `src/domain/tiempo.ts`).
- Token opaco: generación con el módulo `node:crypto` (aleatoriedad criptográfica); sin
  dependencias nuevas.

**Storage**: **PostgreSQL 16** (misma instancia y migraciones drizzle-kit de la 001). Se añade
la tabla `acceso_paciente` (1:1 con `paciente`) con token único e indexado. No se modifica la
tabla `cita`; la cancelación reutiliza `cambiarEstado` de la 001.

**Testing**:
- Unitario: **Vitest** para la política de cancelación de dominio (umbral 24 h, límites exactos)
  y la generación/validación de tokens.
- Integración (contra PostgreSQL real, patrón de la 001): acceso por token (válido, inexistente,
  regenerado), aislamiento entre pacientes, cancelación dentro/fuera de plazo, liberación de
  hueco (reutilizando el invariante de exclusión de 001) y concurrencia (una sola cancelación
  efectiva vía 001).
- E2E de UI: **Playwright** para `/p/[token]` (listado de citas, cancelar dentro de plazo,
  bloqueo + teléfono dentro de la ventana), incluyendo ejes de accesibilidad y responsive.

**Target Platform**: Navegador **móvil** del paciente (prioritario) y escritorio; servidor en Linux.

**Project Type**: Web application (frontend + Route Handlers en el mismo proyecto Next.js).

**Performance Goals**: Carga de `/p/[token]` y respuesta de cancelación por debajo de percepción
humana (< 300 ms p95) en el volumen objetivo. No es un objetivo de alta escala.

**Constraints**:
- El token es **opaco e imposible de adivinar** (≥ 128 bits de entropía, codificación URL-safe).
- Mensajes de acceso denegado **neutros**: no distinguen "no existe" de "no autorizado".
- Ventana de cancelación: **24 h o más** cancelable; el límite de 24 h exactas SÍ es cancelable.
- Zona de negocio fija `Europe/Madrid`; almacenamiento en UTC (`timestamptz`) como en 001.
- Interfaz en español de España, accesible (contraste/tamaños) y responsive (móvil primero).
- La transición de estado y la liberación del hueco son **propiedad de 001**: aquí solo se invocan.

**Scale/Scope**: Clínicas de 2-5 profesionales; ~40 pacientes y ~cientos de citas en la semilla.
Un token por paciente. Escala baja y acotada.

## Constitution Check

*GATE: debe pasar antes de la Fase 0 y revalidarse tras la Fase 1.*

| Principio | Cómo lo cumple el plan | Estado |
|-----------|------------------------|--------|
| 1. Spec primero | El plan deriva íntegramente de `spec.md` (005); propiedad "acceso-paciente" en `specs/MAPA.md`. No redefine conceptos de 001/002/003. | ✅ |
| 2. Números exactos | No maneja importes. Toda fecha/hora se interpreta en `Europe/Madrid` y el umbral de 24 h se calcula con instantes UTC exactos (sin ambigüedad de zona ni DST). | ✅ |
| 3. Solape = fallo capital | No escribe huecos nuevos: la cancelación **libera** hueco vía la transición atómica de 001, cuyo invariante de exclusión permanece intacto. Test de "hueco liberado admite nueva cita" reutiliza la garantía de 001. | ✅ |
| 4. Simplicidad, cero alcance fantasma | Una sola tabla nueva (1:1), una función de dominio pura y una página pública. Sin 2º factor, sin lista de espera, sin reprogramación (fuera de alcance en la spec). Cero dependencias nuevas. | ✅ |
| 5. Datos reproducibles | La semilla determinista de 001 se extiende para asignar un token estable por paciente; los ejemplos citan tokens y horas reproducibles. | ✅ |
| 6. Tests acompañan a la spec | Cada FR/SC se mapea a tests que lo referencian (Vitest + integración PostgreSQL + Playwright); suite verde como puerta de merge. | ✅ |
| 7. UI clara y moderna | `/p/[token]` reutiliza shadcn/ui: accesible, responsive (móvil primero), sin jerga; dentro de la ventana muestra el teléfono de la clínica de forma clara. | ✅ |
| 8. Español de España | Todos los textos de acceso y cancelación (y el mensaje de política de 24 h) en es-ES; fechas/horas inequívocas para España. | ✅ |

**Resultado del gate**: PASA. No hay violaciones que justificar (Complexity Tracking vacío).

## Project Structure

### Documentation (this feature)

```text
specs/005-acceso-cancelacion-paciente/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md        # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/           # Fase 1 (/speckit.plan)
│   ├── README.md
│   ├── acceso-paciente.md   # GET /p/[token] (vista) + resolución de token
│   └── cancelacion.md       # cancelación por el paciente (invoca 001)
├── checklists/          # (/speckit.checklist - opcional)
└── tasks.md             # Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── p/
│   └── [token]/
│       └── page.tsx             # Vista pública del paciente por enlace personal (US1/US3)
└── api/
    └── p/
        └── [token]/
            └── cancelar/
                └── route.ts      # POST cancelación por el paciente (US2), invoca 001

src/
├── domain/
│   └── politica-cancelacion.ts  # Función pura: ¿ofrecer/permitir cancelar? (umbral 24 h)
├── services/
│   ├── acceso-paciente.ts       # Resolver token → paciente + sus citas; regenerar token
│   └── cancelar-por-paciente.ts # Autoriza (token+ventana+estado) y delega en cambiarEstado (001)
├── db/
│   ├── schema.ts                # + tabla acceso_paciente (1:1 con paciente); token único
│   └── migrations/              # + migración de la tabla y su índice único
├── validation/
│   └── index.ts                 # + esquemas Zod (token, cancelación)
└── seed/
    └── seed.ts                  # + token estable por paciente en la semilla determinista

tests/
├── unit/
│   └── politica-cancelacion.test.ts   # umbral 24 h y límites exactos (FR-007/008/009)
├── integration/
│   ├── contract-acceso-paciente.test.ts  # token válido/inexistente/regenerado, aislamiento
│   └── cancelacion-paciente.test.ts      # dentro/fuera de plazo, hueco liberado, concurrencia
└── e2e/
    └── portal-paciente.spec.ts        # /p/[token]: listado, cancelar, bloqueo+teléfono, a11y
```

**Structure Decision**: Se mantiene el **único proyecto Next.js full-stack** de la 001. La regla
de negocio capital de esta spec (política de 24 h) vive en `src/domain` como **función pura**,
testeable sin UI ni DB. El acceso por token es un servicio de lectura que **no** abre sesión de
clínica; la cancelación es un servicio delgado que autoriza y **delega** en `cambiarEstado` de la
001 (Principio 4: no reimplementar el ciclo de vida ni la liberación del hueco). La superficie
pública se limita a `app/p/[token]` y su endpoint de cancelación.

## Complexity Tracking

> No aplica: el Constitution Check pasa sin violaciones.
