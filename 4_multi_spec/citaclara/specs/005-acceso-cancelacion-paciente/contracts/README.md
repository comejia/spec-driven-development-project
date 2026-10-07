# Contratos — Acceso y cancelación del paciente (005)

Contratos de las interfaces que la 005 expone al **paciente** (sin sesión de clínica). La
autorización es la **posesión del token opaco** (D7): el servidor resuelve `token → paciente` y
restringe todo al ámbito de ese paciente. Formato conceptual (método, ruta, entrada, salida,
errores); la implementación concreta se aborda en `tasks.md`.

Convenciones comunes:
- El paciente **no** usa la clave de clínica de la 001; su única credencial es el token de `/p/[token]`.
- Denegación **neutra** (FR-002, D4): token inexistente o manipulado producen la **misma**
  respuesta, sin distinguir causas ni revelar existencia de pacientes.
- Fechas/horas de salida: formateadas en `Europe/Madrid`, es-ES (reutiliza `src/domain/tiempo.ts`).
- La cancelación **no** reimplementa la transición de estado: **invoca** `cambiarEstado` de la 001
  (`reservada → cancelada`), que libera el hueco y aporta atomicidad/idempotencia (D6, FR-010/011).
- Errores: `{ "error": { "codigo": string, "mensaje": string } }`, mensaje en es-ES sin jerga
  (mismo catálogo de `src/domain/errores.ts`, ampliado si procede).

Contratos:
- [acceso-paciente.md](./acceso-paciente.md) — vista `/p/[token]` y resolución del token
- [cancelacion.md](./cancelacion.md) — cancelación por el paciente (invoca 001)

Trazabilidad de la política de cancelación (regla única de 24 h, FR-007/008/009): la decisión de
*ofrecer* (vista) y *permitir* (cancelación) usa la **misma** función de dominio
`decidirCancelacion(...)` para garantizar coherencia (FR-012).
