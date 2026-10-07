# Contrato: Citas (FR-005..FR-014, FR-017)

## POST /api/citas
Crea una cita. El `fin` NO se acepta como entrada: se deriva (FR-006).

**Entrada**:
```json
{
  "profesional_id": "uuid",
  "servicio_id": "uuid",
  "paciente_id": "uuid",
  "inicio": "2026-09-16T10:00:00+02:00"
}
```

**Salida 201**:
```json
{ "id": "uuid", "inicio": "...", "fin": "...", "estado": "reservada" }
```

**Errores** (mensaje es-ES, sin jerga):
- `400 DATOS_INCOMPLETOS`: falta profesional, servicio, paciente o inicio (FR-014).
- `404 PACIENTE_NO_EXISTE`: el paciente no está fichado en la clínica (FR-014).
- `422 GRANULARIDAD_INVALIDA`: `inicio` no está en minutos múltiplos de 5 (FR-005a).
- `422 CITA_EN_PASADO`: `inicio` es anterior a ahora (RN2, FR-013).
- `409 SOLAPE_PROFESIONAL`: el hueco choca con una cita activa del profesional (RN1, FR-010/011).
- `409 SOLAPE_PACIENTE`: el paciente ya tiene una cita activa solapada (FR-012a).

**Nota de concurrencia (FR-011)**: los `409 SOLAPE_*` proceden de la violación de la restricción
de exclusión en PostgreSQL; ante dos altas simultáneas del mismo hueco, exactamente una obtiene
`201` y la otra `409`.

## POST /api/citas/{id}/estado
Cambia el estado de una cita (FR-008/017).

**Entrada**:
```json
{ "estado": "completada" }   // completada | cancelada | no_asistida
```

**Salida 200**: `{ "id": "uuid", "estado": "completada" }`

**Errores**:
- `409 TRANSICION_INVALIDA`: la cita no está en `reservada` (los estados finales no se reabren, FR-008).
- `400 ESTADO_INVALIDO`: valor de `estado` no permitido.
