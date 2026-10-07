# Contratos — Núcleo de Agenda (001)

Contratos de las interfaces HTTP internas que la UI de recepción consume (Route Handlers de
Next.js). Formato conceptual (método, ruta, entrada, salida, errores); la implementación
concreta se aborda en `tasks.md`.

Convenciones comunes:
- Toda ruta bajo `/api` requiere sesión de clínica válida salvo `POST /api/acceso` (FR-018).
- Fechas/horas en la entrada: ISO 8601; el servidor interpreta y valida en `Europe/Madrid` (D3).
- Importes en las salidas: enteros de céntimos + cadena formateada es-ES (D2).
- Errores: `{ "error": { "codigo": string, "mensaje": string } }`, mensaje en es-ES sin jerga.

Contratos:
- [acceso.md](./acceso.md) — acceso por clave de clínica
- [agenda.md](./agenda.md) — agenda del día por profesional
- [citas.md](./citas.md) — alta de cita y cambio de estado
- [pacientes.md](./pacientes.md) — fichas de paciente
