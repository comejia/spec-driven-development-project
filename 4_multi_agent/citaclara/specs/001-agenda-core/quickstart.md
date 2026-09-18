# Quickstart — Validación del Núcleo de Agenda (001)

Guía para arrancar el entorno y validar de extremo a extremo que la 001 cumple sus reglas.
No contiene implementación; para detalles, ver [data-model.md](./data-model.md) y
[contracts/](./contracts/README.md).

## Prerrequisitos

- Node.js 22 LTS y gestor de paquetes del proyecto.
- PostgreSQL 16 con la extensión `btree_gist` disponible (local o vía contenedor).
- Variables de entorno: cadena de conexión a PostgreSQL y secreto de sesión.

## Puesta en marcha

1. Instalar dependencias.
2. Aplicar migraciones (crean tablas, enum de estado y las **restricciones de exclusión**
   anti-solape; habilitan `btree_gist`).
3. Ejecutar la **semilla determinista** (Clínica Eleva). Debe producir siempre la misma historia
   (D6, FR-021): 3 profesionales, 4 servicios, ~40 pacientes, 8 semanas pasadas y 2 futuras.
4. Arrancar la aplicación (frontend + Route Handlers).

## Escenarios de validación (mapeados a la spec)

### V1 — Acceso por clave (FR-018, US4)
- Acceder con la clave correcta de Clínica Eleva → se muestra la agenda.
- Acceder con clave incorrecta o vacía → acceso denegado, sin agenda.

### V2 — Agenda del día (FR-015/016/016a, US2)
- Abrir la agenda de María en un día con citas → citas en orden cronológico, con inicio, fin,
  servicio, paciente y estado; franja visible 08:00–21:00; libre vs. ocupado diferenciado.
- Verificar que NO aparecen citas de Jorge ni de Lucía.

### V3 — Alta de cita válida (FR-005/005a/006/007, US1)
- Crear cita para María, "Sesión fisio" (45 min) a las 10:00 de un día futuro → queda
  `reservada` con fin 10:45.
- Intentar inicio 10:07 → rechazo `GRANULARIDAD_INVALIDA` (FR-005a).

### V4 — Anti-solape del profesional (RN1, FR-010/012) — capital
- Con la cita de V3 existente, intentar otra de María de 10:30 → rechazo `SOLAPE_PROFESIONAL`.
- Crear una cita adyacente de María a las 10:45 → se acepta (los bordes no solapan, FR-012).

### V5 — Concurrencia del mismo hueco (RN1, FR-011) — prueba hostil
- Lanzar dos altas simultáneas del mismo hueco de María (mismo inicio) → exactamente una obtiene
  `201` y la otra `409 SOLAPE_PROFESIONAL`. Nunca quedan las dos (verificado por la restricción
  de exclusión de PostgreSQL). Esta comprobación es obligatoria (Principio 3, Principio 6).

### V6 — Anti-solape del paciente entre profesionales (FR-012a)
- Con una cita activa de un paciente a las 10:00, intentar otra del mismo paciente con Lucía que
  solape → rechazo `SOLAPE_PACIENTE`.

### V7 — No citas en el pasado (RN2, FR-013)
- Intentar crear una cita con inicio anterior a ahora → rechazo `CITA_EN_PASADO`.

### V8 — Estados de la cita (FR-008/009/017, US3)
- Marcar una cita `reservada` como completada / cancelada / no asistida → transición correcta.
- Reintentar cambiar el estado de una cita ya final → rechazo `TRANSICION_INVALIDA`.
- Tras cancelar o marcar no asistida, crear una nueva cita en ese mismo hueco → se acepta
  (esos estados liberan el hueco).

### V9 — Unicidad de teléfono (FR-004a)
- Fichar un paciente con un teléfono ya usado en la clínica → rechazo `TELEFONO_DUPLICADO`.

### V10 — Exactitud numérica y temporal (Principio 2, FR-019)
- Comprobar que los precios se muestran al céntimo en es-ES ("40,00 €") y las fechas/horas en
  formato español 24 h, sin ambigüedad.

### V11 — Reproducibilidad de la semilla (Principio 5, SC-007, FR-021)
- Resetear y re-sembrar con la misma semilla → la historia (nº de citas, importes, fechas,
  estados) es idéntica.

### V12 — Calidad de interfaz (Principio 7, SC-005/006/008)
- La agenda y el alta son usables sin manual, en español de España, con contraste y tamaños
  accesibles, y se ven correctamente en portátil y en móvil.

## Comandos de prueba (niveles, ver research D7)

- Unitario (dominio: solape, dinero, tiempo, estados) — Vitest.
- Integración contra PostgreSQL real (exclusión, concurrencia, unicidad, RN2) — Vitest +
  Testcontainers.
- E2E (acceso, agenda, alta, estados, accesibilidad, responsive) — Playwright.

La suite completa en verde es **condición de merge** (Principio 6).
