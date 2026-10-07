# Feature Specification: Acceso y cancelación del paciente

**Feature Branch**: `005-acceso-cancelacion-paciente`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Acceso y cancelación del paciente. Esta spec es la ÚNICA fuente de verdad sobre cómo un paciente accede a sus datos y cancela citas; el portal (002) y los recordatorios (003) la consumen y la referencian, nunca la redefinen. Acceso: cada paciente tiene UN enlace personal estable /p/[token] (token opaco, regenerable por recepción si se compromete). Sin cuentas ni contraseñas. Cancelación: permitida hasta 24 horas antes del inicio (decisión de Sara sobre C1: regla única y que se pueda explicar por teléfono; la propuesta de 2 h queda registrada como posible v2 con lista de espera). Dentro de la ventana: el portal no ofrece cancelar y muestra el teléfono de la clínica. Cancelar libera el hueco (estado 'cancelada' del núcleo)."

## Contexto y propiedad *(fuente de verdad)*

Esta especificación es la **ÚNICA fuente de verdad** sobre dos conceptos, resolviendo los
solapamientos S1 (ventana de cancelación) y S3 (identidad/acceso del paciente sin cuenta)
detectados en `specs/000-revision-cruzada-jul2026.md`:

1. **Cómo accede un paciente a sus datos** sin cuenta ni contraseña.
2. **Cuándo puede un paciente cancelar** una cita por autoservicio (política de cancelación).

**Consumidores** (no redefinen estas reglas, las referencian):

- **002 (Recordatorios de Cita)**: todo enlace del recordatorio apunta a `/p/[token]`; la
  cancelación desde el recordatorio delega en esta política, no en un umbral propio.
- **003 (Portal del Paciente)**: la vista del portal usa el mismo enlace `/p/[token]` y la
  misma política de cancelación definida aquí.

**Dependencia con el núcleo (001)**: 001 es el propietario del ciclo de vida de la cita. Esta
spec **no reimplementa** la transición de estado ni la liberación del hueco: al cancelar,
**invoca** la operación de cancelación de 001 (`reservada → cancelada`), que es la que libera
el hueco. Esta spec sólo decide **si** se permite disparar la cancelación (autorización por
token + ventana temporal) y qué se muestra al paciente.

## Clarifications

### Session 2026-09-22

- Q: ¿Qué umbral rige la cancelación por el paciente (S1: 2 h vs 24 h)? → A: **24 horas** antes
  del inicio. Decisión de Sara: "regla única y que se pueda explicar por teléfono". La propuesta
  de 2 h queda registrada como posible v2 acompañada de lista de espera (fuera de alcance aquí).
- Q: ¿Cómo accede el paciente sin cuenta (S3: token por cita vs token por paciente)? → A: **Un
  único enlace personal estable por paciente** `/p/[token]` (token opaco), que da acceso a todas
  sus citas. No se emite un enlace por cita. Sustituye a cualquier token por cita de 002.
- Q: ¿Qué pasa si el token se compromete? → A: Recepción puede **regenerar** el token del
  paciente; el enlace anterior deja de ser válido de inmediato.
- Q: ¿Se pide un segundo factor (p. ej. 4 dígitos del teléfono) para acceder? → A: Fuera de
  alcance en esta spec; el acceso se basa en la posesión del token opaco. Si 003 desea reforzar
  con un segundo factor, se especificará como ampliación de esta política, no como una identidad
  paralela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso del paciente por enlace personal (Priority: P1)

Un paciente recibe un enlace personal estable (`/p/[token]`) por cualquier canal (portal,
recordatorio, u otros futuros). Al abrirlo, ve sus próximas citas sin necesidad de crear una
cuenta ni introducir una contraseña. El mismo enlace sirve siempre y da acceso a todas sus
citas.

**Why this priority**: Es la puerta de entrada del paciente a todo el autoservicio. Sin un
acceso único y estable no hay portal utilizable ni cancelación por el paciente; además, unifica
la identidad del paciente que hoy estaría duplicada entre 002 y 003.

**Independent Test**: Con datos de la semilla, abrir el enlace `/p/[token]` de un paciente con
citas futuras y comprobar que se listan sus citas; abrir un enlace con token inexistente o
alterado y comprobar que se deniega el acceso sin revelar información.

**Acceptance Scenarios**:

1. **Given** un paciente con un token válido y citas futuras, **When** abre `/p/[token]`,
   **Then** ve sus citas asociadas a ese paciente y ninguna de otro paciente.
2. **Given** un token inexistente o manipulado, **When** se abre `/p/[token]`, **Then** el
   acceso se deniega con un mensaje neutro y no se revela ningún dato de ningún paciente.
3. **Given** un paciente cuyo token ha sido regenerado por recepción, **When** se usa el enlace
   antiguo, **Then** el acceso se deniega; **When** se usa el enlace nuevo, **Then** el acceso
   se concede a las mismas citas del paciente.

---

### User Story 2 - Cancelación por el paciente dentro de plazo (Priority: P1)

Desde su enlace personal, un paciente cancela una cita futura cuando faltan 24 horas o más para
el inicio. La cita queda cancelada y su hueco queda libre en la agenda de recepción de forma
inmediata.

**Why this priority**: Es el valor operativo central para el paciente y para la clínica
(convierte no-shows en cancelaciones que liberan hueco). Materializa la política de cancelación
única que consumen 002 y 003.

**Independent Test**: Partir de una cita "reservada" cuyo inicio está a 25 horas, cancelarla
desde el enlace del paciente y verificar que pasa a "cancelada" y que el hueco queda libre para
una nueva reserva.

**Acceptance Scenarios**:

1. **Given** una cita "reservada" cuyo inicio es dentro de 25 horas, **When** el paciente la
   cancela desde `/p/[token]`, **Then** la cita pasa a "cancelada" (transición de 001) y el
   hueco queda libre en la agenda.
2. **Given** el hueco liberado por esa cancelación, **When** la recepción crea una nueva cita en
   ese mismo hueco y profesional, **Then** el sistema la acepta (el hueco estaba realmente libre).
3. **Given** una cita ya cancelada por el paciente, **When** el paciente intenta cancelarla de
   nuevo desde el enlace, **Then** el sistema informa de que ya no procede y no realiza ningún
   cambio (una sola cancelación efectiva).

---

### User Story 3 - Bloqueo de cancelación dentro de la ventana (Priority: P1)

Cuando faltan menos de 24 horas para el inicio (o la cita ya empezó o pasó), el enlace del
paciente **no ofrece** la opción de cancelar y muestra el teléfono de la clínica para gestionarlo
por llamada.

**Why this priority**: Es la otra mitad, indisociable, de la política de cancelación. Su ausencia
provocaría la incoherencia S1 (dos comportamientos distintos según el canal). Debe existir a la
vez que la US2 para que la regla sea única y explicable por teléfono.

**Independent Test**: Partir de una cita "reservada" cuyo inicio está a 23 horas y comprobar que
el enlace del paciente no ofrece cancelar y muestra el teléfono de la clínica; comprobar además
que un intento directo de cancelar fuera de plazo se rechaza.

**Acceptance Scenarios**:

1. **Given** una cita "reservada" cuyo inicio es dentro de 23 horas, **When** el paciente abre
   la vista de esa cita, **Then** no se ofrece la acción de cancelar y se muestra el teléfono de
   la clínica.
2. **Given** una cita cuyo inicio es dentro de 23 horas, **When** se intenta forzar la
   cancelación por el paciente, **Then** el sistema la rechaza (fuera de plazo) y no realiza
   ningún cambio.
3. **Given** una cita que ya empezó o ya pasó, **When** el paciente abre su vista, **Then** no
   se ofrece cancelar y se muestra el teléfono de la clínica.

---

### Edge Cases

- **Token justo en el límite (24 h exactas)**: una cita cuyo inicio es exactamente dentro de 24
  horas SÍ es cancelable por el paciente (el umbral es "24 horas o más"). A 23 h 59 min no lo es.
- **Cita no "reservada"**: si la cita ya está "completada", "cancelada" o "no_asistida", el
  enlace no ofrece cancelar; un intento directo se rechaza sin cambiar nada.
- **Cancelación concurrente por dos vías (email y portal) o paciente/recepción**: el resultado
  final es coherente — una sola cancelación efectiva, sin estados imposibles (la atomicidad la
  garantiza 001).
- **Token comprometido y regenerado**: el enlace antiguo deja de funcionar en el mismo momento
  de la regeneración; no hay periodo de solapamiento en que ambos enlaces sean válidos.
- **Token inexistente/manipulado**: acceso denegado con mensaje neutro, sin distinguir "no
  existe" de "no autorizado", para no filtrar información.
- **Cita de otro paciente**: un token nunca da acceso ni permite cancelar citas que no
  pertenezcan a su paciente.
- **Coherencia de textos**: cualquier texto que comunique la política de cancelación (portal,
  emails, otros canales) se deriva de esta spec; no puede afirmar un plazo distinto de 24 h.

## Requirements *(mandatory)*

### Functional Requirements

#### Acceso del paciente

- **FR-001**: El sistema MUST asociar a cada paciente **un único enlace personal estable** de la
  forma `/p/[token]`, donde el token es **opaco e imposible de adivinar**. Un mismo enlace da
  acceso a todas las citas de ese paciente; NO se emite un enlace por cita.
- **FR-002**: El sistema MUST conceder acceso a la vista del paciente únicamente cuando el token
  corresponda a un paciente existente; MUST denegar el acceso, con un mensaje neutro, cuando el
  token sea inexistente o manipulado, sin revelar la existencia o los datos de ningún paciente.
- **FR-003**: A través de su enlace, el paciente MUST poder ver **solo sus propias citas**;
  el sistema MUST impedir el acceso a citas de cualquier otro paciente.
- **FR-004**: El sistema MUST permitir a la recepción **regenerar** el token de un paciente si se
  compromete; al regenerarlo, el enlace anterior MUST dejar de ser válido de inmediato y el nuevo
  enlace MUST dar acceso a las mismas citas del paciente.
- **FR-005**: El sistema MUST tratar `/p/[token]` como el **único punto de acceso del paciente**;
  todo enlace que reciba el paciente desde cualquier canal (portal, recordatorios, futuros
  canales) MUST apuntar a `/p/[token]` y NO crear una identidad de acceso alternativa.
- **FR-006**: El acceso del paciente NO requiere cuenta ni contraseña; se basa en la posesión del
  token opaco. (Un eventual segundo factor sería una ampliación de esta política, no una
  identidad paralela; fuera de alcance aquí.)

#### Política de cancelación por el paciente

- **FR-007 (política única, capital)**: El sistema MUST permitir la cancelación por el paciente
  **solo cuando falten 24 horas o más** para la hora de inicio de la cita. Este es el **único
  umbral** de cancelación por el paciente para todos los canales.
- **FR-008**: El sistema MUST impedir la cancelación por el paciente cuando falten **menos de 24
  horas** para el inicio, o cuando la cita ya haya empezado o pasado; en ese caso el enlace del
  paciente MUST **no ofrecer** la acción de cancelar y MUST mostrar el **teléfono de la clínica**
  para gestionarlo por llamada.
- **FR-009**: El sistema MUST permitir la cancelación por el paciente **solo sobre citas en
  estado "reservada"**; sobre cualquier otro estado no ofrece cancelar y un intento directo se
  rechaza sin cambios.
- **FR-010**: Al cancelar dentro de plazo, el sistema MUST llevar la cita al estado "cancelada"
  **invocando la operación de cancelación de la 001**, de modo que el hueco quede inmediatamente
  libre en la agenda de recepción. Esta spec NO reimplementa la transición ni la liberación del
  hueco.
- **FR-011 (idempotencia/concurrencia)**: El sistema MUST resolver de forma coherente varias
  solicitudes de cancelación concurrentes sobre la misma cita (por el mismo o distintos canales,
  o frente a un cambio de recepción), resultando en **una sola cancelación efectiva** y sin dejar
  la cita en un estado imposible. La garantía de atomicidad de la transición la aporta la 001;
  esta spec se limita a invocarla y a mostrar el mensaje adecuado si la cita ya no está
  "reservada".

#### Coherencia de comunicación (regla de negocio de coherencia)

- **FR-012 (RN de coherencia)**: Cualquier texto que comunique la política de cancelación al
  paciente (portal, emails de recordatorio, futuros canales) MUST **derivarse de esta spec** y
  NO reescribir el umbral: MUST comunicar el plazo de 24 horas y, dentro de la ventana, remitir
  al teléfono de la clínica. Ninguna otra spec (002, 003) puede afirmar un plazo distinto.
- **FR-013**: El sistema MUST presentar los textos de acceso y cancelación en **español de
  España**, sin jerga técnica, usables sin formación y funcionales tanto en portátil como en
  móvil (constitución p.7 y p.8), y MUST mostrar fechas y horas de forma inequívoca para una
  clínica española (constitución p.2).

### Key Entities *(include if feature involves data)*

- **Enlace de acceso del paciente**: relación 1:1 entre un paciente y un **token opaco** estable.
  Atributos: token (opaco, no adivinable), paciente al que pertenece, estado (vigente / revocado
  al regenerar). Da acceso a todas las citas del paciente. Es propiedad de esta spec.
- **Política de cancelación del paciente**: regla de negocio con un **umbral único de 24 horas**
  antes del inicio y una acción alternativa (mostrar teléfono de la clínica) dentro de la ventana.
  Es propiedad de esta spec; 002 y 003 la consumen por referencia.
- **Cita** (propiedad de 001, referida aquí): unión de profesional + servicio + paciente con
  estado. Esta spec sólo lee su estado/inicio y dispara la transición `reservada → cancelada` de
  001; no define ni su ciclo de vida ni el efecto sobre el hueco.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los accesos, un token válido muestra únicamente las citas de su
  paciente y ningún dato de otros pacientes.
- **SC-002**: En el 100 % de los intentos, un token inexistente o manipulado se rechaza con un
  mensaje neutro y sin filtrar información.
- **SC-003**: En el 100 % de los casos, tras regenerar el token de un paciente, el enlace antiguo
  deja de conceder acceso y el nuevo concede acceso a las mismas citas.
- **SC-004**: El 100 % de las cancelaciones solicitadas a 24 horas o más del inicio se ejecutan y
  liberan el hueco; el 100 % de las solicitadas a menos de 24 horas se rechazan/no se ofrecen.
- **SC-005**: En el 100 % de las cancelaciones dentro de plazo, el hueco liberado admite
  inmediatamente una nueva cita en ese profesional y franja.
- **SC-006**: Ante cancelaciones concurrentes sobre la misma cita, en el 100 % de los casos queda
  exactamente una cancelación efectiva y ningún estado imposible.
- **SC-007**: El 100 % de los textos de política de cancelación mostrados al paciente comunican el
  plazo de 24 horas (0 textos que afirmen un plazo distinto), verificable revisando los mensajes
  de portal y recordatorios.
- **SC-008**: La vista de acceso y cancelación es usable y legible en portátil y en móvil, con
  contraste y tamaños accesibles, y toda fecha/hora se muestra sin ambigüedad para España.

## Assumptions

- El acceso del paciente se basa en la **posesión del token opaco**; no hay cuentas, contraseñas
  ni recuperación de credenciales en esta spec.
- El umbral de cancelación es **24 horas** (decisión de negocio de Sara). La alternativa de 2 h
  con lista de espera queda registrada como **posible v2** y está fuera de alcance aquí.
- La transición de estado y la liberación del hueco son propiedad de **001**; esta spec asume que
  001 expone una operación de cancelación atómica e idempotente que puede invocarse desde varios
  canales (ver S2/S7 del informe de revisión cruzada).
- Cada paciente pertenece a una única clínica (coherente con 001); el teléfono de la clínica que
  se muestra dentro de la ventana es el de la clínica del paciente.
- Las fechas y horas se interpretan en la zona horaria peninsular española (coherente con 001).
- 002 y 003 adoptan `/p/[token]` como único acceso del paciente y esta política de cancelación;
  cualquier token por cita previo de 002 queda sustituido por este enlace por paciente.

## Fuera de alcance (005)

- La **reprogramación** por el paciente (cambiar hora/profesional): fuera de alcance; en el núcleo
  mover una cita equivale a cancelar y crear (propiedad de 001).
- **Lista de espera** y umbral de 2 h (posible v2 de la política de cancelación).
- La **transición de estado** y la **liberación del hueco** en sí: son propiedad de 001; aquí solo
  se invocan.
- Un **segundo factor** de autenticación (p. ej. 4 dígitos del teléfono): si se decide, será una
  ampliación de esta política de acceso, no una identidad paralela.
- El **diseño concreto** del portal (003) y del contenido de los recordatorios (002): esos son
  propiedad de sus respectivas specs, que consumen esta.
