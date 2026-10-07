# Feature Specification: Recordatorios de Cita

**Feature Branch**: `002-recordatorios-cita`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Recordatorios de cita. El dolor número uno del cliente piloto: la no asistencia. Alcance: un proceso diario genera un recordatorio por email para cada cita reservada de las próximas 24-48 horas, sin duplicar envíos; el email incluye los datos de la cita y una forma de que el paciente cancele si no va a ir (mejor un hueco libre que un no-show). Correo en modo simulado sin SMTP configurado: se escriben ficheros .eml en datos/salida-correo/. Preguntas cerradas para Sara: antelación exacta, qué pasa si el paciente cancela desde el email y con cuánta antelación puede, y si el recordatorio se reenvía cuando la cita se mueve. Fuera de alcance v1: SMS y WhatsApp."

## Contexto y propiedad *(consumidor, no propietario)*

Esta spec (002 Recordatorios de Cita) es **consumidora**, no propietaria, de los siguientes
conceptos, y los **referencia sin redefinirlos** (constitución: un propietario por spec):

- **Acceso del paciente y política de cancelación** → propiedad de **005 (Acceso y cancelación
  del paciente)**, la ÚNICA fuente de verdad. Todo enlace del recordatorio apunta al enlace
  personal `/p/[token]` de 005 (FR-001/FR-005 de 005) y la cancelación se rige por la política de
  005 (umbral de 24 h; dentro de la ventana, teléfono de la clínica — FR-007/FR-008/FR-012 de 005).
  002 **no fija** ningún umbral de cancelación propio ni emite tokens por cita.
- **Ciclo de vida de la cita** (transición `reservada → cancelada`, liberación del hueco,
  atomicidad ante concurrencia y semántica "mover = cancelar + crear") → propiedad de **001
  (Núcleo de Agenda)**. 002 la consume; **no la reimplementa**.
- **Tasa oficial de no asistencia** → propiedad de **004 (Panel de Analítica)**, Definición A. La
  métrica de 002 es de *eficacia del recordatorio*, distinta y con otro denominador; remite a 004
  para la tasa oficial de la clínica.

## Clarifications

### Session 2026-09-22 (alineación revisión cruzada)

- Q: ¿Qué umbral de cancelación aplica el recordatorio (S1)? → A: Ninguno propio; 002 remite a la
  política de cancelación del paciente de **005** (umbral único de 24 h). Dentro de la ventana, el
  recordatorio remite al teléfono de la clínica. La propuesta de 2 h + lista de espera es posible
  v2, propiedad de 005, no comportamiento de 002.
- Q: ¿Qué identidad/acceso usa el enlace del recordatorio (S3)? → A: El enlace apunta a `/p/[token]`
  de **005** (un único enlace estable por paciente). Se elimina el token de cancelación por cita de
  002; no se crea una segunda identidad ni un segundo emisor/validador de tokens, ni un segundo
  factor propio.
- Q: ¿Quién realiza la transición y libera el hueco (S2/S7)? → A: El servicio de citas de **001**.
  002 solo decide **si** se permite disparar la cancelación (acceso de 005 + ventana de 005). Ante
  concurrencia (email/portal/recepción) el resultado es **una sola cancelación efectiva**, garantía
  de 001.
- Q: ¿Cómo se nombra la métrica de no-shows de 002 (S4)? → A: "Eficacia del recordatorio"
  (% de citas recordadas que acaban en no_asistida; denominador = citas recordadas). NO es la "tasa
  de no asistencia" oficial, que es propiedad de **004**. Se documenta que la cancelación sustituye
  al no-show.

### Session 2026-09-19

- Q: ¿Con qué antelación exacta se envía el recordatorio dentro del rango 24-48 h? → A: Cualquier cita cuya hora de inicio caiga entre 24 y 48 h por delante del momento de ejecución; una única ejecución diaria cubre toda la ventana.
- Q: ¿Con cuánta antelación mínima puede el paciente cancelar desde el email? → A: [SUPERSEDED por la sesión 2026-09-22] Ya no se fija un umbral propio en 002; la cancelación se rige por la política de 005 (24 h).
- Q: ¿Se reenvía el recordatorio cuando la cita se mueve? → A: Sí; como mover una cita en la 001 equivale a cancelar y crear una nueva (FR-017a de 001), la cita nueva es elegible por sí misma y genera su propio recordatorio si entra en la ventana.
- Q: ¿Qué ocurre al pulsar el enlace de cancelar del email? → A: El enlace lleva al paciente a su acceso `/p/[token]` de 005, a la vista de la cita; la cancelación (si procede según la política de 005) y la confirmación las gobierna 005.
- Q: ¿Cómo se protege el enlace de cancelación sin sesión del paciente? → A: [SUPERSEDED por la sesión 2026-09-22] 002 no emite token por cita; reutiliza el acceso `/p/[token]` de 005, que es quien protege el acceso del paciente.
- Q: ¿Regla exacta de idempotencia para no duplicar recordatorios? → A: Como máximo un recordatorio por cita en toda su vida; una vez recordada no se reenvía aunque siga elegible en ejecuciones posteriores. Una cita movida es una cita nueva (FR-011, dependiente de FR-017a de 001) y recibe su propio y único recordatorio.

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

### User Story 2 - Email con datos de la cita y enlace de acceso del paciente (Priority: P1)

El recordatorio que recibe el paciente incluye los datos de su cita (profesional, servicio,
fecha y hora, y nombre de la clínica) y el enlace personal de acceso `/p/[token]` de 005, desde
el que el paciente podrá cancelar si la política de cancelación de 005 lo permite, de modo que un
hueco liberado con antelación sea preferible a un no-show.

**Why this priority**: El envío por sí solo no reduce la no asistencia; el paciente necesita
entender su cita y disponer de una vía sencilla para liberar el hueco. Junto con la US1 forma
el MVP.

**Independent Test**: Generar un recordatorio para una cita concreta y verificar que el
contenido incluye profesional, servicio, fecha y hora inequívocas, clínica y el enlace de acceso
`/p/[token]` de 005 que lleva al paciente a la vista de esa cita.

**Acceptance Scenarios**:

1. **Given** una cita reservada elegible, **When** se genera su recordatorio, **Then** el
   email incluye el nombre del paciente, el profesional, el servicio, la fecha y la hora de
   inicio en formato inequívoco para España, y el nombre de la clínica.
2. **Given** un recordatorio generado, **When** el paciente lo abre, **Then** encuentra el enlace
   personal `/p/[token]` de 005 que le lleva a su acceso, donde podrá cancelar la cita si la
   política de cancelación de 005 lo permite.
3. **Given** el enlace incluido en el recordatorio, **When** se inspecciona, **Then** apunta al
   acceso `/p/[token]` del paciente propietario de la cita (mecanismo de 005) y no a una identidad
   o token propios de 002.

---

### User Story 3 - Cancelación del paciente desde el email (Priority: P2)

Cuando el paciente sigue el enlace del recordatorio y llega a su acceso `/p/[token]` de 005, la
cancelación queda regida por la **política de cancelación del paciente de 005** (umbral único de
24 h): dentro de plazo, la cita pasa a "cancelada" y el hueco queda libre; dentro de la ventana
(menos de 24 h) 005 no ofrece cancelar y muestra el teléfono de la clínica. La transición de
estado y la liberación del hueco las realiza el **servicio de citas de 001**; 002 solo lleva al
paciente al punto de acceso correcto.

**Why this priority**: Cierra el bucle de valor (liberar el hueco), pero depende del envío y
del contenido del email (US1 y US2) y consume la política de 005. Puede entregarse inmediatamente
después del MVP.

**Independent Test**: Partir de una cita reservada con recordatorio enviado, seguir el enlace del
recordatorio hasta `/p/[token]` y comprobar que la posibilidad de cancelar y el resultado son los
que dicta la política de 005 (dentro/fuera de la ventana de 24 h), verificando el estado
resultante de la cita en cada caso.

**Acceptance Scenarios**:

1. **Given** una cita "reservada" con recordatorio enviado y una cancelación permitida por la
   política de 005 (24 h o más para el inicio), **When** el paciente cancela desde su acceso
   `/p/[token]`, **Then** la cita pasa a "cancelada" mediante el servicio de 001 y el hueco queda
   libre.
2. **Given** una cita "reservada" dentro de la ventana de 005 (menos de 24 h para el inicio),
   **When** el paciente abre la vista de esa cita desde el enlace del recordatorio, **Then** 005
   no ofrece cancelar y muestra el teléfono de la clínica; ningún cambio de estado ocurre.
3. **Given** una cita que ya no está "reservada" (por ejemplo ya "cancelada" o "completada"),
   **When** el paciente sigue el enlace del recordatorio, **Then** el sistema informa de que la
   cita ya no puede cancelarse y no realiza ningún cambio (coherente con la garantía de "una sola
   cancelación efectiva" de 001).

---

### Edge Cases

- **Paciente sin email**: una cita reservada de un paciente sin email válido no genera
  recordatorio; el proceso continúa con el resto de citas sin fallar.
- **Reejecución dentro de la misma ventana**: ejecutar el proceso varias veces (mismo día o
  días consecutivos) mientras la cita sigue elegible no produce recordatorios duplicados.
- **Cita que cambia de hora (se mueve)**: al mover una cita (cancelar + crear nueva en la 001,
  FR-017a), la cita nueva es elegible por sí misma y genera su propio recordatorio si cae dentro
  de la ventana de 24-48 h y aún no ha sido recordada (FR-011, dependiente de FR-017a de 001).
- **Cancelación dentro de la ventana de 005**: si el paciente sigue el enlace cuando faltan menos
  de 24 h para el inicio, 005 no ofrece cancelar y muestra el teléfono de la clínica; 002 no fija
  ni evalúa un umbral propio.
- **Enlace del recordatorio manipulado o inexistente**: la validación del acceso `/p/[token]` es
  propiedad de 005 (token de paciente, mensaje neutro, sin filtrar datos); 002 no emite ni valida
  tokens por cita.
- **Cita ya no reservada al llegar el recordatorio**: si entre la generación del recordatorio y la
  acción del paciente la cita dejó de estar "reservada", la cancelación no aplica y se informa con
  claridad; ante concurrencia (email/portal/recepción) 001 garantiza una sola cancelación efectiva.
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
- **FR-003**: El sistema MUST garantizar que cada cita reciba como máximo un recordatorio en toda
  su vida: una vez recordada, NO MUST volver a generar recordatorio para esa misma cita aunque el
  proceso se ejecute varias veces y la cita siga dentro de la ventana en días posteriores
  (idempotencia por cita, no por día). Una cita movida constituye una cita nueva (FR-011) con su
  propio y único recordatorio.
- **FR-004**: El sistema MUST registrar, para cada cita, que su recordatorio ya fue generado, de
  forma que la no duplicación sea verificable y sobreviva a reejecuciones del proceso.
- **FR-005**: El recordatorio MUST incluir, como mínimo, el nombre del paciente, el profesional,
  el servicio, la fecha y la hora de inicio de la cita, el nombre de la clínica, y el enlace
  personal de acceso `/p/[token]` del paciente definido por 005 (FR-001/FR-005 de 005).
- **FR-006**: El sistema MUST mostrar la fecha y la hora del recordatorio de forma inequívoca
  para una clínica española (constitución p.2) y todo el contenido en español de España
  (constitución p.8).
- **FR-007**: El recordatorio MUST incluir un enlace claro al acceso personal `/p/[token]` del
  paciente (mecanismo de 005), que lleva a la vista de la cita correspondiente dentro de su portal.
  002 NO emite ni valida un token propio por cita ni crea una identidad de acceso alternativa
  (S3: acceso propiedad de 005, FR-001/FR-005 de 005).
- **FR-008**: El recordatorio NO MUST fijar un umbral de cancelación propio: la posibilidad de
  cancelar y su plazo se rigen exclusivamente por la **política de cancelación del paciente de
  005** (umbral único de 24 h; FR-007 de 005). Cuando la política de 005 permita cancelar, el
  paciente lo hace desde su acceso `/p/[token]`; 002 se limita a conducirlo a ese punto.
- **FR-009**: Dentro de la ventana de 005 (menos de 24 h para el inicio, o cita ya iniciada o
  pasada), el recordatorio y el acceso NO MUST ofrecer cancelar y MUST remitir al **teléfono de la
  clínica**, coherente con FR-008/FR-012 de 005. 002 no evalúa ni comunica un plazo distinto del
  de 005. (La propuesta de 2 h + lista de espera es posible v2, propiedad de 005, no de 002.)
- **FR-010**: La transición `reservada → cancelada` y la **liberación del hueco** las realiza el
  **servicio de citas de 001** (propietario del ciclo de vida). 002 solo decide **si** procede
  conducir al paciente a la cancelación (autorización por acceso de 005 + ventana de 005); NO
  reimplementa la transición ni el efecto sobre el hueco. Cualquier texto de política de
  cancelación en el email MUST derivarse de 005 (FR-012 de 005) y no reescribir el umbral.
- **FR-010a (concurrencia, propiedad de 001)**: Ante solicitudes concurrentes de cancelación
  sobre la misma cita (recordatorio/portal/recepción), el resultado MUST ser **una sola
  cancelación efectiva**, garantía aportada por 001; 002 se limita a mostrar el mensaje adecuado
  si la cita ya no está "reservada".
- **FR-011**: Cuando una cita se mueve, la cita nueva MUST ser tratada como cualquier otra cita
  "reservada" a efectos de recordatorio: si cae dentro de la ventana de antelación y aún no ha
  sido recordada, MUST generar su propio recordatorio, independiente del que hubiera podido
  generar la cita original ya cancelada. **Esta regla depende explícitamente de FR-017a de 001**
  (mover = cancelar la cita original + crear una nueva); si 001 cambiara esa semántica, 002 MUST
  revisarse (S6: anotación de dependencia, sin cambio de comportamiento hoy).
- **FR-012**: El sistema MUST considerar elegible para el envío toda cita "reservada" cuya hora
  de inicio caiga entre 24 y 48 horas por delante del momento de ejecución del proceso diario;
  una única ejecución diaria cubre la ventana completa sin dejar huecos.
- **FR-013**: En ausencia de SMTP configurado, el sistema MUST simular el envío escribiendo un
  fichero `.eml` por recordatorio en el directorio `datos/salida-correo/`, y MUST considerar el
  envío exitoso a efectos de no duplicación.
- **FR-014**: El sistema MUST omitir, sin interrumpir el proceso, las citas elegibles de
  pacientes sin email válido, dejando constancia de que no se pudo generar el recordatorio.
- **FR-015**: El proceso diario MUST ser reproducible sobre los datos de demostración
  deterministas (constitución p.5): la misma semilla y la misma fecha de ejecución producen el
  mismo conjunto de recordatorios.

### Key Entities *(include if feature involves data)*

- **Cita**: entidad existente y **propiedad de 001**. Aporta profesional, servicio, paciente,
  inicio, fin y estado. El recordatorio solo aplica a citas en estado "reservada". La transición
  "reservada" → "cancelada" y la liberación del hueco las realiza el servicio de citas de 001; 002
  solo la consume por referencia.
- **Recordatorio**: constancia de que se ha generado un aviso para una cita concreta. Atributos:
  cita asociada, momento de generación y resultado (enviado/simulado/omitido). El enlace del
  recordatorio referencia el **acceso personal `/p/[token]` del paciente definido por 005**; 002
  NO almacena ni emite un token de cancelación por cita. Garantiza la no duplicación (a lo sumo
  un recordatorio por cita en toda su vida).
- **Enlace de acceso del paciente** (propiedad de 005, referido aquí): `/p/[token]` estable por
  paciente que da acceso a sus citas. 002 lo incrusta en el recordatorio; no lo emite ni lo valida.
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
  fecha y hora inequívocas, clínica y el enlace de acceso `/p/[token]` de 005 del paciente
  propietario de la cita.
- **SC-004**: El 100 % de las cancelaciones disparadas desde el recordatorio se comportan según la
  política de 005: a 24 h o más del inicio la cita queda "cancelada" (vía servicio de 001) y el
  hueco libre; a menos de 24 h no se ofrece cancelar y se remite al teléfono de la clínica. 002 no
  aplica ningún umbral propio.
- **SC-005**: Sin SMTP configurado, el 100 % de los recordatorios generados producen un fichero
  `.eml` correspondiente en `datos/salida-correo/`.
- **SC-006**: Al ejecutar el proceso diario sobre la misma semilla y la misma fecha, el conjunto
  de recordatorios generados es idéntico en el 100 % de las ejecuciones (reproducibilidad).
- **SC-007**: El 100 % de los textos de política de cancelación mostrados en el recordatorio
  comunican el plazo de 24 h de 005 (0 textos que afirmen un plazo distinto), coherente con FR-012
  de 005; la validación del acceso y el rechazo de enlaces manipulados son propiedad de 005.
- **SC-008 (eficacia del recordatorio)**: Métrica de eficacia propia de 002, **distinta de la tasa
  oficial de no asistencia** (que es propiedad de 004, Definición A). Se mide como el porcentaje de
  **citas recordadas** (denominador) que terminan en "no_asistida" (numerador), comparado con la
  línea base histórica de la semilla. Para la tasa de no asistencia oficial de la clínica se
  **remite a 004** (FR-006 de 004: no_asistida ÷ (completada + cancelada + no_asistida)). Debe
  leerse teniendo en cuenta el efecto **"la cancelación sustituye al no-show"**: al facilitar la
  cancelación (vía 005), parte de la mejora es conversión de no-show en cancelación, no solo menos
  no-shows.

## Assumptions

- El envío de recordatorios se apoya en la agenda y los pacientes ya definidos en la spec 001;
  esta feature no crea nuevas entidades de agenda ni modifica las reglas de solape.
- El canal único de recordatorio en la v1 es el email; SMS y WhatsApp quedan fuera de alcance.
- El **acceso del paciente** (enlace `/p/[token]`) y la **política de cancelación** (umbral único
  de 24 h; dentro de la ventana, teléfono de la clínica) son **propiedad de 005**; 002 los consume
  por referencia y no fija umbrales ni emite tokens propios.
- La **transición** "reservada" → "cancelada" y la **liberación del hueco** son propiedad de 001;
  002 asume que 001 expone una operación de cancelación atómica e idempotente invocable desde
  varios canales (una sola cancelación efectiva ante concurrencia).
- La **tasa oficial de no asistencia** es propiedad de 004 (Definición A); la métrica SC-008 de 002
  es de eficacia del recordatorio, con distinto denominador, y remite a 004 para la tasa oficial.
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
- El **acceso del paciente** (`/p/[token]`), su emisión, validación, revocación y cualquier
  **segundo factor**: propiedad de 005. 002 solo incrusta el enlace de 005.
- La **política de cancelación** (umbral de 24 h, mensaje dentro de la ventana, lista de espera y
  posible v2 de 2 h): propiedad de 005. 002 no fija umbrales propios.
- La **transición de estado** y la **liberación del hueco**, así como la **atomicidad ante
  concurrencia**: propiedad de 001; 002 solo las invoca por referencia.
- Reprogramación de citas en sí misma (definida y acotada en la 001, FR-017a); esta spec solo
  decide si un movimiento de cita provoca un nuevo recordatorio.
- Analítica e informes de asistencia; la **tasa oficial de no asistencia** es propiedad de 004.
  002 solo define su métrica de eficacia del recordatorio (SC-008) y remite a 004.
- Personalización avanzada de plantillas de email, adjuntos o confirmación de asistencia (más
  allá de conducir al paciente a su acceso de 005).
