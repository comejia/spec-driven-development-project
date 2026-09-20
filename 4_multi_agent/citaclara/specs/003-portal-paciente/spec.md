# Feature Specification: Portal del Paciente

**Feature Branch**: `003-portal-paciente`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Portal del paciente. Los pacientes de la clínica quieren ver sus citas y cancelarlas sin llamar por teléfono (Sonia, recepción de Eleva, dedica 'la mitad de la mañana' a esto). Alcance: un paciente accede a una página personal moderna donde ve sus citas futuras y pasadas y puede cancelar una cita futura. Interfaz limpia y responsive, pensada para móvil. Preguntas que la spec debe dejar decididas (cerradas, para Sara): cómo accede el paciente sin crear cuentas ni contraseñas, hasta cuándo puede cancelar, y qué pasa con el hueco liberado. Datos: casos reales de la semilla en los ejemplos. Fuera de alcance v1: reservar o mover citas online, pagos."

## Clarifications

### Session 2026-09-19

Las tres decisiones que el enunciado pide dejar cerradas se resuelven aquí con los
valores por defecto recomendados (marcados con "→ A"). Están abiertas a confirmación de
Sara vía `/speckit.clarify`; hasta entonces, la spec asume estas respuestas para poder
planificarse por completo.

- Q: ¿Cómo accede el paciente sin crear cuentas ni contraseñas? → A: Enlace personal con
  token secreto por cita/paciente (magic link) que la clínica comparte; sin registro ni
  contraseña. Como refuerzo opcional, el paciente confirma los 4 últimos dígitos de su
  teléfono al abrir el enlace.
- Q: ¿Hasta cuándo puede cancelar una cita futura? → A: Hasta 24 horas antes de la hora de
  inicio de la cita. Dentro de esa ventana (menos de 24 h o cita ya empezada/pasada) el
  botón de cancelar no está disponible y se indica que debe llamar a la clínica.
- Q: ¿Qué pasa con el hueco liberado al cancelar? → A: El hueco queda libre en la agenda de
  recepción de forma inmediata (la cita pasa a "cancelada", que libera el tramo según la
  001); no se reasigna ni se ofrece automáticamente a otros pacientes en la v1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis citas futuras y pasadas (Priority: P1)

Un paciente de la clínica abre su página personal (a través del enlace que le facilita la
clínica) y ve, en una interfaz limpia pensada para móvil, la lista de sus próximas citas y
el historial de sus citas pasadas, sin llamar por teléfono ni crear ninguna cuenta.

**Why this priority**: Es el valor central del portal y lo que descarga a recepción
(Sonia dedica "media mañana" a atender estas consultas). Ver las citas es, además, el paso
previo imprescindible para poder cancelar. Entregar solo esto ya es un MVP útil.

**Independent Test**: Con los datos de la semilla, abrir el portal de un paciente que tiene
citas futuras y pasadas y comprobar que se listan sus próximas citas y su historial, cada
una con fecha, hora, profesional, servicio y estado, y ninguna cita de otro paciente.

**Acceptance Scenarios**:

1. **Given** un paciente con al menos una cita futura reservada y varias citas pasadas,
   **When** abre su portal personal, **Then** ve dos grupos claramente separados
   ("Próximas citas" e "Historial"), cada cita con fecha, hora de inicio, profesional,
   servicio y estado, en formato inequívoco para España.
2. **Given** un paciente cuyas citas futuras son de distintos profesionales,
   **When** consulta sus próximas citas, **Then** aparecen ordenadas de la más próxima a la
   más lejana.
3. **Given** un paciente sin ninguna cita futura, **When** abre el portal, **Then** ve un
   mensaje claro de que no tiene próximas citas y, si las hay, su historial.
4. **Given** el portal de un paciente concreto, **When** se cargan las citas, **Then** no se
   muestra ninguna cita de otro paciente ni de otra clínica.

---

### User Story 2 - Cancelar una cita futura (Priority: P1)

Desde su página personal, el paciente cancela una de sus citas futuras con un par de toques
y una confirmación, sin llamar a la clínica. Tras cancelar, la cita aparece como cancelada
y el hueco queda libre en la agenda de recepción.

**Why this priority**: Es la acción que elimina las llamadas telefónicas de cancelación y
ahorra a recepción la media mañana descrita. Junto con la US1 forma el MVP completo del
portal.

**Independent Test**: Con datos de la semilla, abrir el portal de un paciente con una cita
futura cancelable (a más de 24 h), cancelarla y comprobar que pasa a "cancelada", que ya no
se ofrece cancelarla de nuevo y que el hueco queda libre en la agenda del profesional.

**Acceptance Scenarios**:

1. **Given** un paciente con una cita reservada dentro de más de 24 horas, **When** pulsa
   "Cancelar cita" y confirma, **Then** la cita pasa a estado "cancelada", se muestra una
   confirmación clara y el hueco queda libre en la agenda de recepción.
2. **Given** una cita reservada cuya hora de inicio es dentro de menos de 24 horas,
   **When** el paciente ve esa cita, **Then** la opción de cancelar no está disponible y se
   le indica que, para cancelar con tan poca antelación, debe llamar a la clínica.
3. **Given** una cita ya pasada, completada, cancelada o marcada como no asistida,
   **When** el paciente la ve en su historial, **Then** no se ofrece la opción de cancelar.
4. **Given** una cita ya cancelada por el paciente, **When** intenta cancelarla de nuevo
   (por ejemplo, con doble toque o recargando), **Then** el sistema no realiza ningún cambio
   adicional y sigue mostrándola como cancelada.
5. **Given** el paciente pulsa "Cancelar cita", **When** aún no confirma, **Then** la cita
   permanece reservada; la cancelación solo se aplica tras una confirmación explícita.

---

### User Story 3 - Acceso personal sin cuentas ni contraseñas (Priority: P1)

El paciente entra a su portal mediante un enlace personal que le facilita la clínica (por
el canal que ya usa: SMS, email o en persona), sin registrarse ni recordar contraseñas. El
enlace solo da acceso a las citas de ese paciente.

**Why this priority**: Sin una forma de acceso, no hay portal. La restricción del negocio
—clínicas pequeñas que no van a gestionar altas de usuarios— hace que este mecanismo sea
condición para las US1 y US2. Es P1 porque las habilita.

**Independent Test**: Abrir un enlace personal válido y comprobar que se accede a las citas
del paciente correcto; abrir un enlace inválido, caducado o manipulado y comprobar que el
acceso se deniega sin revelar datos de ningún paciente.

**Acceptance Scenarios**:

1. **Given** un enlace personal válido de un paciente, **When** el paciente lo abre,
   **Then** accede directamente a sus citas sin pantalla de registro ni contraseña.
2. **Given** un enlace manipulado o inexistente, **When** se intenta abrir, **Then** el
   acceso se deniega con un mensaje neutro y no se muestra ninguna cita ni dato personal.
3. **Given** un enlace válido pero caducado, **When** el paciente lo abre, **Then** se le
   informa de que el enlace ha caducado y se le indica cómo obtener uno nuevo (contactar con
   la clínica), sin exponer sus datos.
4. **Given** el refuerzo opcional activado, **When** el paciente abre un enlace válido,
   **Then** se le pide confirmar los 4 últimos dígitos de su teléfono antes de ver sus
   citas, y un valor incorrecto no da acceso.

---

### Edge Cases

- **Cita justo en el límite de 24 h**: una cita cuyo inicio es exactamente dentro de 24 h se
  trata de forma determinista y consistente (ver FR-011: el límite es "faltan 24 h o más").
- **Cancelación simultánea paciente/recepción**: si el paciente cancela a la vez que
  recepción cambia el estado de la misma cita, el resultado final es coherente (una sola
  cancelación efectiva) y nunca deja la cita en un estado imposible.
- **Enlace reenviado a un tercero**: quien tenga el enlace puede ver las citas del paciente;
  el refuerzo opcional de los 4 dígitos del teléfono mitiga el reenvío accidental (decisión
  de negocio documentada en Assumptions).
- **Paciente sin citas**: el portal se abre correctamente y muestra estados vacíos claros,
  sin errores.
- **Cita en el pasado que sigue "reservada"** (paciente que no acudió y aún no se marcó):
  aparece en el historial y no ofrece cancelar (ya ha pasado su hora de inicio).
- **Zona horaria**: el cálculo de "futura/pasada" y de la ventana de 24 h se hace en la zona
  peninsular española, coherente con el resto del producto.
- **Uso en móvil con conexión intermitente**: si la cancelación no llega a confirmarse, la
  cita permanece reservada y el paciente puede reintentar; nunca queda un estado ambiguo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a un paciente acceder a una página personal que
  muestra únicamente sus propias citas, sin crear cuenta ni contraseña.
- **FR-002**: El sistema MUST dar acceso mediante un enlace personal con un token secreto
  asociado al paciente (no adivinable), que la clínica facilita al paciente por su canal
  habitual.
- **FR-003**: El sistema MUST denegar el acceso cuando el token sea inexistente, esté
  manipulado o haya caducado, con un mensaje neutro que no revele datos de ningún paciente
  ni confirme si un token concreto existió.
- **FR-004**: El sistema MAY reforzar el acceso pidiendo al paciente los 4 últimos dígitos de
  su teléfono al abrir un enlace válido; cuando este refuerzo esté activo, un valor
  incorrecto MUST impedir el acceso. (Configurable; ver Assumptions.)
- **FR-005**: El portal MUST mostrar las citas del paciente separadas en "Próximas citas"
  (futuras) e "Historial" (pasadas), determinando futura/pasada por la hora de inicio en la
  zona peninsular española.
- **FR-006**: El portal MUST mostrar, para cada cita, la fecha y hora de inicio, el
  profesional, el servicio y el estado, en formato inequívoco para España y sin jerga
  técnica.
- **FR-007**: El portal MUST ordenar las próximas citas de la más próxima a la más lejana, y
  el historial de la más reciente a la más antigua.
- **FR-008**: El portal MUST mostrar estados vacíos claros cuando el paciente no tenga
  próximas citas o no tenga historial.
- **FR-009**: El sistema MUST permitir al paciente cancelar una cita futura en estado
  "reservada" desde su portal, sin intervención de recepción.
- **FR-010**: Al cancelar, el sistema MUST llevar la cita al estado "cancelada" definido en
  la 001, de modo que el hueco quede inmediatamente libre en la agenda de recepción (la 001
  establece que "cancelada" libera el hueco). El sistema MUST NOT reasignar ni ofrecer
  automáticamente ese hueco a otros pacientes en la v1.
- **FR-011**: El sistema MUST permitir la cancelación por el paciente solo cuando falten 24
  horas o más para la hora de inicio de la cita; MUST impedirla cuando falte menos de 24
  horas o la cita ya haya empezado o pasado, informando de que para cancelar con menos
  antelación debe llamar a la clínica.
- **FR-012**: El sistema MUST NOT ofrecer la opción de cancelar sobre citas que no estén en
  estado "reservada" (es decir, completadas, ya canceladas o no asistidas) ni sobre citas
  pasadas.
- **FR-013**: El sistema MUST exigir una confirmación explícita del paciente antes de aplicar
  la cancelación; sin confirmación, la cita permanece reservada.
- **FR-014**: El sistema MUST tratar la cancelación de forma idempotente: cancelar una cita
  ya cancelada no produce cambios adicionales ni errores visibles confusos.
- **FR-015**: El sistema MUST resolver de forma coherente la concurrencia entre la
  cancelación del paciente y un cambio de estado de recepción sobre la misma cita, sin dejar
  la cita en un estado imposible ni permitir dos transiciones contradictorias (coherente con
  el control de estado de la 001).
- **FR-016**: El portal MUST NOT permitir reservar citas nuevas ni cambiar la hora o el
  profesional de una cita (mover/reprogramar); esas acciones quedan fuera de alcance en la
  v1.
- **FR-017**: El portal MUST NOT gestionar pagos ni mostrar cobros como acción del paciente
  en la v1.
- **FR-018**: El portal MUST presentar una interfaz limpia, moderna y responsive, usable sin
  formación y priorizando la experiencia en móvil, con contraste y tamaños accesibles
  (constitución p.7).
- **FR-019**: Todo el portal (textos, mensajes, estados y ejemplos) MUST estar en español de
  España (constitución p.8).
- **FR-020**: El sistema MUST poder demostrarse con los datos deterministas de la semilla:
  los pacientes de la semilla (clínica "Clínica Eleva") tienen citas futuras "reservada" y un
  historial pasado que el portal muestra tal cual (constitución p.5).

### Key Entities *(include if feature involves data)*

- **Paciente**: ficha existente de la 001 (nombre, teléfono único por clínica, email). En
  esta feature es quien accede al portal y ve/cancela sus citas. No se crean cuentas nuevas.
- **Cita**: entidad existente de la 001 (profesional + servicio + paciente en [inicio, fin),
  con estado reservada/completada/cancelada/no_asistida). El portal la lee y, para citas
  futuras "reservada", puede transitarla a "cancelada".
- **Acceso personal (token de portal)**: credencial no adivinable que vincula un enlace con
  un paciente concreto, con posible caducidad. Es el mecanismo de acceso sin cuenta ni
  contraseña. Atributos conceptuales: a qué paciente pertenece, si sigue vigente, cuándo
  caduca. (Su forma concreta se decide en el plan.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un paciente ve todas sus citas (futuras y pasadas) y ninguna de otro paciente
  en el 100 % de los accesos válidos.
- **SC-002**: Un paciente puede cancelar una cita futura cancelable en 3 interacciones o
  menos desde su portal (abrir la cita, pulsar cancelar, confirmar), sin ayuda ni manual.
- **SC-003**: En el 100 % de los casos, al cancelar una cita reservada el hueco queda libre
  en la agenda de recepción de forma inmediata.
- **SC-004**: En el 100 % de los intentos, no se permite cancelar desde el portal una cita a
  la que falten menos de 24 horas, ya empezada o en un estado distinto de "reservada".
- **SC-005**: En el 100 % de los intentos, un enlace inválido, manipulado o caducado no da
  acceso a ninguna cita ni dato personal.
- **SC-006**: Ninguna combinación de acciones simultáneas (paciente + recepción) deja una
  cita en un estado imposible ni produce dos cancelaciones efectivas.
- **SC-007**: El portal es usable y legible en móvil y en escritorio, con contraste y tamaños
  accesibles, verificado en un recorrido de extremo a extremo.
- **SC-008**: Todas las fechas, horas e importes que se muestren cuadran y se presentan en
  formato inequívoco para España (0 ambigüedades detectadas en la revisión).

## Assumptions

- **Reutiliza la 001**: pacientes, citas y estados provienen del núcleo de agenda (001). El
  portal no crea entidades de negocio nuevas salvo el mecanismo de acceso personal.
- **Acceso sin cuentas (decisión de negocio, confirmable por Sara)**: se asume acceso por
  enlace personal con token secreto, sin registro ni contraseña, porque las clínicas pequeñas
  no gestionarán altas de usuarios. El refuerzo de "4 últimos dígitos del teléfono" es
  opcional y está activado por defecto como equilibrio entre comodidad y protección.
- **Ventana de cancelación (decisión de negocio, confirmable por Sara)**: 24 horas antes del
  inicio. Por debajo de ese umbral, la cancelación se deriva a la llamada telefónica, para
  que la clínica pueda gestionar el hueco de última hora.
- **Hueco liberado (decisión de negocio, confirmable por Sara)**: al cancelar, el hueco queda
  simplemente libre en la agenda (estado "cancelada" de la 001). No hay lista de espera ni
  reasignación automática en la v1.
- **Zona horaria**: todas las citas se interpretan en la zona peninsular española, coherente
  con la 001.
- **Canal de entrega del enlace fuera de alcance**: cómo se hace llegar el enlace al paciente
  (SMS, email, en persona) no lo decide esta feature; el envío automático de recordatorios se
  aborda en la spec de recordatorios (002).
- **Datos de demostración**: se usan los de la semilla determinista (clínica "Clínica Eleva";
  profesionales María Ferrer, Jorge Nieto y Lucía Prados; servicios de 40,00 €, 50,00 €,
  35,00 € y 45,00 €; pacientes con email `paciente{n}@ejemplo.es`), que ya incluye 2 semanas
  de citas futuras "reservada" y 8 semanas de historial pasado.

## Fuera de alcance (v1)

Se abordarán, si procede, en specs propias:

- Reservar citas nuevas online por el paciente.
- Mover o reprogramar citas (cambiar hora o profesional) desde el portal.
- Pagos o cobros online.
- Registro de pacientes con usuario y contraseña, roles o recuperación de credenciales.
- Lista de espera o reasignación automática del hueco liberado.
- Envío automático del enlace o de recordatorios (competencia de la spec 002 de
  recordatorios).
- Notificaciones al profesional o a recepción al cancelar (más allá de que el hueco quede
  libre en la agenda).
