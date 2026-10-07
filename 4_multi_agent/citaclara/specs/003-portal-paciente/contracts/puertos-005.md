# Contrato consumido: Puertos de acceso y política (propiedad de 005)

003 programa contra estas **interfaces**; su implementación real es propiedad de **005**. Mientras
005 no exista, 003 usa adaptadores **provisionales** sobre la semilla (sustituibles sin cambiar la
UI ni los servicios de lectura). Los puertos viven en `src/portal/puertos.ts`.

## `PortalAccessGateway` (acceso — 005 FR-001..FR-006)

Traduce un token opaco en la identidad del paciente, o deniega sin filtrar información.

```ts
type ResultadoAcceso =
  | { ok: true; pacienteId: string; clinicaId: string }
  | { ok: false }; // denegado: token inexistente, manipulado o regenerado (mensaje neutro)

interface PortalAccessGateway {
  resolverPaciente(token: string): Promise<ResultadoAcceso>;
}
```

- **Regla**: nunca revela si un token existió; `{ ok: false }` cubre todos los casos de denegación
  (D3, 005 FR-002).
- **Regeneración** (005 FR-004): un token regenerado devuelve `{ ok: false }` para el enlace antiguo
  y `{ ok: true }` con el mismo `pacienteId` para el nuevo. 003 no gestiona la regeneración.

## `PoliticaCancelacion` (política — 005 FR-007/FR-008/FR-009)

Decide si una cita es cancelable por el paciente y qué mostrar dentro de la ventana.

```ts
interface EvaluacionCancelacion {
  cancelable: boolean;
  // Presentes cuando cancelable=false por ventana temporal:
  motivo?: 'FUERA_DE_PLAZO' | 'ESTADO_NO_RESERVADA' | 'YA_PASADA';
  telefonoClinica?: string;
}

interface PoliticaCancelacion {
  evaluar(cita: { estado: string; inicio: Date }, ahora: Date): EvaluacionCancelacion;
}
```

- **Regla (005 FR-007)**: `cancelable=true` solo si `estado === 'reservada'` **y** faltan **24 h o
  más** para `inicio`. El umbral es propiedad de 005; 003 no lo fija.
- **Dentro de ventana (005 FR-008)**: `cancelable=false`, `motivo='FUERA_DE_PLAZO'`,
  `telefonoClinica` presente para el mensaje "llame a la clínica".
- **Coherencia de textos (005 FR-012)**: cualquier texto de plazo mostrado por 003 se deriva de
  esta evaluación; 003 no escribe "24 horas" como constante propia.

## Adaptador de desarrollo (provisional, en 003)

- `src/portal/acceso-desarrollo.ts`: implementa `PortalAccessGateway` mapeando token→paciente sobre
  la semilla (p. ej. un token derivado del `pacienteId` para pruebas), marcado como **PROVISIONAL**.
- `src/portal/politica-desarrollo.ts`: implementa `PoliticaCancelacion` con el umbral de 24 h **tal
  como lo especifica 005**, sin inventar reglas nuevas.
- Al integrarse 005, ambos se reemplazan por su implementación; los servicios y la UI de 003 no
  cambian.

## Trazabilidad
- Consumido por `portal-vista.md` (marca `cancelable`) y `portal-cancelacion.md` (autoriza el
  disparo). Remite a 005 FR-001..FR-012 y a 001 para la transición.
