# Contrato: Cancelación desde el portal

**Expuesto por 003** | **Método**: `POST /api/portal/[token]/cancelar`

Orquesta la cancelación por el paciente: verifica acceso (**005**), evalúa la política de
cancelación (**005**, 24 h) y, si procede, **invoca la transición de 001**. 003 no reimplementa
la transición ni la concurrencia.

## Entrada

- **Ruta**: `token` (opaco, 005).
- **Cuerpo** (JSON, validado con Zod):

```json
{ "citaId": "…uuid…" }
```

## Flujo

1. `PortalAccessGateway.resolverPaciente(token)` → `pacienteId`/`clinicaId` o **denegado**.
2. Cargar la cita y comprobar que pertenece a ese paciente (si no, se trata como no encontrada).
3. `PoliticaCancelacion.evaluar(cita, ahora)` (005): si no es cancelable → `409 FUERA_DE_PLAZO`
   con el teléfono de la clínica.
4. Si es cancelable → `cambiarEstado(clinicaId, citaId, 'cancelada')` (001).
5. Traducir el resultado de 001 a la respuesta del portal.

## Salida `200 OK`

```json
{ "citaId": "…uuid…", "estado": "cancelada" }
```

## Errores

| Situación | Código HTTP | `codigo` | Origen de la regla |
|-----------|-------------|----------|--------------------|
| Token denegado | `404` | `ACCESO_DENEGADO` | 005 |
| Cita no pertenece al paciente / inexistente | `404` | `CITA_NO_EXISTE` | 003 (comprobación de pertenencia) + 001 |
| Fuera de la ventana de 24 h o ya empezada | `409` | `FUERA_DE_PLAZO` (incluye `telefonoClinica`) | **005** |
| Cita no está "reservada" (ya cancelada/completada/no_asistida) | `409` | `TRANSICION_INVALIDA` | **001** |
| Cuerpo inválido / `citaId` ausente | `400` | `DATOS_INCOMPLETOS` | 003 (Zod) |

## Idempotencia y concurrencia

- La segunda cancelación de la misma cita (doble toque, reintento, o carrera con email(002)/
  recepción(001)) resulta en **una sola cancelación efectiva**: la transición de 001 está
  condicionada a `estado = 'reservada'`, de modo que la segunda no encuentra fila y devuelve
  `TRANSICION_INVALIDA`, que el portal presenta como "esta cita ya no puede cancelarse".
- 003 **no** implementa control de concurrencia propio (FR-014, FR-015; S7 resuelto por 001).

## Trazabilidad
- FR-009 (dispara cancelación), FR-010 (invoca 001, libera hueco), FR-011/FR-012 (política 005),
  FR-013 (confirmación previa en UI), FR-014 (idempotencia por 001), FR-015 (concurrencia por 001).
  SC-003, SC-004, SC-006.
