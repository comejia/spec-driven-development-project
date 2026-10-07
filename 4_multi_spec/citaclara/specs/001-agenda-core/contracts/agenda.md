# Contrato: Agenda del día (FR-015/016/016a)

## GET /api/agenda?profesional_id={uuid}&fecha={YYYY-MM-DD}
Devuelve la agenda de un profesional para un día, en `Europe/Madrid`.

**Salida 200**:
```json
{
  "profesional": { "id": "uuid", "nombre": "string", "especialidad": "string" },
  "fecha": "2026-09-16",
  "franja_visible": { "desde": "08:00", "hasta": "21:00" },
  "citas": [
    {
      "id": "uuid",
      "inicio": "2026-09-16T10:00:00+02:00",
      "fin": "2026-09-16T10:45:00+02:00",
      "servicio": { "nombre": "Sesión fisio", "duracion_min": 45, "precio": "40,00 €" },
      "paciente": { "id": "uuid", "nombre": "string" },
      "estado": "reservada"
    }
  ]
}
```

**Reglas**:
- Solo devuelve citas del `profesional_id` indicado (FR-016).
- Orden cronológico ascendente por `inicio`.
- `franja_visible` fija 08:00–21:00 (FR-016a); la UI pinta libre/ocupado dentro de ella.

**Errores**:
- `400 DATOS_INCOMPLETOS`: falta `profesional_id` o `fecha`.
- `401 NO_AUTORIZADO`: sin sesión de clínica.
