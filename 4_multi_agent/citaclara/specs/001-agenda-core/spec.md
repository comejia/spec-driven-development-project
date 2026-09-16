# Feature Specification: Núcleo de Agenda

**Feature Branch**: `001-agenda-core`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Núcleo de agenda de CitaClara. Clínicas pequeñas (2-5 profesionales); la recepción gestiona la agenda; los pacientes solo existen como fichas. Entidades, cita con estados, RN1 anti-solape, RN2 no citas en pasado, agenda del día de recepción, semilla determinista, y exclusiones de alcance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Alta de cita sin solapes (Priority: P1)

La recepción da de alta una cita seleccionando un profesional, un servicio y un
paciente ya fichado, e indicando la hora de inicio. El sistema calcula el fin
automáticamente (inicio + duración del servicio) y registra la cita solo si el hueco
del profesional está libre. Si el hueco choca con otra cita reservada o completada del
mismo profesional, la reserva se rechaza con un mensaje claro.

**Why this priority**: Es el corazón del producto y materializa la regla capital de la
constitución (imposible el solape). Sin esto no hay agenda utilizable ni valor entregado.

**Independent Test**: Se puede probar de forma aislada creando una cita en un hueco libre
(éxito) y otra que solape una existente del mismo profesional (rechazo), verificando el
estado de la agenda tras cada intento.

**Acceptance Scenarios**:

1. **Given** un profesional sin citas a las 10:00 y un servicio de 45 min, **When** la
   recepción crea una cita a las 10:00 para ese profesional, servicio y un paciente
   fichado, **Then** la cita queda registrada como "reservada" con inicio 10:00 y fin 10:45.
2. **Given** una cita "reservada" de 10:00 a 10:45 de María, **When** la recepción intenta
   crear otra cita de María que empieza a las 10:30, **Then** el sistema rechaza la creación
   e informa de que el hueco está ocupado, y la agenda no cambia.
3. **Given** una cita "completada" de 10:00 a 10:45 de María, **When** la recepción intenta
   crear otra cita de María de 10:15 a 11:00, **Then** el sistema la rechaza igualmente
   (una cita completada también bloquea el hueco).
4. **Given** una cita "cancelada" o "no asistida" de 10:00 a 10:45 de María, **When** la
   recepción crea una nueva cita de María a las 10:00, **Then** el sistema la acepta (los
   estados cancelada y no asistida liberan el hueco).
5. **Given** dos solicitudes de reserva del mismo hueco del mismo profesional que llegan a
   la vez, **When** ambas se procesan, **Then** exactamente una queda registrada y la otra
   se rechaza; nunca quedan las dos.

---

### User Story 2 - Agenda del día por profesional (Priority: P1)

La recepción abre la "agenda del día" de un profesional concreto y ve, de un vistazo, los
huecos ocupados (con paciente, servicio y franja horaria) y los huecos libres, para un día
elegido.

**Why this priority**: Es la vista operativa diaria de recepción; sin ella no se puede
gestionar la jornada ni decidir dónde encajar una cita. Junto con la US1 forma el MVP.

**Independent Test**: Con datos de la semilla, abrir la agenda de María para un día con
citas y comprobar que se listan sus citas en orden horario, distinguiendo ocupado de libre,
sin mostrar citas de otros profesionales.

**Acceptance Scenarios**:

1. **Given** un profesional con varias citas en un día, **When** la recepción abre su agenda
   de ese día, **Then** ve las citas de ese profesional en orden cronológico con hora de
   inicio, hora de fin, servicio, paciente y estado.
2. **Given** un día con franjas sin citas, **When** la recepción consulta la agenda del día,
   **Then** distingue visualmente los tramos libres de los ocupados.
3. **Given** dos profesionales con citas el mismo día, **When** la recepción abre la agenda
   de uno, **Then** no aparecen las citas del otro.

---

### User Story 3 - Marcar estado de la cita (Priority: P2)

Sobre una cita existente, la recepción marca el resultado: completada (el paciente acudió y
se atendió), cancelada (la cita no se realiza) o no asistida (el paciente no se presentó a
una cita que seguía reservada).

**Why this priority**: Da valor operativo y deja la agenda fiel a la realidad, pero puede
llegar después del alta y la vista diaria. Es también la base de futura analítica (fuera de
alcance aquí).

**Independent Test**: Partir de una cita "reservada" y aplicar cada transición válida,
verificando el estado final y que no se permiten transiciones inválidas.

**Acceptance Scenarios**:

1. **Given** una cita "reservada", **When** la recepción la marca como completada, **Then**
   su estado pasa a "completada".
2. **Given** una cita "reservada", **When** la recepción la marca como cancelada, **Then**
   su estado pasa a "cancelada".
3. **Given** una cita "reservada", **When** la recepción la marca como no asistida, **Then**
   su estado pasa a "no_asistida".
4. **Given** una cita ya "completada", "cancelada" o "no_asistida", **When** se intenta
   cambiar de nuevo su estado, **Then** el sistema no permite la transición (los estados
   finales no se reabren en la 001).

---

### User Story 4 - Acceso con clave de clínica (Priority: P2)

La recepción accede al panel de la clínica introduciendo la clave de esa clínica. Sin la
clave correcta, no se puede ver ni gestionar la agenda.

**Why this priority**: Es la barrera mínima de acceso para operar. Es una autenticación
simplificada asumida como deuda consciente para la v1; suficiente para el MVP pero no el
objetivo principal de la feature.

**Independent Test**: Intentar acceder al panel con la clave correcta (acceso concedido) y
con una clave incorrecta o vacía (acceso denegado).

**Acceptance Scenarios**:

1. **Given** una clínica con su clave de panel, **When** la recepción introduce la clave
   correcta, **Then** accede a la agenda de esa clínica.
2. **Given** una clínica con su clave de panel, **When** se introduce una clave incorrecta,
   **Then** el acceso se deniega y no se muestra ninguna agenda.

---

### Edge Cases

- **Reserva en el pasado (RN2)**: intentar crear una cita cuyo inicio ya ha pasado se
  rechaza con un mensaje claro; la agenda no cambia.
- **Cita adyacente sin solape**: una cita que empieza exactamente cuando termina otra (p. ej.
  10:45 tras una de 10:00–10:45) NO se considera solape y se acepta.
- **Solape total, parcial y por contención**: se rechaza tanto el solape parcial (bordes que
  se cruzan) como el caso en que una cita contiene por completo a otra o coincide exactamente.
- **Paciente inexistente**: no se puede crear una cita para un paciente que no está fichado.
- **Datos incompletos en el alta**: falta profesional, servicio, paciente o inicio → la cita
  no se crea y se indica qué falta.
- **Franja que cruza medianoche o día sin actividad**: la agenda del día muestra correctamente
  un día sin citas (todo libre) y no mezcla citas de días contiguos.
- **Concurrencia en el mismo instante (RN1)**: dos altas simultáneas del mismo hueco del mismo
  profesional resultan en exactamente una cita registrada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar clínicas, cada una con una clave de panel que
  habilita el acceso a su agenda (autenticación simplificada v1).
- **FR-002**: El sistema MUST permitir registrar profesionales con nombre y especialidad,
  asociados a una clínica.
- **FR-003**: El sistema MUST permitir registrar servicios con nombre, duración en minutos y
  precio en euros.
- **FR-004**: El sistema MUST permitir registrar pacientes con nombre, teléfono y email como
  fichas (los pacientes no acceden al sistema en la 001).
- **FR-005**: El sistema MUST permitir crear una cita que une un profesional, un servicio y un
  paciente, con una hora de inicio.
- **FR-006**: El sistema MUST calcular la hora de fin de la cita automáticamente como
  inicio + duración del servicio; el fin no se introduce manualmente.
- **FR-007**: El sistema MUST asignar el estado "reservada" a toda cita recién creada.
- **FR-008**: El sistema MUST permitir las transiciones de estado reservada → completada,
  reservada → cancelada y reservada → no_asistida, y MUST rechazar cualquier otra transición.
- **FR-009**: El sistema MUST tratar "no_asistida" exclusivamente como que el paciente no se
  presentó a una cita que seguía reservada.
- **FR-010 (RN1, capital)**: El sistema MUST impedir la creación de una cita que solape en el
  tiempo con otra cita en estado "reservada" o "completada" del mismo profesional. Las citas
  en estado "cancelada" o "no_asistida" NO bloquean el hueco.
- **FR-011 (RN1, concurrencia)**: Cuando dos o más solicitudes de reserva del mismo hueco del
  mismo profesional se procesen de forma simultánea, el sistema MUST registrar exactamente una
  y rechazar las demás; en ningún caso pueden quedar dos citas solapadas.
- **FR-012**: El sistema MUST considerar que dos citas se solapan cuando sus intervalos
  [inicio, fin) se intersecan; citas adyacentes (el fin de una coincide con el inicio de la
  otra) NO se consideran solape.
- **FR-013 (RN2)**: El sistema MUST rechazar la creación de citas cuyo inicio esté en el pasado.
- **FR-014**: El sistema MUST rechazar la creación de una cita si falta el profesional, el
  servicio, el paciente o la hora de inicio, o si el paciente no está fichado, informando del
  motivo.
- **FR-015**: La recepción MUST poder consultar la "agenda del día" de un profesional para una
  fecha dada, viendo sus citas en orden cronológico con inicio, fin, servicio, paciente y estado.
- **FR-016**: La agenda del día MUST distinguir visualmente los tramos ocupados de los libres y
  MUST mostrar únicamente las citas del profesional seleccionado.
- **FR-017**: La recepción MUST poder marcar una cita como completada, cancelada o no asistida
  desde la agenda.
- **FR-018**: El sistema MUST exigir la clave de la clínica para acceder a su agenda y MUST
  denegar el acceso cuando la clave sea incorrecta o esté ausente.
- **FR-019**: El sistema MUST mostrar todos los importes cuadrados al céntimo y todas las fechas
  y horas de forma inequívoca para una clínica española (constitución p.2).
- **FR-020**: El sistema MUST presentar la interfaz de recepción en español de España, sin jerga
  técnica, usable sin formación y funcional tanto en portátil como en móvil (constitución p.7 y p.8).
- **FR-021**: El sistema MUST disponer de un conjunto de datos de demostración deterministas
  (misma semilla → misma historia) que specs, ejemplos y analítica puedan citar (constitución p.5).

### Datos de demostración (semilla determinista)

La semilla determinista de la 001 MUST reproducir exactamente:

- **Clínica**: "Clínica Eleva", con su clave de panel.
- **Profesionales (3)**: María (fisioterapia), Jorge (fisioterapia), Lucía (nutrición).
- **Servicios (4)**: sesión fisio (45 min, 40,00 €), primera visita fisio (60 min, 50,00 €),
  consulta nutrición (30 min, 35,00 €), primera nutrición (45 min, 45,00 €).
- **Pacientes**: aproximadamente 40 fichas.
- **Historia**: 8 semanas pasadas de citas con ~10 % de no asistencia y ~8 % de cancelaciones.
- **Futuro**: 2 semanas de reservas futuras.
- La misma semilla MUST producir siempre la misma historia (importes, fechas y estados
  reproducibles y sin solapes).

### Key Entities *(include if feature involves data)*

- **Clínica**: negocio que opera la agenda. Atributos: nombre, clave de panel. Contiene
  profesionales, servicios, pacientes y citas.
- **Profesional**: persona que atiende citas. Atributos: nombre, especialidad. Pertenece a una
  clínica. No puede tener dos citas activas (reservada o completada) solapadas.
- **Servicio**: prestación ofertada. Atributos: nombre, duración (minutos), precio (euros).
  Determina la duración de la cita.
- **Paciente**: ficha de la persona atendida. Atributos: nombre, teléfono, email. No accede al
  sistema en la 001.
- **Cita**: unión de profesional + servicio + paciente en una franja [inicio, fin). Atributos:
  inicio, fin (derivado), estado (reservada, completada, cancelada, no_asistida). fin = inicio +
  duración del servicio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los intentos, es imposible dejar registradas dos citas solapadas
  del mismo profesional en estado reservada o completada, incluso bajo solicitudes simultáneas
  del mismo hueco.
- **SC-002**: El 100 % de los intentos de crear una cita en el pasado se rechazan.
- **SC-003**: La hora de fin de toda cita coincide exactamente con inicio + duración del servicio
  en el 100 % de las citas creadas.
- **SC-004**: Todos los importes mostrados cuadran al céntimo (0 descuadres) y todas las fechas y
  horas se muestran en formato inequívoco para España.
- **SC-005**: Una persona de recepción sin formación previa localiza la agenda del día de un
  profesional y da de alta una cita válida en menos de 2 minutos.
- **SC-006**: La agenda del día muestra correctamente ocupado frente a libre y solo las citas del
  profesional seleccionado en el 100 % de las consultas.
- **SC-007**: Al regenerar los datos de demostración con la misma semilla, la historia resultante
  (número de citas, importes, fechas y estados) es idéntica en el 100 % de las ejecuciones.
- **SC-008**: La interfaz de recepción es usable y legible tanto en pantalla de portátil como en
  móvil, con contraste y tamaños accesibles.

## Assumptions

- La gestión de la agenda la realiza exclusivamente la recepción; los pacientes no inician
  sesión ni interactúan con el sistema en la 001.
- La autenticación por clave de clínica es una simplificación consciente (deuda técnica) para la
  v1; no contempla usuarios individuales, roles ni recuperación de clave.
- Cada clínica opera su propia agenda de forma aislada; los datos no se comparten entre clínicas.
- Todas las citas de una clínica se interpretan en la zona horaria peninsular española salvo
  indicación futura en contra.
- La duración del servicio se expresa en minutos enteros y el precio en euros con dos decimales.
- Los estados "cancelada" y "no_asistida" son finales en la 001 y liberan el hueco para nuevas
  reservas; "completada" es final y mantiene el hueco ocupado a efectos de solape histórico.
- El tamaño típico de clínica es de 2 a 5 profesionales.

## Fuera de alcance (001)

Se abordarán en specs propias:

- Cualquier acceso o interacción del paciente con el sistema.
- Recordatorios (email, SMS u otros).
- Analítica e informes.
- Pagos online.
