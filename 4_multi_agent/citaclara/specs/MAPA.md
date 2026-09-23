# MAPA de Specs — CitaClara

Registro de propiedad de las especificaciones (constitución, Principio 1: Spec Primero).
Regla: **un único propietario por spec**. Todo cambio de comportamiento de una spec lo
coordina su propietario.

| Spec | Directorio | Título | Propietario | Estado |
|------|------------|--------|-------------|--------|
| 001  | `specs/001-agenda-core` | Núcleo de Agenda | recepción-core (por asignar nominalmente) | Draft |
| 005  | `specs/005-acceso-cancelacion-paciente` | Acceso y cancelación del paciente | acceso-paciente (por asignar nominalmente) | Draft |

Nota de propiedad: la spec 005 es la ÚNICA fuente de verdad del **acceso del paciente sin
cuenta** (`/p/[token]`) y de la **política de cancelación por el paciente** (umbral único de
24 h). Las specs 002 (Recordatorios) y 003 (Portal) la **consumen y referencian**, nunca la
redefinen. El **ciclo de vida de la cita** (incluida la transición `reservada→cancelada` y la
liberación del hueco) sigue siendo propiedad de la spec 001.

## Notas

- Cuando se asigne un propietario nominal, sustituir el marcador de la columna "Propietario"
  por la persona o agente responsable.
- Toda spec nueva se añade a esta tabla en el momento de su creación (`/speckit.specify`).
