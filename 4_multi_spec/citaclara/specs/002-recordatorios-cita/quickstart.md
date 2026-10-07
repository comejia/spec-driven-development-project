# Quickstart — Validación de Recordatorios de Cita (002)

Guía para validar de extremo a extremo que la 002 genera recordatorios correctos, sin duplicados y
reproducibles, y que el `.eml` cumple su contrato. No contiene implementación; para detalles, ver
[data-model.md](./data-model.md) y [contracts/](./contracts/README.md).

## Prerrequisitos

- Node.js ≥ 22 y el proyecto de 001 operativo (mismo repositorio).
- PostgreSQL 16 (local o vía `docker compose up -d postgres`), con las migraciones de 001 aplicadas.
- La **migración de 002** aplicada (crea el enum `resultado_recordatorio` y la tabla
  `recordatorio` con índice único por `cita_id`).
- La **semilla determinista** de 001 ejecutada (`npm run db:seed`): aporta 2 semanas de reservas
  futuras, suficientes para poblar la ventana de 24-48 h.
- Directorio de salida `datos/salida-correo/` (se crea si no existe).
- **Dependencia con 005**: para el enlace `/p/[token]` real se necesita 005 integrada. Mientras no
  lo esté, la validación usa un proveedor de enlaces de doble (stub); el resto de garantías (ventana,
  idempotencia, reproducibilidad, `.eml`) se validan igualmente.

## Puesta en marcha

1. Instalar dependencias y arrancar PostgreSQL.
2. Aplicar migraciones (001 + 002): `npm run db:migrate`.
3. Sembrar datos deterministas: `npm run db:seed`.
4. Ejecutar el proceso diario con una fecha de referencia fija (reproducible):
   `npm run recordatorios:generar -- --fecha=2026-10-01T09:00:00+02:00`.

## Escenarios de validación (mapeados a la spec)

### V1 — Generación en ventana 24-48 h (FR-001/FR-002/FR-012, US1)
- Ejecutar el proceso con una `--fecha` tal que existan citas `reservada` cuyo inicio caiga en
  `[fecha+24h, fecha+48h)` → se genera **un** recordatorio por cita elegible; se crea un `.eml` por
  cada uno en `datos/salida-correo/`.
- Verificar que citas fuera de la ventana (antes de 24 h o después de 48 h) **no** generan nada.

### V2 — Exclusión por estado (FR-002, SC-002)
- Citas `cancelada`, `completada` o `no_asistida` dentro de la ventana → **no** generan recordatorio.

### V3 — Idempotencia por cita (FR-003/FR-004, SC-001) — capital de esta feature
- Volver a ejecutar el proceso con la **misma `--fecha`** → **0** recordatorios nuevos y **0** `.eml`
  adicionales (garantía del índice único + `ON CONFLICT DO NOTHING`).
- Ejecutar al día siguiente mientras la cita sigue en ventana → tampoco se reenvía (un recordatorio
  por cita en toda su vida).

### V4 — Concurrencia (D2) — prueba hostil
- Lanzar dos ejecuciones simultáneas sobre la misma ventana → cada cita elegible obtiene
  exactamente **un** recordatorio; nunca dos (verificado por el índice único de la tabla
  `recordatorio`).

### V5 — Paciente sin email (FR-014, D5)
- Una cita elegible cuyo paciente no tiene email válido → `resultado = omitido`, **sin** `.eml`, y
  el proceso continúa con el resto sin fallar. El código de salida es `0`.

### V6 — Contenido y coherencia del `.eml` (FR-005/FR-006/FR-007/FR-008/FR-009, US2)
- Abrir un `.eml` generado y comprobar: paciente, profesional, servicio, **fecha y hora
  `dd/MM/yyyy HH:mm`** (Europe/Madrid), clínica y el enlace `/p/[token]` del paciente.
- Comprobar que el texto de cancelación comunica **24 h** y remite al **teléfono de la clínica**
  dentro de la ventana (coherencia con 005, FR-012 de 005; SC-007). **0** textos con otro plazo.

### V7 — Cita movida = nuevo recordatorio (FR-011, depende de FR-017a de 001)
- Mover una cita (cancelar la original + crear una nueva, vía 001). Ejecutar el proceso →
  la cita nueva (otro `cita_id`) es elegible y recibe su propio y único recordatorio; la original
  cancelada no genera nada.

### V8 — Cancelación desde el enlace (FR-010/FR-010a, US3) — consume 005 + 001
- Con 005 integrada: seguir el enlace `/p/[token]` de un `.eml` para una cita a ≥ 24 h → la
  cancelación pasa la cita a `cancelada` (vía servicio de 001) y libera el hueco.
- Para una cita a < 24 h → 005 no ofrece cancelar y muestra el teléfono de la clínica.
- Concurrencia (email/portal/recepción) → **una sola cancelación efectiva** (garantía de 001).

### V9 — Reproducibilidad (FR-015, SC-006, Principio 5)
- Resetear, re-sembrar y re-ejecutar el proceso con la **misma `--fecha`** → el conjunto de
  recordatorios (filas y `.eml`) es **idéntico** en cada ejecución.

### V10 — Correspondencia 1:1 (SC-005)
- Nº de ficheros `.eml` == nº de filas `recordatorio` con `resultado ∈ {simulado, enviado}`;
  ninguna con `resultado = omitido` produce `.eml`.

## Comandos de prueba (niveles, ver research D6)

- **Unitario** (Vitest): cálculo de ventana 24-48 h, elegibilidad, composición del `.eml` y textos
  es-ES (con enlace de 005 mockeado).
- **Integración** (Vitest + Testcontainers, PostgreSQL efímero): idempotencia (V3), concurrencia
  (V4), exclusión por estado (V2), omitidos (V5) y reproducibilidad (V9) sobre la semilla.
- La validación de la cancelación real (V8) requiere 005 integrada; hasta entonces se cubre el
  consumo con un doble del proveedor de enlaces/cancelación.

La suite completa en verde es **condición de merge** (Principio 6).
