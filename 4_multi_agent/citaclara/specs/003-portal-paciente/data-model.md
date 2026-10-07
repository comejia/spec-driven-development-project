# Data Model (Fase 1): Portal del Paciente

**Feature**: 003-portal-paciente | **Fecha**: 2026-09-25

003 **no crea entidades ni tablas nuevas**. Consume el esquema de la 001 y los conceptos de
acceso/política de la 005. Este documento describe las entidades referidas, las **formas de
lectura** (view models) que produce el portal y las **reglas derivadas** (no propietarias).

## Entidades referidas (no propiedad de 003)

### Paciente (propiedad de 001)
- Campos usados: `id`, `clinicaId`, `nombre`, `telefono`, `email`.
- En 003: sujeto del portal; su `id` lo resuelve el puerto de acceso de 005 a partir del token.
- 003 no modifica pacientes.

### Cita (propiedad de 001)
- Campos usados: `id`, `clinicaId`, `profesionalId`, `servicioId`, `pacienteId`, `inicio`,
  `fin`, `estado` (`reservada|completada|cancelada|no_asistida`).
- En 003: se **lee** para mostrar; para citas "reservada" cancelables (política 005) se dispara
  la transición `reservada → cancelada` de 001. 003 no define el ciclo de vida.

### Servicio y Profesional (propiedad de 001)
- Campos usados: `servicio.nombre`, `servicio.duracionMin`, `servicio.precioCentimos`;
  `profesional.nombre`, `profesional.especialidad`.
- En 003: solo lectura para presentar cada cita.

### Enlace de acceso `/p/[token]` (propiedad de 005)
- Concepto: relación 1:1 token opaco ↔ paciente, regenerable por recepción.
- En 003: se consume vía `PortalAccessGateway`; **no** se almacena ni modela como tabla en 003.

### Política de cancelación (propiedad de 005)
- Concepto: umbral único de 24 h + acción dentro de ventana (teléfono de la clínica).
- En 003: se consume vía `PoliticaCancelacion`; **no** se fija el umbral en 003.

## Formas de lectura producidas por 003 (view models)

### `CitaDelPortal`
Representación de una cita para la UI del paciente (derivada de la lectura de 001):

| Campo | Origen | Notas |
|-------|--------|-------|
| `id` | `cita.id` | Identificador para la acción de cancelar |
| `inicioIso` | `cita.inicio` | Instante en UTC (ISO) |
| `fechaHoraTexto` | `formatearFechaHora(inicio)` | "dd/MM/yyyy HH:mm" es-ES (tiempo.ts) |
| `profesional` | `profesional.nombre` | Sin especialidad técnica en pantalla |
| `servicio` | `servicio.nombre` | Nombre legible |
| `estado` | `cita.estado` | Etiqueta ES (`ETIQUETAS_ESTADO` de 001) |
| `esFutura` | `inicio >= ahora` (Madrid) | Clasifica en próximas/historial |
| `cancelable` | `PoliticaCancelacion.evaluar(...)` (005) | Solo `true` si estado=reservada y dentro de plazo |
| `telefonoClinicaSiBloqueada` | política 005 | Presente cuando `cancelable=false` por ventana |

### `VistaPortal`
Agregado que devuelve el servicio de lectura para pintar la página:

| Campo | Contenido |
|-------|-----------|
| `paciente` | `{ nombre }` (mínimo necesario; sin datos sensibles extra) |
| `proximas` | `CitaDelPortal[]` con `esFutura=true`, orden **ascendente** por inicio |
| `historial` | `CitaDelPortal[]` con `esFutura=false`, orden **descendente** por inicio |

## Reglas derivadas (no propietarias, referencian a 005/001)

- **RD-1 (futura/pasada)**: `esFutura = cita.inicio >= ahora` en `Europe/Madrid`. Propia de 003
  (presentación).
- **RD-2 (cancelable)**: `cancelable = (estado == 'reservada') && Politica005.evaluar(...).cancelable`.
  El umbral (24 h) lo aporta **005**; 003 no lo fija.
- **RD-3 (efecto de cancelar)**: al confirmar, se invoca `cambiarEstado(..., 'cancelada')` de
  **001**, que libera el hueco y garantiza una sola cancelación efectiva (atómica/idempotente).
- **RD-4 (denegación de acceso)**: si `PortalAccessGateway.resolverPaciente(token)` deniega, la
  vista no se construye; se muestra el estado de acceso denegado con mensaje neutro (005).

## Estados y transiciones

003 no define transiciones. La única transición que dispara es `reservada → cancelada`, propiedad
de 001 (`src/domain/cita.ts`, `src/services/cambiar-estado.ts`). Cualquier otro estado no ofrece
cancelar (RD-2) y un intento directo se rechaza por 001 con `TRANSICION_INVALIDA`.
