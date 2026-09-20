# Feature Specification: Recordatorios de Cita

**Feature Branch**: `002-recordatorios-cita`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Recordatorios de cita. El dolor número uno del cliente piloto: la no asistencia. Alcance: un proceso diario genera un recordatorio por email para cada cita reservada de las próximas 24-48 horas, sin duplicar envíos; el email incluye los datos de la cita y una forma de que el paciente cancele si no va a ir (mejor un hueco libre que un no-show). Correo en modo simulado sin SMTP configurado: se escriben ficheros .eml en datos/salida-correo/. Preguntas cerradas para Sara: antelación exacta, qué pasa si el paciente cancela desde el email y con cuánta antelación puede, y si el recordatorio se reenvía cuando la cita se mueve. Fuera de alcance v1: SMS y WhatsApp."

## Clarifications

### Session 2026-09-19

- Q: ¿Con qué antelación exacta se envía el recordatorio dentro del rango 24-48 h? → A: Cualquier cita cuya hora de inicio caiga entre 24 y 48 h por delante del momento de ejecución; una única ejecución diaria cubre toda la ventana.
- Q: ¿Con cuánta antelación mínima puede el paciente cancelar desde el email? → A: Hasta 2 horas antes del inicio de la cita; con menos de 2 h se rechaza por fuera de plazo.
- Q: ¿Se reenvía el recordatorio cuando la cita se mueve? → A: Sí; como mover una cita en la 001 equivale a cancelar y crear una nueva, la cita nueva es elegible por sí misma y genera su propio recordatorio si entra en la ventana.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Envío diario de recordatorios sin duplicados (Priority: P1)

Un proceso diario recorre las citas en estado "reservada" cuya hora de inicio cae dentro
de la ventana de antelación configurada (próximas 24-48 horas) y genera, para cada una, un
recordatorio por email dirigido al paciente. El proceso NUNCA genera un segundo recordatorio
para una cita que ya fue recordada, aunque el proceso se ejecute varias veces al día o en
días consecutivos mientras la cita siga dentro de la ventana.

**Why this priority**: Es el corazón de la feature y ataca directamente el dolor número uno
del cliente piloto (la no asistencia). Sin el envío fiable y sin duplicados no hay valor
entregado.

**Independent Test**: Con datos de la semilla, ejecutar el proceso diario para una fecha con
citas reservadas dentro de la ventana y comprobar que se genera exactamente un recordatorio
por cita elegible; volver a ejecutar el proceso el mismo día y comprobar que no se genera
ningún recordatorio adicional.

**Acceptance Scenarios**:

1. **Given** una cita "reservada" cuya hora de inicio cae dentro de la ventana de antelación,
   **When** se ejecuta el proceso diario, **Then** se genera exactamente un recordatorio por
   email para esa cita con los datos de la cita.
2. **Given** una cita para la que ya se generó un recordatorio, **When** se vuelve a ejecutar
   el proceso diario (mismo día o día siguiente) y la cita sigue dentro de la ventana,
   **Then** no se genera ningún recordatorio adicional para esa cita.
3. **Given** citas en estado "cancelada", "completada" o "no_asistida", **When** se ejecuta
   el proceso diario, **Then** no se genera recordatorio para ninguna de ellas.
4. **Given** una cita "reservada" cuya hora de inicio queda fuera de la ventana de antelación
   (demasiado lejana o ya pasada), **When** se ejecuta el proceso diario, **Then** no se
   genera recordatorio para esa cita.
5. **Given** varias citas reservadas elegibles el mismo día, **When** se ejecuta el proceso
   diario, **Then** se genera un recordatorio por cada una, sin mezclar datos entre citas.

---

### User Story 2 - Email con datos de la cita y opción de cancelar (Priority: P1)

El recordatorio que recibe el paciente incluye los datos de su cita (profesional, servicio,
fecha y hora, y nombre de la clínica) y una forma clara de cancelar si no va a acudir, de modo
que un hueco liberado con antelación sea preferible a un no-show.

**Why this priority**: El envío por sí solo no reduce la no asistencia; el paciente necesita
entender su cita y disponer de una vía sencilla para liberar el hueco. Junto con la US1 forma
el MVP.

**Independent Test**: Generar un recordatorio para una cita concreta y verificar que el
contenido incluye profesional, servicio, fecha y hora inequívocas, clínica y un enlace/medio
de cancelación asociado a esa cita.

**Acceptance Scenarios**:

1. **Given** una cita reservada elegible, **When** se genera su recordatorio, **Then** el
   email incluye el nombre del paciente, el profesional, el servicio, la fecha y la hora de
   inicio en formato inequívoco para España, y el nombre de la clínica.
2. **Given** un recordatorio generado, **When** el paciente lo abre, **Then** encuentra una
   forma clara e identificable de cancelar la cita si no va a acudir.
3. **Given** el enlace/medio de cancelación de un recordatorio, **When** se inspecciona,
   **Then** está asociado inequívocamente a esa cita concreta y no a otra.

---

### User Story 3 - Cancelación del paciente desde el email (Priority: P2)

Cuando el paciente usa la vía de cancelación del recordatorio y lo hace con la antelación
mínima permitida, la cita pasa a "cancelada" y el hueco queda libre para nuevas reservas. Si
lo intenta con menos antelación de la permitida, la cancelación se rechaza con un mensaje
claro y la cita no cambia.

**Why this priority**: Cierra el bucle de valor (liberar el hueco), pero depende del envío y
del contenido del email (US1 y US2). Puede entregarse inmediatamente después del MVP.

**Independent Test**: Partir de una cita reservada con recordatorio enviado y ejecutar la
cancelación desde el email dentro y fuera de la ventana de antelación mínima, verificando el
estado resultante de la cita en cada caso.

**Acceptance Scenarios**:

1. **Given** una cita "reservada" con recordatorio enviado y una cancelación solicitada con al
   menos 2 horas de antelación respecto al inicio, **When** el paciente cancela desde el email,
   **Then** la cita pasa a "cancelada" y el hueco queda libre.
2. **Given** una cita "reservada" y una cancelación solicitada con menos de 2 horas de antelación
   respecto al inicio, **When** el paciente intenta cancelar desde el email, **Then** la
   cancelación se rechaza con un mensaje claro y la cita permanece "reservada".
3. **Given** una cita que ya no está "reservada" (por ejemplo ya "cancelada" o "completada"),
   **When** el paciente usa el enlace de cancelación, **Then** el sistema informa de que la
   cita ya no puede cancelarse por esta vía y no realiza ningún cambio.

---

### Edge Cases

- **Paciente sin email**: una cita reservada de un paciente sin email válido no genera
  recordatorio; el proceso continúa con el resto de citas sin fallar.
- **Reejecución dentro de la misma ventana**: ejecutar el proceso varias veces (mismo día o
  días consecutivos) mientras la cita sigue elegible no produce recordatorios duplicados.
- **Cita que cambia de hora (se mueve)**: al mover una cita (cancelar + crear nueva en la 001),
  la cita nueva es elegible por sí misma y genera su propio recordatorio si cae dentro de la
  ventana de 24-48 h y aún no ha sido recordada (FR-011).
- **Cancelación fuera de plazo**: intentar cancelar desde el email con menos de 2 horas de
  antelación respecto al inicio se rechaza sin cambiar la cita.
- **Enlace de cancelación manipulado o inexistente**: un identificador de cancelación que no
  corresponde a ninguna cita se rechaza sin exponer datos de otras citas.
- **Cita ya no reservada al llegar el recordatorio**: si entre la generación del recordatorio
  y la acción del paciente la cita dejó de estar "reservada", la cancelación desde el email no
  aplica y se informa con claridad.
- **Sin SMTP configurado**: en ausencia de SMTP, el envío se simula escribiendo un fichero
  `.eml` por recordatorio en `datos/salida-correo/`; el proceso se considera exitoso igualmente.
- **Día sin citas elegibles**: el proceso diario se ejecuta sin generar ningún recordatorio y
  sin errores.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST disponer de un proceso diario que seleccione las citas en estado
  "reservada" cuya hora de inicio caiga dentro de la ventana de antelación configurada y genere
  un recordatorio por email para cada una.
- **FR-002**: El sistema MUST considerar elegibles únicamente las citas en estado "reservada";
  las citas "cancelada", "completada" o "no_asistida" MUST quedar excluidas del envío.
- **FR-003**: El sistema MUST garantizar que cada cita reciba como máximo un recordatorio: una
  cita ya recordada NO MUST volver a generar recordatorio aunque el proceso se ejecute varias
  veces mientras la cita siga dentro de la ventana (idempotencia por cita).
- **FR-004**: El sistema MUST registrar, para cada cita, que su recordatorio ya fue generado, de
  forma que la no duplicación sea verificable y sobreviva a reejecuciones del proceso.
- **FR-005**: El recordatorio MUST incluir, como mínimo, el nombre del paciente, el profesional,
  el servicio, la fecha y la hora de inicio de la cita, y el nombre de la clínica.
- **FR-006**: El sistema MUST mostrar la fecha y la hora del recordatorio de forma inequívoca
  para una clínica española (constitución p.2) y todo el contenido en español de España
  (constitución p.8).
- **FR-007**: El recordatorio MUST incluir una forma clara para que el paciente cancele la cita
  si no va a acudir, asociada inequívocamente a esa cita concreta.
- **FR-008**: El sistema MUST permitir que el paciente cancele su cita desde el medio incluido en
  el recordatorio, pasando la cita a "cancelada" y liberando el hueco, siempre que la solicitud se
  haga con al menos 2 horas de antelación respecto al inicio de la cita.
- **FR-009**: El sistema MUST rechazar, con un mensaje claro y sin modificar la cita, cualquier
  cancelación desde el email solicitada con menos de 2 horas de antelación respecto al inicio de
  la cita (fuera de plazo).
- **FR-010**: El sistema MUST rechazar de forma segura, sin exponer datos de otras citas, las
  acciones de cancelación cuyo identificador no corresponda a una cita reservable/cancelable
  válida (enlace inexistente, manipulado o de una cita que ya no está "reservada").
- **FR-011**: Cuando una cita se mueve (en la 001 mover equivale a cancelar la cita original y
  crear una cita nueva), la cita nueva MUST ser tratada como cualquier otra cita "reservada" a
  efectos de recordatorio: si cae dentro de la ventana de antelación y aún no ha sido recordada,
  MUST generar su propio recordatorio, independiente del que hubiera podido generar la cita
  original ya cancelada.
- **FR-012**: El sistema MUST considerar elegible para el envío toda cita "reservada" cuya hora
  de inicio caiga entre 24 y 48 horas por delante del momento de ejecución del proceso diario;
  una única ejecución diaria cubre la ventana completa sin dejar huecos.
- **FR-013**: El sistema MUST admitir la cancelación desde el email siempre que se solicite con
  al menos 2 horas de antelación respecto a la hora de inicio de la cita; una solicitud con menos
  de 2 horas de antelación se considera fuera de plazo.
- **FR-014**: En ausencia de SMTP configurado, el sistema MUST simular el envío escribiendo un
  fichero `.eml` por recordatorio en el directorio `datos/salida-correo/`, y MUST considerar el
  envío exitoso a efectos de no duplicación.
- **FR-015**: El sistema MUST omitir, sin interrumpir el proceso, las citas elegibles de
  pacientes sin email válido, dejando constancia de que no se pudo generar el recordatorio.
- **FR-016**: El proceso diario MUST ser reproducible sobre los datos de demostración
  deterministas (constitución p.5): la misma semilla y la misma fecha de ejecución producen el
  mismo conjunto de recordatorios.

### Key Entities *(include if feature involves data)*

- **Cita**: entidad existente (spec 001). Aporta profesional, servicio, paciente, inicio, fin y
  estado. El recordatorio solo aplica a citas en estado "reservada". La cancelación desde el
  email transiciona la cita "reservada" → "cancelada" (transición ya prevista en la 001).
- **Recordatorio**: constancia de que se ha generado un aviso para una cita concreta. Atributos:
  cita asociada, momento de generación, resultado (enviado/simulado/omitido). Garantiza la no
  duplicación (a lo sumo uno vigente por cita dentro de la ventana).
- **Paciente**: entidad existente (spec 001). Aporta nombre y email destino del recordatorio.
- **Salida de correo simulada**: fichero `.eml` por recordatorio escrito en
  `datos/salida-correo/` cuando no hay SMTP; representa el email que se habría enviado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las ejecuciones, cada cita elegible recibe exactamente un
  recordatorio y ninguna cita elegible recibe más de uno, aunque el proceso se ejecute varias
  veces dentro de la ventana.
- **SC-002**: El 100 % de las citas no elegibles (fuera de ventana o en estado distinto de
  "reservada") no generan recordatorio.
- **SC-003**: El 100 % de los recordatorios generados incluyen paciente, profesional, servicio,
  fecha y hora inequívocas, clínica y una vía de cancelación asociada a la cita correcta.
- **SC-004**: El 100 % de las cancelaciones desde el email solicitadas dentro de la antelación
  permitida dejan la cita en "cancelada" y liberan el hueco; el 100 % de las solicitadas fuera
  de plazo se rechazan sin cambiar la cita.
- **SC-005**: Sin SMTP configurado, el 100 % de los recordatorios generados producen un fichero
  `.eml` correspondiente en `datos/salida-correo/`.
- **SC-006**: Al ejecutar el proceso diario sobre la misma semilla y la misma fecha, el conjunto
  de recordatorios generados es idéntico en el 100 % de las ejecuciones (reproducibilidad).
- **SC-007**: Reducción medible de la no asistencia frente al periodo sin recordatorios, medida
  como el porcentaje de citas recordadas que terminan en "no_asistida" comparado con la línea
  base histórica de la semilla.

## Assumptions

- El envío de recordatorios se apoya en la agenda y los pacientes ya definidos en la spec 001;
  esta feature no crea nuevas entidades de agenda ni modifica las reglas de solape.
- El canal único de recordatorio en la v1 es el email; SMS y WhatsApp quedan fuera de alcance.
- La cancelación desde el email reutiliza la transición "reservada" → "cancelada" ya definida en
  la 001, que libera el hueco para nuevas reservas.
- El proceso diario se dispara una vez al día por medios operativos (programador externo o
  ejecución manual); la orquestación del disparo no forma parte del comportamiento observable de
  esta spec, solo su idempotencia y su resultado.
- Las fechas y horas se interpretan en la zona horaria peninsular española, coherente con la 001.
- Los datos de demostración deterministas de la 001 (2 semanas de reservas futuras) son
  suficientes para reproducir citas elegibles dentro de la ventana de antelación.
- El directorio `datos/salida-correo/` se usa como bandeja de salida simulada cuando no hay SMTP;
  su contenido es reproducible a efectos de demostración.

## Fuera de alcance (002)

- Recordatorios por SMS o WhatsApp (solo email en la v1).
- Envío real por SMTP como comportamiento probado de esta spec (el modo por defecto es simulado
  a fichero `.eml`; el envío real, si se habilita, es una integración operativa fuera del alcance
  de comportamiento verificable aquí).
- Reprogramación de citas en sí misma (definida y acotada en la 001); esta spec solo decide si un
  movimiento de cita provoca un nuevo recordatorio.
- Analítica e informes de asistencia más allá del criterio de éxito SC-007.
- Personalización avanzada de plantillas de email, adjuntos o confirmación de asistencia (más
  allá de la cancelación).
