# Contrato: Acceso (FR-018)

## POST /api/acceso
Valida la clave de una clínica y abre sesión.

**Entrada**:
```json
{ "clinica_id": "uuid", "clave": "string" }
```

**Salida 200**: cookie de sesión HTTP-only + `{ "clinica": { "id": "uuid", "nombre": "string" } }`

**Errores**:
- `401 CLAVE_INVALIDA`: clave incorrecta o ausente (no se revela ninguna agenda).
- `400 DATOS_INCOMPLETOS`: falta `clinica_id` o `clave`.

**Referencias**: FR-018, D5. La clave se compara contra `clave_hash` (argon2/bcrypt).

## POST /api/acceso/salir
Cierra la sesión (invalida la cookie). Salida `204`.
