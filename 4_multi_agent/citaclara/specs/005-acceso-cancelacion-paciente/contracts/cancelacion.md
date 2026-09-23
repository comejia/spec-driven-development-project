# Contrato: Cancelación por el paciente (FR-007..FR-011)

## POST /api/p/[token]/cancelar
Cancela una cita del paciente **si y solo si** la política lo permite. No reimplementa la
transición: **invoca** `cambiarEstado(clinicaId, citaId, 'cancelada')` de la 001 (D6, FR-010).

**Entrada**:
- `token` en la ruta (identifica y autoriza al paciente por posesión, D7).
- Cuerpo:
```json
{ "citaId": "uuid" }
```

**Precondiciones que verifica el servidor (en orden)**:
1. El `token` resuelve a un paciente (si no → respuesta neutra, FR-002/D4).
2. La cita `citaId` **pertenece a ese paciente** (si no → mismo error neutro, FR-003).
3. `decidirCancelacion(inicio, estado, ahora).permitirCancelar === true` (FR-007/008/009):
   - estado `reservada` **y** faltan **≥ 24 h** para el inicio (24 h exactas incluidas).

**Salida 200** (permitida): la cita queda `cancelada` (transición de 001) y el hueco queda libre
de inmediato en la agenda de recepción (invariante de 001).
```json
{ "cita": { "id": "uuid", "estado": "cancelada" } }
```

**Errores**:
- `403 FUERA_DE_PLAZO`: faltan **menos de 24 h**, o la cita ya empezó/pasó (FR-008). El mensaje
  remite al **teléfono de la clínica**.
- `409 TRANSICION_INVALIDA`: la cita no está `reservada` (ya cancelada/completada/no_asistida), o
  una cancelación concurrente la cerró primero. Resultado: **una sola cancelación efectiva**
  (FR-009, FR-011). Mensaje: "ya no procede" / cita ya cerrada.
- Respuesta **neutra** de enlace no válido: token inexistente/manipulado o cita de otro paciente
  (FR-002, FR-003, D4) — no se revela información.
- `400 DATOS_INCOMPLETOS`: falta `citaId`.

**Idempotencia/concurrencia (FR-011, D6)**: la garantía la aporta 001 — `cambiarEstado` aplica el
`UPDATE` condicionado a `estado = 'reservada'`; dos solicitudes simultáneas (mismo o distinto
canal, o frente a un cambio de recepción) producen exactamente **una** cancelación efectiva; la
segunda recibe `TRANSICION_INVALIDA` sin dejar estados imposibles.

**Coherencia de textos (FR-012)**: cualquier mensaje de plazo mostrado aquí comunica **24 horas**;
002 y 003 reutilizan esta política y no afirman un plazo distinto.

**Referencias**: FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, SC-004, SC-005, SC-006, SC-007.
