# Contrato: Acceso del paciente por enlace personal (FR-001..FR-006)

## GET /p/[token]
Página pública del paciente. Resuelve el token opaco a un paciente y muestra **solo sus citas**,
con la política de cancelación aplicada por cita.

**Entrada**: `token` en la ruta (cadena opaca).

**Salida 200** (token válido): vista con la lista de citas del paciente, ordenadas por `inicio`.
Cada cita incluye, de forma conceptual:
```json
{
  "clinica": { "nombre": "string", "telefono": "string" },
  "citas": [
    {
      "id": "uuid",
      "inicio": "2026-07-15T10:00:00Z",
      "inicioTexto": "15/07/2026 10:00",
      "profesional": "string",
      "servicio": "string",
      "estado": "reservada | completada | cancelada | no_asistida",
      "ofrecerCancelar": true,
      "motivoBloqueo": null
    }
  ]
}
```
- `ofrecerCancelar` = `decidirCancelacion(inicio, estado, ahora).ofrecerCancelar` (005).
- Cuando `ofrecerCancelar` es `false`, la UI muestra el **teléfono de la clínica** (FR-008) y el
  motivo apropiado (`fuera_de_plazo` | `ya_iniciada` | `estado_no_cancelable`).

**Salida (token inválido)**: **respuesta neutra** de "enlace no válido" (FR-002, D4). No se
distingue "no existe" de "manipulado" ni se revela ningún dato de ningún paciente.

**Reglas de autorización**:
- El token da acceso **solo** a las citas de su paciente (FR-003); nunca a las de otro paciente.
- Un token **regenerado** (FR-004) invalida el anterior de inmediato: el enlace viejo pasa a la
  respuesta neutra; el nuevo concede acceso a las mismas citas.

**Referencias**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, SC-001, SC-002, SC-003.

---

## Operación de servicio: regenerar token (FR-004)
Operación de dominio/servicio invocable por recepción para renovar el token de un paciente si se
compromete. **No** es un endpoint del paciente.

**Entrada**: `pacienteId` (en el ámbito de la clínica).

**Efecto**: sustituye el `token` del paciente en su fila 1:1 (`acceso_paciente`); el enlace
anterior deja de resolver de inmediato. Devuelve el nuevo enlace `/p/[token]`.

**Nota de propiedad**: la exposición en la pantalla de recepción se coordina con el propietario de
esa superficie (001/003); la 005 garantiza la **semántica** de la operación (D3).

**Referencias**: FR-004, SC-003.
