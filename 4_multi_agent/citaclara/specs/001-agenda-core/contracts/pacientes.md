# Contrato: Pacientes (FR-004/004a)

## POST /api/pacientes
Crea una ficha de paciente en la clínica.

**Entrada**:
```json
{ "nombre": "string", "telefono": "string", "email": "string?" }
```

**Salida 201**: `{ "id": "uuid", "nombre": "...", "telefono": "...", "email": "..." }`

**Errores**:
- `400 DATOS_INCOMPLETOS`: falta `nombre` o `telefono`.
- `409 TELEFONO_DUPLICADO`: ya existe una ficha con ese teléfono en la clínica (FR-004a).
- `422 EMAIL_INVALIDO`: `email` aportado con formato no válido.

## GET /api/pacientes?buscar={texto}
Busca fichas por nombre o teléfono (para seleccionar paciente al crear cita).

**Salida 200**: `[{ "id": "uuid", "nombre": "...", "telefono": "..." }]`
