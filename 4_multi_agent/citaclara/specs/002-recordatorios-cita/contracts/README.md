# Contratos — Recordatorios de Cita (002)

Esta feature no expone una API HTTP pública. Sus "contratos" son:

1. **[proceso-diario.md](./proceso-diario.md)** — el contrato del proceso diario (interfaz CLI del
   script, parámetros, entradas/salidas, idempotencia y códigos de salida).
2. **[correo-eml.md](./correo-eml.md)** — el contrato del artefacto de salida: el fichero `.eml`
   escrito en `datos/salida-correo/` (nombre, cabeceras, cuerpo y contenido mínimo).

## Dependencias de contrato con otras specs (consumidas, no definidas aquí)

- **Acceso y cancelación del paciente (005)**: 002 obtiene el enlace `/p/[token]` del paciente y lo
  incrusta en el email. La emisión/validación del token, la política de cancelación (24 h) y la
  vista de cancelación son contrato de **005**. 002 no las redefine.
- **Núcleo de agenda (001)**: la transición `reservada → cancelada`, la liberación del hueco y la
  atomicidad ante concurrencia son contrato de **001** (servicio `cambiar-estado`). 002 las invoca.
- **Panel de analítica (004)**: la tasa oficial de no asistencia es contrato de **004**; la métrica
  de eficacia del recordatorio (SC-008) es propia de 002 y remite a 004.

## Formato de errores

Se reutiliza el catálogo de 001 (`src/domain/errores.ts`, `ErrorNegocio` → `{ error: { codigo,
mensaje } }`), en español de España. Nuevos códigos que pueda necesitar 002 (p. ej. de
configuración del proceso) se añaden a ese catálogo.
