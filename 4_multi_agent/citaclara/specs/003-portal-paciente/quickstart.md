# Quickstart (validación): Portal del Paciente

**Feature**: 003-portal-paciente | **Fecha**: 2026-09-25

Guía para validar de extremo a extremo que el portal funciona con los datos de la semilla. No
contiene implementación; remite a los [contratos](./contracts/README.md) y al
[data-model](./data-model.md).

## Prerrequisitos

- Node.js ≥ 22, PostgreSQL 16 accesible (ver `docker-compose.yml`).
- Variables de entorno (`.env`) según `.env.example`, incluyendo `DATABASE_URL` y `SESSION_SECRET`.
- Dependencias instaladas: `npm install`.

## Preparar datos deterministas (semilla)

```bash
npm run db:migrate       # aplica el esquema de 001
npm run db:seed          # Clínica Eleva: 3 profesionales, 4 servicios, ~40 pacientes,
                         # 8 semanas de historial + 2 semanas de citas futuras "reservada"
```

La semilla es determinista (misma semilla → misma historia), así los ejemplos son reproducibles
(Principio 5). Un paciente de la semilla tiene citas futuras "reservada" e historial pasado.

## Arrancar la aplicación

```bash
npm run dev
# Portal del paciente: http://localhost:3000/p/<token>
# (el <token> lo resuelve el puerto de acceso de 005; en desarrollo, el adaptador provisional
#  documentado en contracts/puertos-005.md deriva un token de prueba a partir del paciente de la
#  semilla)
```

## Escenarios de validación

### V1 — Ver próximas citas e historial (US1)
1. Abre `/p/<token>` de un paciente de la semilla con citas futuras y pasadas.
2. **Esperado**: dos grupos, "Próximas citas" (orden ascendente) e "Historial" (descendente);
   cada cita con fecha/hora en formato ES ("dd/MM/yyyy HH:mm"), profesional, servicio y estado;
   ninguna cita de otro paciente. (FR-005..FR-008, SC-001)

### V2 — Cancelar una cita futura dentro de plazo (US2)
1. Elige una cita "reservada" a **24 h o más** del inicio; pulsa "Cancelar cita" y confirma.
2. **Esperado**: la cita pasa a "cancelada" (transición de 001), mensaje de confirmación, y el
   hueco queda libre en la agenda de recepción (verificable en el panel de la 001). (FR-009,
   FR-010, FR-013, SC-003)
3. Verifica que recepción puede crear una nueva cita en ese hueco/profesional. (SC-005 de 005)

### V3 — Cancelación bloqueada dentro de la ventana (US2 / política 005)
1. Elige una cita "reservada" a **menos de 24 h** del inicio.
2. **Esperado**: no se ofrece cancelar; se muestra el teléfono de la clínica ("llame a la
   clínica"). Un intento directo de cancelar devuelve `409 FUERA_DE_PLAZO`. (FR-011, FR-012,
   SC-004; regla de 005)

### V4 — Acceso denegado (US3 / acceso 005)
1. Abre `/p/<token-invalido>` (inexistente o manipulado).
2. **Esperado**: mensaje neutro de acceso denegado; no se muestra ninguna cita ni dato; el token
   no aparece en la respuesta ni en logs. (FR-001..FR-003, SC-005 de 003; regla de 005)
3. Con el adaptador de 005 que simula regeneración: el enlace antiguo se deniega y el nuevo da
   acceso a las mismas citas. (005 FR-004)

### V5 — Idempotencia y concurrencia (FR-014/FR-015; garantía de 001)
1. Cancela la misma cita dos veces (doble toque / dos pestañas) o en paralelo con una cancelación
   de recepción.
2. **Esperado**: una sola cancelación efectiva; la segunda recibe `TRANSICION_INVALIDA` y la UI
   muestra "esta cita ya no puede cancelarse"; ningún estado imposible. (SC-006)

### V6 — Estados vacíos (FR-008)
1. Abre el portal de un paciente sin próximas citas (y/o sin historial).
2. **Esperado**: mensajes claros de vacío, sin errores.

## Comprobaciones de calidad

```bash
npm run typecheck
npm run test                 # unit: agrupado futuras/pasadas, orden, formato ES, elegibilidad
npm run test:integration     # contratos portal-vista y portal-cancelacion contra PostgreSQL real
npm run test:e2e             # Playwright: ver, cancelar, acceso denegado, accesibilidad y móvil
```

- **Accesibilidad y responsive (SC-007)**: la suite e2e incluye ejes de accesibilidad y viewport
  móvil/escritorio.
- **Formato ES inequívoco (SC-008)**: verificado en unit (formato de fecha/hora) y e2e.

## Definición de "hecho" para la validación
- V1–V6 pasan; suite `npm run test:all` en verde (Principio 6).
- Ningún texto del portal afirma un plazo de cancelación distinto de la política de 005 (SC-007
  de 005; FR-012 de 005).
