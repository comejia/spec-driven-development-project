# Fase 0 — Investigación: Núcleo de Agenda (001)

Objetivo: resolver las decisiones técnicas que la constitución dejó al plan, priorizando la
garantía anti-solape (Principio 3), la exactitud numérica y temporal (Principio 2) y una UI
moderna y accesible de 2026 (Principio 7). Formato por decisión: **Decisión / Razón /
Alternativas descartadas**.

## D1. Anti-solape a nivel de base de datos (RN1, FR-010/011/012a) — capital

**Decisión**: Modelar el intervalo de cada cita como `tstzrange(inicio, fin)` en PostgreSQL y
aplicar dos **restricciones de exclusión** con `EXCLUDE USING gist` (extensión `btree_gist`):
- Una por profesional: excluye rangos que se solapan `WITH &&` para el mismo `profesional_id`.
- Una por paciente: idéntica para el mismo `paciente_id`.
Ambas se aplican solo a citas en estado activo (`reservada`, `completada`) mediante índice/
restricción parcial (`WHERE estado IN ('reservada','completada')`).

**Razón**: La exclusión la evalúa el motor de forma atómica dentro de la transacción; dos
reservas simultáneas del mismo hueco no pueden ambas confirmar (una recibe error de violación de
restricción). Es la forma más fuerte y simple de cumplir "ni siquiera si llegan en el mismo
instante" sin bloqueos manuales ni lógica de aplicación frágil. Los bordes `[inicio, fin)` con
rango `'[)'` hacen que las citas adyacentes NO solapen (FR-012), gratis.

**Alternativas descartadas**:
- Comprobación en aplicación (SELECT + INSERT): sufre condiciones de carrera salvo con bloqueo
  serializable explícito; más código y más frágil.
- Bloqueo pesimista por profesional (`SELECT ... FOR UPDATE` sobre una fila "agenda"):
  serializa reservas y complica el modelo; innecesario teniendo exclusión nativa.
- Nivel de aislamiento `SERIALIZABLE` global: penaliza y no expresa el invariante en el esquema.

## D2. Dinero exacto al céntimo (Principio 2, FR-019)

**Decisión**: Almacenar los precios como **enteros de céntimos** (`integer`, p. ej. 4000 = 40,00 €)
en la base de datos y operar con enteros; en la capa de presentación formatear con
`Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`. Cuando haga falta
aritmética fraccionaria intermedia, usar `decimal.js`; nunca `number` de coma flotante para dinero.

**Razón**: Los enteros de céntimos eliminan por completo el error de coma flotante y garantizan
el cuadre al céntimo. `Intl` da el formato español correcto ("40,00 €").

**Alternativas descartadas**:
- `float`/`double`: prohibido para dinero (errores de redondeo).
- `numeric` de Postgres con `number` de JS: `numeric` es exacto en DB, pero al pasar a `number`
  se pierde exactitud; si se usa `numeric`, debe leerse como cadena/decimal, no como `number`.

## D3. Fechas y horas inequívocas para España (Principio 2, FR-019)

**Decisión**: Almacenar instantes en **UTC** (`timestamptz`). Interpretar y mostrar todo en la
zona de negocio fija `Europe/Madrid`. Formatear con `Intl.DateTimeFormat('es-ES', …)` (24 h,
"dd/MM/yyyy HH:mm"). Validar la granularidad de 5 minutos (FR-005a) en el dominio y con Zod.

**Razón**: `timestamptz` + zona de negocio explícita evita ambigüedad de horario de verano/
invierno y de "hora local del servidor". El formato es-ES 24 h es el esperado en una clínica
española.

**Alternativas descartadas**:
- Guardar hora local sin zona (`timestamp`): ambiguo en cambios de hora; rechazado.
- Confiar en la zona del navegador: la agenda es del negocio, no del dispositivo.

## D4. Stack de UI moderno y profesional (2026) (Principio 7)

**Decisión**: **Next.js 15 (App Router, React 19)** + **Tailwind CSS 4** + **shadcn/ui**
(componentes sobre Radix UI). Tipografía y espaciado generosos, modo claro por defecto,
componentes accesibles por diseño (Radix gestiona foco y ARIA).

**Razón**: Es una combinación consolidada y actual (2026) que produce interfaces limpias y
profesionales con poco esfuerzo, es responsive por defecto con Tailwind, y Radix aporta
accesibilidad (contraste, tamaños y navegación por teclado) alineada con el Principio 7. Un
único framework full-stack cumple el Principio 4 (simplicidad).

**Alternativas descartadas**:
- SPA separada (Vite + API aparte): añade un servicio y coordinación extra sin beneficio para
  esta escala.
- Librerías de componentes "pesadas" (MUI/AntD): estética más genérica y más peso; shadcn/ui da
  control del diseño y aspecto más 2026.

## D5. Acceso por clave de clínica (FR-018, deuda consciente v1)

**Decisión**: Cookie de sesión HTTP-only tras validar la clave de clínica contra un **hash**
(`argon2` o `bcrypt`) almacenado por clínica. Sin usuarios individuales ni roles en la 001.

**Razón**: Cumple FR-018 con una barrera real (no clave en claro) manteniendo la simplicidad
declarada como deuda consciente. Hashear evita filtrar la clave aunque se acceda a la DB.

**Alternativas descartadas**:
- Clave en texto plano: inseguro incluso para v1.
- Autenticación completa con usuarios/roles/OAuth: fuera de alcance de la 001.

## D6. Datos de demostración deterministas (Principio 5, FR-021)

**Decisión**: Script de semilla en `src/seed/seed.ts` con **PRNG sembrado** (semilla fija, p. ej.
`citaclara-eleva-2026`) que genera exactamente: Clínica Eleva; 3 profesionales (María y Jorge,
fisioterapia; Lucía, nutrición); 4 servicios con sus duraciones y precios; ~40 pacientes con
teléfonos únicos; 8 semanas de historia (~10 % no asistencia, ~8 % cancelaciones) y 2 semanas
futuras de reservas. Se garantiza ausencia de solapes al generar (respeta D1). Reejecutar
`seed` (reset + re-seed) produce la misma historia.

**Razón**: Un PRNG sembrado hace la historia reproducible al 100 % (SC-007), permitiendo que
specs, ejemplos y analítica citen números verificables.

**Alternativas descartadas**:
- Datos aleatorios sin semilla: no reproducibles; violan el Principio 5.
- Volcado SQL fijo a mano: rígido y difícil de mantener frente a cambios de esquema.

## D7. Estrategia de tests que acompañan a la spec (Principio 6)

**Decisión**: Tres niveles con trazabilidad a FR/RN en el nombre o descripción del test:
- **Unitario (Vitest)**: dominio puro — cálculo de fin (FR-006), granularidad (FR-005a),
  detección de solape (FR-012), dinero (FR-019), transiciones de estado (FR-008).
- **Integración con PostgreSQL real (Testcontainers)**: exclusión y **concurrencia** (FR-010/011,
  FR-012a) — pruebas hostiles que lanzan reservas simultáneas del mismo hueco y verifican que
  solo una queda; RN2 (FR-013); unicidad de teléfono (FR-004a).
- **E2E (Playwright)**: acceso por clave (FR-018), agenda del día (FR-015/016/016a), alta y
  cambio de estado (FR-017), más comprobaciones de accesibilidad y responsive (SC-005/006/008).

**Razón**: El invariante capital debe probarse contra el motor real (no un mock), y las reglas de
negocio a nivel de dominio de forma rápida. La suite verde es condición de merge (Principio 6).

**Alternativas descartadas**:
- Solo tests de aplicación con DB mockeada: no probarían la garantía real anti-solape.

## Cuestiones abiertas

Ninguna bloqueante. Rendimiento y escala se mantienen como objetivos holgados por tratarse de
clínicas pequeñas (2-5 profesionales); no requieren investigación adicional para la 001.
