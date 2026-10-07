# Contrato: Proceso diario de recordatorios

**Requisitos**: FR-001, FR-002, FR-003, FR-004, FR-012, FR-013, FR-014, FR-015.

## Interfaz (script CLI)

Se ejecuta como script con `tsx` (patrón de `db:seed` de 001), no como endpoint público.

```
npm run recordatorios:generar -- [--fecha=<ISO 8601>] [--clinica=<uuid>]
```

### Parámetros

| Parámetro | Tipo | Por defecto | Significado |
|-----------|------|-------------|-------------|
| `--fecha` | ISO 8601 (instante) | `ahora` (reloj del sistema) | Instante de referencia para calcular la ventana. Inyectable para reproducibilidad (FR-015, D6). |
| `--clinica` | uuid | todas | Limita el proceso a una clínica (opcional). |

Validación de parámetros con **Zod** (`src/validation/recordatorios.ts`). Una `--fecha` mal
formada termina con código de salida ≠ 0 y un mensaje claro en es-ES, sin generar nada.

## Comportamiento

1. Calcula la ventana `[fecha + 24h, fecha + 48h)` (FR-012).
2. Selecciona las citas con `estado = 'reservada'` cuyo `inicio` cae en la ventana (FR-002).
3. Para cada cita elegible, intenta registrar el recordatorio de forma **idempotente**
   (`INSERT ... ON CONFLICT (cita_id) DO NOTHING`, D2):
   - Si **crea** fila nueva:
     - Si el paciente tiene email válido → compone y escribe el `.eml` (ver
       [correo-eml.md](./correo-eml.md)); `resultado = simulado` (o `enviado` con SMTP futuro).
     - Si el paciente **no** tiene email válido → `resultado = omitido`, no escribe `.eml`,
       continúa (FR-014).
   - Si **no** crea fila (ya existía) → no hace nada para esa cita (FR-003).
4. No aborta ante una cita problemática; procesa el resto (robustez, FR-014).

## Salidas

- **Ficheros** `.eml` en `datos/salida-correo/` (uno por recordatorio generado con email válido).
- **Filas** en la tabla `recordatorio` (una por cita procesada que no estuviera ya recordada).
- **Resumen** por salida estándar: nº de elegibles, generados (`simulado`/`enviado`), omitidos,
  ya-recordados. En es-ES.

### Códigos de salida

| Código | Significado |
|--------|-------------|
| `0` | Proceso completado (aunque haya omitidos por falta de email). |
| `≠ 0` | Error de configuración o de infraestructura (p. ej. `--fecha` inválida, DB no accesible). |

## Garantías (verificables)

- **Idempotencia** (FR-003, SC-001): reejecutar con la misma `--fecha` no genera recordatorios
  adicionales ni reescribe `.eml`.
- **Elegibilidad** (FR-002, SC-002): las citas fuera de ventana o en estado ≠ `reservada` no
  generan recordatorio.
- **Reproducibilidad** (FR-015, SC-006): misma semilla + misma `--fecha` → mismo conjunto de
  recordatorios y de `.eml`.
- **Concurrencia**: dos ejecuciones simultáneas sobre la misma ventana no duplican recordatorios
  (garantía del índice único, D2).

## No incluye (propiedad de otras specs)

- La **cancelación** en sí (005 + 001): el proceso solo incrusta el enlace `/p/[token]`; no cancela.
- La **orquestación del disparo** (cron/systemd): operativa, fuera del comportamiento de la spec.
