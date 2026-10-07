# Contratos — Portal del Paciente (003)

Contratos que 003 **expone** (endpoints del portal) y **consume** (puertos de 005). El ciclo de
vida y la concurrencia los aporta 001 (referenciado, no redefinido).

| Contrato | Tipo | Propietario | Archivo |
|----------|------|-------------|---------|
| Vista del portal (citas del paciente) | HTTP GET expuesto por 003 | 003 | [portal-vista.md](./portal-vista.md) |
| Cancelación desde el portal | HTTP POST expuesto por 003 | 003 (orquesta 005+001) | [portal-cancelacion.md](./portal-cancelacion.md) |
| Puertos de acceso y política | Interfaces consumidas por 003 | **005** | [puertos-005.md](./puertos-005.md) |

## Convenciones (heredadas de 001)

- Respuestas de error con forma `{ error: { codigo, mensaje } }`, mensajes en es-ES
  (`app/api/_lib/respuestas.ts`).
- Instantes en UTC (ISO 8601); presentación en `Europe/Madrid` con formato español.
- El token opaco nunca se registra en claro ni se refleja en mensajes de error.
