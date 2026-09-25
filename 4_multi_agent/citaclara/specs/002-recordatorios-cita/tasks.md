# Tasks: Recordatorios de Cita

**Input**: Documentos de diseño de `/specs/002-recordatorios-cita/`

**Prerequisites**: plan.md (requerido), spec.md (historias de usuario), research.md, data-model.md, contracts/

**Tests**: INCLUIDOS. La constitución (Principio 6) y el plan/quickstart exigen suite verde como puerta de merge (Vitest unit + integración con Testcontainers). Las tareas de test se generan explícitamente.

**Organization**: Las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Rutas de fichero exactas incluidas en cada descripción

## Path Conventions

Extensión del proyecto Next.js de 001 (una sola app). Rutas relativas a la raíz del repositorio:
`src/`, `tests/`, `app/`, `datos/`. El script CLI vive en `src/scripts/` (carpeta nueva de 002;
001 usa `src/seed/` para su semilla — ambos siguen el mismo patrón `tsx` de `package.json`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la estructura y los puntos de entrada nuevos de 002 sobre el proyecto existente de 001.

- [ ] T001 Crear el directorio de salida simulada `datos/salida-correo/` con un `.gitkeep` y añadir `datos/salida-correo/*.eml` a `.gitignore` en la raíz del repositorio
- [ ] T002 [P] Añadir el script `recordatorios:generar` (patrón `tsx`, igual que `db:seed` → `tsx src/seed/run-seed.ts`) en `package.json` apuntando a `src/scripts/generar-recordatorios.ts`
- [ ] T003 [P] Verificar/ajustar configuración de Vitest para incluir los nuevos tests de `src/domain` y `tests/` en `vitest.config.ts` y `vitest.integration.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esquema de datos, validación y abstracciones que TODAS las historias necesitan.

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta completar esta fase.

- [ ] T004 Añadir el enum `resultado_recordatorio` (`enviado`, `simulado`, `omitido`) y la tabla `recordatorio` (con `cita_id` FK→`cita` on delete cascade e índice único `recordatorio_cita_unico` sobre `cita_id`) en `src/db/schema.ts`
- [ ] T005 Generar y añadir la migración Drizzle `0002_recordatorios.sql` (crea enum + tabla + índice único) en `src/db/migrations/` sin tocar tablas de 001
- [ ] T006 [P] Definir el esquema Zod de argumentos del proceso (`--fecha` ISO 8601, `--clinica` uuid opcional) y de configuración de correo (remitente, `BASE_URL`) en `src/validation/recordatorios.ts`
- [ ] T007 [P] Definir la fuente de datos de remitente/clínica para el `.eml`: la tabla `clinica` de 001 solo aporta `id`/`nombre`, por lo que **email remitente, teléfono y dirección de la clínica** deben resolverse desde configuración (`.env` + `.env.example`) mediante un módulo `src/services/correo/config-clinica.ts` (cubre FR-009 "teléfono de la clínica" y cabecera `From`/`Subject` de `contracts/correo-eml.md`)
- [ ] T008 [P] Definir la interfaz `EmisorCorreo` (contrato de envío) en `src/services/correo/emisor.ts`
- [ ] T009 [P] Definir la interfaz `ProveedorEnlaceAcceso` (stub de 005: dado `pacienteId` devuelve el enlace `/p/[token]`) en `src/services/correo/proveedor-enlace.ts`
- [ ] T010 [P] Añadir a `src/domain/errores.ts` los códigos de negocio nuevos que necesite 002 (p. ej. `FECHA_INVALIDA`, `CONFIG_CORREO_INCOMPLETA`), reutilizando el catálogo de 001

**Checkpoint**: Fundamento listo — las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Envío diario de recordatorios sin duplicados (Priority: P1) 🎯 MVP

**Goal**: Un proceso diario selecciona citas `reservada` en la ventana `[fecha+24h, fecha+48h)` y genera exactamente un recordatorio por cita, sin duplicados nunca (idempotencia por cita anclada en el índice único + `ON CONFLICT DO NOTHING`).

**Independent Test**: Con la semilla de 001 y una `--fecha` fija, ejecutar el proceso → un recordatorio por cita elegible; reejecutar la misma `--fecha` → 0 recordatorios nuevos y 0 `.eml` adicionales.

### Tests for User Story 1 (escribir primero, deben FALLAR)

- [ ] T011 [P] [US1] Test unitario de cálculo de ventana 24-48 h y elegibilidad por estado/inicio en `tests/unit/recordatorio-ventana.test.ts`
- [ ] T012 [P] [US1] Test de integración de generación en ventana (V1) y exclusión por estado (V2/FR-002) en `tests/integration/recordatorios-generacion.test.ts`
- [ ] T013 [P] [US1] Test de integración de idempotencia por cita (V3/FR-003): reejecución misma `--fecha` y día siguiente → 0 nuevos, en `tests/integration/recordatorios-idempotencia.test.ts`
- [ ] T014 [P] [US1] Test de integración de concurrencia (V4/D2): dos ejecuciones simultáneas → un solo recordatorio por cita, en `tests/integration/recordatorios-concurrencia.test.ts`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implementar lógica pura de elegibilidad y ventana 24-48 h (usando `src/domain/tiempo.ts`) en `src/domain/recordatorio.ts`
- [ ] T016 [US1] Implementar el servicio del proceso diario: selección de citas `reservada` en ventana + inserción idempotente `INSERT ... ON CONFLICT (cita_id) DO NOTHING` en `src/services/generar-recordatorios.ts` (depende de T004, T006, T015)
- [ ] T017 [US1] Implementar el punto de entrada CLI (`tsx`): parseo/validación de `--fecha`/`--clinica` con Zod, invocación del servicio, resumen en es-ES por stdout y códigos de salida (0 / ≠0) en `src/scripts/generar-recordatorios.ts` (depende de T006, T016)
- [ ] T018 [US1] Añadir manejo de errores de configuración/infra (fecha inválida, DB inaccesible) usando `src/domain/errores.ts` en `src/scripts/generar-recordatorios.ts` (depende de T010, T017)

**Checkpoint**: El proceso diario genera recordatorios sin duplicados y es idempotente/concurrency-safe de forma independiente y verificable.

---

## Phase 4: User Story 2 - Email con datos de la cita y enlace de acceso del paciente (Priority: P1)

**Goal**: Cada recordatorio produce un `.eml` (RFC 5322, sin dependencias nuevas) en `datos/salida-correo/` con paciente, profesional, servicio, fecha/hora `dd/MM/yyyy HH:mm` (Europe/Madrid), clínica, el enlace `/p/[token]` de 005 y el texto de política derivado de 005 (24 h / teléfono de la clínica).

**Independent Test**: Generar el recordatorio de una cita concreta y verificar que el `.eml` incluye todos los datos, el enlace `/p/[token]` del paciente propietario y el texto de 24 h (0 textos con otro plazo).

### Tests for User Story 2 (escribir primero, deben FALLAR)

- [ ] T019 [P] [US2] Test unitario de composición del `.eml`: cabeceras (`From/To/Subject/Date/MIME-Version/Content-Type`), nombre de fichero `<yyyyMMdd-HHmm>-<cita_id>.eml` y cuerpo es-ES con enlace de 005 mockeado y datos de clínica de config, en `tests/unit/correo-eml.test.ts`
- [ ] T020 [P] [US2] Test unitario de coherencia de política (SC-007/FR-008/FR-009): el cuerpo comunica 24 h y teléfono de la clínica, 0 textos con otro plazo, en `tests/unit/correo-politica.test.ts`
- [ ] T021 [P] [US2] Test de integración de correspondencia 1:1 (V10/SC-005): nº de `.eml` == nº de filas con `resultado ∈ {simulado, enviado}` en `tests/integration/recordatorios-eml.test.ts`
- [ ] T022 [P] [US2] Test de integración de paciente sin email (V5/FR-014): `resultado = omitido`, sin `.eml`, proceso continúa con código 0, en `tests/integration/recordatorios-omitidos.test.ts`

### Implementation for User Story 2

- [ ] T023 [P] [US2] Implementar composición del mensaje MIME/`.eml` y textos es-ES (asunto, cuerpo, formato fecha vía `src/domain/tiempo.ts`, texto de política derivado de 005, datos de clínica desde `config-clinica.ts`) en `src/domain/correo.ts` (depende de T007)
- [ ] T024 [P] [US2] Implementar el adaptador `EmisorCorreoEml` que escribe el `.eml` con nombre determinista `<yyyyMMdd-HHmm>-<cita_id>.eml` en `datos/salida-correo/` en `src/services/correo/emisor-eml.ts` (depende de T008, T023)
- [ ] T025 [P] [US2] Implementar el stub del `ProveedorEnlaceAcceso` (enlace `/p/[token]` por `pacienteId`) para uso mientras 005 no esté integrada en `src/services/correo/proveedor-enlace-stub.ts` (depende de T009)
- [ ] T026 [US2] Integrar composición + emisor + proveedor de enlace en el proceso diario: al crear fila con email válido (reutilizar el criterio de validación de email de 001 / `EMAIL_INVALIDO`, ver research D5) → `resultado = simulado` y escribir `.eml`; sin email válido → `resultado = omitido` sin `.eml`, en `src/services/generar-recordatorios.ts` (depende de T016, T023, T024, T025)

**Checkpoint**: US1 y US2 funcionan de forma independiente; los `.eml` cumplen su contrato de contenido y correspondencia 1:1.

---

## Phase 5: User Story 3 - Cancelación del paciente desde el email (Priority: P2)

**Goal**: El enlace del recordatorio conduce al acceso `/p/[token]` de 005; la cancelación, su ventana (24 h) y la transición/liberación del hueco son propiedad de 005 + 001. 002 solo lleva al paciente al punto correcto y muestra el mensaje adecuado si la cita ya no está `reservada`.

**Independent Test**: Partir de una cita reservada con recordatorio enviado, seguir el enlace `/p/[token]` y comprobar que cancelar/no-cancelar y el estado resultante son los que dicta la política de 005 (≥24 h vs <24 h), verificando el estado de la cita en cada caso (con 005 integrada; hasta entonces, con doble del proveedor/servicio de cancelación).

### Tests for User Story 3 (escribir primero, deben FALLAR)

- [ ] T027 [P] [US3] Test de integración: cita movida = nuevo recordatorio (V7/FR-011, **depende de FR-017a de 001**: mover = cancelar original + crear nueva) → la nueva recibe su propio y único recordatorio; la original cancelada no genera nada, en `tests/integration/recordatorios-cita-movida.test.ts`
- [ ] T028 [P] [US3] Test de integración del consumo de cancelación (V8/FR-010/FR-010a) con doble del proveedor de enlace/servicio de 001: ≥24 h → cancelable (transición vía 001, libera hueco); <24 h → no ofrece cancelar y remite al teléfono; cita ya no `reservada` → mensaje "una sola cancelación efectiva", en `tests/integration/recordatorios-cancelacion.test.ts`

### Implementation for User Story 3

- [ ] T029 [US3] Verificar que el cuerpo del `.eml` conduce a la vista de la cita del paciente en `/p/[token]` y que el texto deriva de 005 (sin umbral propio) — ajustar `src/domain/correo.ts` si procede (depende de T023)
- [ ] T030 [US3] Anclar en código la **dependencia con 001 (FR-017a)** y el punto de invocación de la cancelación de 001 (servicio `cambiar-estado`) como dependencia consumida (sin reimplementar la transición): añadir el adaptador/consumo y un comentario de trazabilidad `FR-011 → FR-017a de 001` en `src/domain/recordatorio.ts` y `src/services/generar-recordatorios.ts` (depende de T025). **Si 001 cambiara la semántica "mover", 002 debe revisarse.**

**Checkpoint**: Las tres historias funcionan de forma independiente; 002 consume 005/001 por referencia sin reimplementarlos.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Reproducibilidad, cobertura cruzada, métrica de eficacia y validación end-to-end.

- [ ] T031 [P] Test de integración de reproducibilidad (V9/FR-015/SC-006): reset + re-seed + re-ejecución con la misma `--fecha` → conjunto idéntico de filas `recordatorio` y `.eml`, en `tests/integration/recordatorios-reproducibilidad.test.ts`
- [ ] T032 [P] Test de "día sin citas elegibles": el proceso termina con código 0 y 0 recordatorios, en `tests/integration/recordatorios-sin-elegibles.test.ts`
- [ ] T033 [P] [SC-008] Implementar la consulta de **eficacia del recordatorio** (métrica propia de 002, distinta de la tasa oficial de 004): % de citas recordadas (denominador = filas `recordatorio` con `resultado ∈ {simulado, enviado}`) que terminan en `no_asistida`, en `src/domain/recordatorio.ts` (función pura) + su test en `tests/unit/recordatorio-eficacia.test.ts`. Documentar en el resultado que la **tasa oficial de no asistencia remite a 004** (FR-006 de 004) y el efecto "la cancelación sustituye al no-show"
- [ ] T034 Ejecutar la suite completa (`npm test` unit + `npm run test:integration` con Testcontainers) y dejarla en verde como puerta de merge (Principio 6)
- [ ] T035 [P] Validación manual guiada por `specs/002-recordatorios-cita/quickstart.md` (V1–V10) e inspección de `datos/salida-correo/`
- [ ] T036 [P] Actualizar `specs/MAPA.md` / trazabilidad si procede para reflejar la entrega de 002

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato.
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias.
- **User Stories (Phase 3+)**: dependen de Foundational.
  - US1 (P1) y US2 (P1) forman el MVP; US2 depende del proceso de US1 para integrarse (T026 depende de T016).
  - US3 (P2) depende de US1+US2 (enlace y `.eml`) y consume 005/001.
- **Polish (Phase 6)**: depende de las historias deseadas completas.

### User Story Dependencies

- **US1 (P1)**: arranca tras Foundational — sin dependencias de otras historias.
- **US2 (P1)**: arranca tras Foundational; usa la config de clínica (T007); su integración final (T026) depende del servicio de US1 (T016).
- **US3 (P2)**: arranca tras Foundational; su implementación consume el `.eml`/enlace de US2 y el servicio de cancelación de 001/005.

### Within Each User Story

- Los tests se escriben primero y deben FALLAR antes de implementar.
- Dominio (lógica pura) → servicios → integración/CLI.
- Historia completa antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- Setup: T002 y T003 en paralelo.
- Foundational: T006, T007, T008, T009, T010 en paralelo (T004→T005 secuencial).
- US1: tests T011–T014 en paralelo; T015 en paralelo con los tests.
- US2: tests T019–T022 en paralelo; implementación T023, T024, T025 en paralelo (distintos ficheros).
- US3: tests T027, T028 en paralelo.
- Polish: T031, T032, T033, T035, T036 en paralelo.

---

## Parallel Example: User Story 1

```bash
# Lanzar los tests de US1 juntos (deben fallar primero):
Task: "Test unitario ventana/elegibilidad en tests/unit/recordatorio-ventana.test.ts"
Task: "Test integración generación/exclusión en tests/integration/recordatorios-generacion.test.ts"
Task: "Test integración idempotencia en tests/integration/recordatorios-idempotencia.test.ts"
Task: "Test integración concurrencia en tests/integration/recordatorios-concurrencia.test.ts"

# Lógica pura en paralelo a los tests:
Task: "Implementar elegibilidad/ventana en src/domain/recordatorio.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (CRÍTICO — bloquea todo).
3. Completar Phase 3 (US1) y Phase 4 (US2) → MVP: proceso diario que genera `.eml` correctos sin duplicados.
4. **PARAR y VALIDAR**: idempotencia (V3), contenido del `.eml` (V6/V10) y reproducibilidad básica.

### Incremental Delivery

1. Setup + Foundational → fundamento listo.
2. US1 → proceso idempotente (probar V1/V2/V3/V4).
3. US2 → `.eml` con datos + enlace de 005 (probar V5/V6/V10) → MVP entregable.
4. US3 → consumo de cancelación de 005/001 (probar V7/V8).
5. Polish → reproducibilidad (V9), eficacia (SC-008) y suite completa verde.

---

## Notes

- [P] = ficheros distintos, sin dependencias.
- 002 **consume y no reimplementa**: acceso `/p/[token]` y política 24 h (005); transición/hueco/concurrencia (001); tasa oficial de no asistencia (004).
- La no duplicación se ancla en el índice único de `recordatorio` + `ON CONFLICT DO NOTHING` (no en comprobación de aplicación).
- **Datos de clínica para el `.eml`**: `clinica` de 001 solo tiene `id`/`nombre`; remitente, teléfono y dirección se resuelven desde configuración (T007), no del esquema de 001.
- **SC-008 (eficacia del recordatorio)**: métrica propia de 002 (T033); la tasa oficial de no asistencia es de 004 y se remite a ella.
- **FR-011 depende de FR-017a de 001** (mover = cancelar + crear): anclado en código en T030.
- Sin SMTP → salida simulada `.eml` en `datos/salida-correo/`; `resultado = simulado`.
- Verificar que los tests fallan antes de implementar; commit tras cada tarea o grupo lógico.
