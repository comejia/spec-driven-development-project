# Contrato: Panel de Analítica (FR-001 a FR-014)

Interfaz de **solo lectura** que devuelve los cuatro bloques del panel en una sola respuesta.
Puede consumirse directamente por el Server Component (llamando al servicio) o vía este Route
Handler HTTP interno.

## GET /api/analitica

Devuelve los indicadores de la clínica de la sesión, calculados en `Europe/Madrid`. Acepta un
parámetro opcional para pruebas reproducibles.

**Entrada (query):**
- `dia_referencia` (opcional, `YYYY-MM-DD`): día desde el que se cuentan "hoy" y las "últimas 8
  semanas". Por defecto = hoy en `Europe/Madrid`. Se usa para reproducir los números de la spec
  con `dia_referencia=2026-09-16` sobre la semilla (FR-014).

**Salida 200:**
```json
{
  "ingresos_por_servicio": {
    "servicios": [
      { "servicio_id": "uuid", "nombre": "Primera visita de fisioterapia", "citas_completadas": 205, "ingresos_centimos": 1025000, "ingresos": "10.250,00 €" },
      { "servicio_id": "uuid", "nombre": "Sesión de fisioterapia", "citas_completadas": 247, "ingresos_centimos": 988000, "ingresos": "9.880,00 €" },
      { "servicio_id": "uuid", "nombre": "Primera visita de nutrición", "citas_completadas": 139, "ingresos_centimos": 625500, "ingresos": "6.255,00 €" },
      { "servicio_id": "uuid", "nombre": "Consulta de nutrición", "citas_completadas": 144, "ingresos_centimos": 504000, "ingresos": "5.040,00 €" }
    ],
    "total_centimos": 3142500,
    "total": "31.425,00 €",
    "sin_datos": false
  },
  "tasa_no_asistencia": {
    "profesionales": [
      { "profesional_id": "uuid", "nombre": "María Ferrer", "especialidad": "Fisioterapia", "no_asistidas": 32, "citas_pasadas_con_desenlace": 284, "tasa_porcentaje": 11.3, "tasa_texto": "11,3 %", "lectura_literal": "de cada 100 citas pasadas, unas 11 terminaron en no asistida" },
      { "profesional_id": "uuid", "nombre": "Jorge Nieto", "especialidad": "Fisioterapia", "no_asistidas": 22, "citas_pasadas_con_desenlace": 279, "tasa_porcentaje": 7.9, "tasa_texto": "7,9 %", "lectura_literal": "..." },
      { "profesional_id": "uuid", "nombre": "Lucía Prados", "especialidad": "Nutrición", "no_asistidas": 39, "citas_pasadas_con_desenlace": 353, "tasa_porcentaje": 11.0, "tasa_texto": "11,0 %", "lectura_literal": "..." }
    ],
    "nota_efecto_cancelacion": "Al facilitar la cancelación por el paciente, parte de la bajada de esta tasa puede deberse a no-shows convertidos en cancelaciones, no solo a menos ausencias."
  },
  "ocupacion_semanal": {
    "semanas": [ { "iso_anio": 2026, "iso_semana": 31, "etiqueta": "Semana 31 · 27 jul–2 ago" } ],
    "series": [
      { "profesional_id": "uuid", "nombre": "María Ferrer", "ocupacion_media": 46, "puntos": [ { "iso_semana": 31, "ocupacion_porcentaje": 46, "minutos_ocupados": 1380, "minutos_jornada": 3000 } ] }
    ]
  },
  "evolucion": {
    "semanas": [
      { "iso_anio": 2026, "iso_semana": 31, "etiqueta": "Semana 31 · 27 jul–2 ago", "citas_completadas": 87, "ingresos_centimos": 367500, "ingresos": "3.675,00 €" },
      { "iso_anio": 2026, "iso_semana": 32, "etiqueta": "Semana 32 · 3–9 ago", "citas_completadas": 91, "ingresos_centimos": 389000, "ingresos": "3.890,00 €" }
    ],
    "sin_datos": false
  }
}
```

**Reglas:**
- **Ingresos** (FR-004/005): solo citas `completada`; total al céntimo (`total_centimos == Σ ingresos_centimos`, SC-001); servicios ordenados por ingresos desc.
- **Tasa** (FR-006/006a): Definición A = `no_asistida ÷ (completada + cancelada + no_asistida)`; solo citas con estado ≠ `reservada`. Denominador 0 → `tasa_porcentaje: null`, `tasa_texto: "sin datos"` (FR-010). `nota_efecto_cancelacion` presente siempre (FR-006c, SC-010).
- **Ocupación** (FR-007/007a): numerador = minutos de citas `reservada`|`completada` (referencia 001 FR-010/RN1); denominador = 600 min × días laborables. Solo hasta la semana en curso; sin semanas futuras. Nunca > 100 %; jornada 0 → `null` "sin datos". Profesional sin citas en semana con jornada → 0 %.
- **Evolución** (FR-008/009): ≤ 8 semanas hacia atrás desde la semana en curso, orden cronológico; menos de 8 semanas → solo las disponibles, sin inventar vacías.
- **Aislamiento** (FR-012): todo se filtra por la clínica de la sesión.
- **Solo lectura** (FR-002, SC-003): el endpoint no escribe nada.

**Errores:**
- `401 NO_AUTORIZADO`: sin sesión de clínica válida (SC-002); no se devuelve ningún dato.
- `400 DATOS_INVALIDOS`: `dia_referencia` presente pero con formato distinto de `YYYY-MM-DD`.
