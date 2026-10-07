# Feature Specification: Portal del Paciente

**Feature Branch**: `003-portal-paciente`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Portal del paciente. Los pacientes de la clínica quieren ver sus citas y cancelarlas sin llamar por teléfono (Sonia, recepción de Eleva, dedica 'la mitad de la mañana' a esto). Alcance: un paciente accede a una página personal moderna donde ve sus citas futuras y pasadas y puede cancelar una cita futura. Interfaz limpia y responsive, pensada para móvil. Preguntas que la spec debe dejar decididas (cerradas, para Sara): cómo accede el paciente sin crear cuentas ni contraseñas, hasta cuándo puede cancelar, y qué pasa con el hueco liberado. Datos: casos reales de la semilla en los ejemplos. Fuera de alcance v1: reservar o mover citas online, pagos."

## Contexto y propiedad *(consumidor de 005 y 001)*

Tras la revisión cruzada (`specs/000-revision-cruzada-jul2026.md`), la propiedad de dos
conceptos que antes definía 003 se traslada a la spec **005 (Acceso y cancelación del
paciente)**. **003 es ahora consumidor**, no propietario:

- **Acceso e identidad del paciente** (enlace personal `/p/[token]`, token opaco, regeneración):
  propiedad de **005** (FR-001..FR-006). 003 los consume para identificar al paciente y mostrar
  sus citas (resuelve S3).
- **Política de cancelación del paciente** (umbral único de **24 h** y acción dentro de la
  ventana): propiedad de **005** (FR-007/FR-008/FR-012). 003 la remite y conserva el
  comportamiento observable, sin fijar el umbral (resuelve S1).
- **Ciclo de vida de la cita** (transición `reservada → cancelada`, liberación del hueco) y
  **concurrencia** (una sola cancelación efectiva, atómica e idempotente): propiedad del núcleo
  **001**. 003 solo decide si puede dispararse la cancelación (acceso de 005 + ventana de 005) e
  **invoca** la operación de 001 (resuelve S2 y S7).

003 mantiene la propiedad de la **experiencia del portal**: ver citas futuras/pasadas, estados
vacíos, orden, presentación accesible en móvil y escritorio, y el flujo de confirmación de la
cancelación antes de invocar 001. No modifica el comportamiento de 001, 002 ni 005: los
referencia.

## Clarifications

### Session 2026-09-22 (resolución de revisión cruzada — alineación con 005)

Tras la revisión cruzada (`specs/000-revision-cruzada-jul2026.md`) y la creación de la spec
**005 (Acceso y cancelación del paciente)**, cambia la propiedad de dos conceptos que antes
vivían en 003. **003 pasa a ser consumidor**, no propietario:

- Q: ¿Quién es la fuente de verdad del **acceso del paciente** (enlace/token)? → A: La **005**.
  003 consume el enlace personal estable `/p/[token]` definido en 005 (FR-001..FR-006); ya no
  define su propio token ni su ciclo de vida. Se elimina de 003 el enlace persistente propio y
  el segundo factor propio (ver decisión siguiente).
- Q: ¿Qué pasa con el **segundo factor** (4 últimos dígitos del teléfono) que 003 tenía? → A:
  **Se elimina de 003** (opción a). 005 define que el acceso se basa en la posesión del token
  opaco y deja cualquier segundo factor como posible **ampliación de la política de 005**, no
  como una identidad paralela. 003 no mantiene una postura de seguridad propia; si el refuerzo
  se desea, lo propondrá y decidirá la propietaria de 005.
- Q: ¿Quién es la fuente de verdad de la **política de cancelación** (umbral)? → A: La **005**
  (FR-007/FR-008: **24 horas**). 003 remite a esa política; conserva el comportamiento
  observable (fuera de ventana → no ofrecer cancelar y mostrar el teléfono de la clínica) pero
  atribuido a 005, no como umbral propio.
- Q: ¿Quién realiza la **transición de estado y la liberación del hueco** al cancelar, y la
  **concurrencia**? → A: El **núcleo 001**. 003 solo decide si puede dispararse la cancelación
  (acceso de 005 + ventana de 005) e invoca la operación de cancelación atómica e idempotente
  de 001; no implementa control de concurrencia propio (resuelve S2 y S7).

### Session 2026-09-19 (histórica — algunas decisiones reasignadas a 005)

> Nota: las decisiones de esta sesión sobre **acceso del paciente** y **umbral de
> cancelación** quedaron **reasignadas a la spec 005** en la sesión 2026-09-22. Se conservan
> aquí como registro histórico; las reglas vigentes son las de 005 (ver arriba).

- Q: ¿Cómo accede el paciente sin crear cuentas ni contraseñas? → A (histórica; ahora en 005):
  enlace personal con token secreto por paciente. **Vigente**: 005 define `/p/[token]` como
  único acceso; 003 lo consume.
- Q: ¿Hasta cuándo puede cancelar una cita futura? → A (histórica; ahora en 005): hasta 24 h
  antes del inicio. **Vigente**: la política de cancelación (24 h) es propiedad de 005; 003 la
  remite.
- Q: ¿Qué pasa con el hueco liberado al cancelar? → A: El hueco queda libre en la agenda de
  recepción de forma inmediata (la cita pasa a "cancelada", que libera el tramo, transición
  propiedad de la **001**); no se reasigna ni se ofrece automáticamente a otros pacientes en
  la v1.
- Q: ¿El enlace personal da acceso a todas las citas del paciente o solo a una cita? → A
  (histórica; ahora en 005 FR-001): un enlace por paciente que da acceso a todas sus citas.
- Q: ¿Cuándo caduca el enlace personal del paciente? → A (histórica; ahora en 005): el enlace
  es estable; 005 define que recepción puede **regenerarlo** si se compromete (FR-004).
- Q: ¿El refuerzo de los 4 últimos dígitos del teléfono es obligatorio? → A (reasignada): **se
  elimina de 003**; queda como posible ampliación de la política de acceso de 005.

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
futura cancelable **según la política de 005** (a 24 h o más del inicio), cancelarla y
comprobar que pasa a "cancelada" (transición de 001), que ya no se ofrece cancelarla de nuevo
y que el hueco queda libre en la agenda del profesional.

**Acceptance Scenarios**:

1. **Given** un paciente con una cita reservada cancelable según la política de 005 (24 h o
   más para el inicio), **When** pulsa "Cancelar cita" y confirma, **Then** la cita pasa a
   estado "cancelada" (transición realizada por 001), se muestra una confirmación clara y el
   hueco queda libre en la agenda de recepción.
2. **Given** una cita reservada dentro de la ventana de bloqueo de 005 (menos de 24 h para el
   inicio), **When** el paciente ve esa cita, **Then** la opción de cancelar no está disponible
   y se muestra el teléfono de la clínica para gestionarlo por llamada (comportamiento definido
   por 005 FR-008).
3. **Given** una cita ya pasada, completada, cancelada o marcada como no asistida,
   **When** el paciente la ve en su historial, **Then** no se ofrece la opción de cancelar.
4. **Given** una cita ya cancelada por el paciente, **When** intenta cancelarla de nuevo
   (por ejemplo, con doble toque o recargando), **Then** el sistema no realiza ningún cambio
   adicional y sigue mostrándola como cancelada.
5. **Given** el paciente pulsa "Cancelar cita", **When** aún no confirma, **Then** la cita
   permanece reservada; la cancelación solo se aplica tras una confirmación explícita.

---

### User Story 3 - Acceso personal sin cuentas ni contraseñas (consume 005) (Priority: P1)

El paciente entra a su portal mediante el enlace personal estable `/p/[token]` **definido por
la spec 005**, sin registrarse ni recordar contraseñas. 003 no define este acceso: lo
**consume**. El enlace identifica al paciente y da acceso a todas sus citas; su ciclo de vida
(token opaco, regeneración por recepción si se compromete) es propiedad de 005.

**Why this priority**: Sin una forma de acceso, no hay portal. 003 depende del acceso de 005
para identificar al paciente; por eso es P1, pero como **consumidor**: cualquier regla de
token, revocación o refuerzo la decide 005.

**Independent Test**: Abrir el enlace `/p/[token]` de 005 para un paciente con citas y
comprobar que el portal muestra sus citas y ninguna de otro paciente; abrir un enlace con
token inexistente, manipulado o regenerado y comprobar que 005 deniega el acceso, con lo que
el portal no muestra dato alguno.

**Acceptance Scenarios**:

1. **Given** un enlace `/p/[token]` válido de 005, **When** el paciente lo abre, **Then** el
   portal muestra sus citas sin pantalla de registro ni contraseña (identidad resuelta por 005).
2. **Given** un token inexistente o manipulado, **When** se intenta abrir el enlace, **Then**
   005 deniega el acceso con un mensaje neutro y el portal no muestra ninguna cita ni dato
   personal.
3. **Given** un token que recepción ha **regenerado** en 005, **When** se usa el enlace
   antiguo, **Then** el acceso se deniega; **When** se usa el enlace nuevo, **Then** el portal
   muestra las mismas citas del paciente (comportamiento definido por 005 FR-004).

---

### Edge Cases

- **Cita justo en el límite de la ventana**: el trato del límite exacto (24 h) lo define la
  política de cancelación de **005** (umbral "24 h o más"); 003 se comporta según esa política
  y no fija un límite propio.
- **Cancelación concurrente (paciente↔recepción y email↔portal)**: si la misma cita se cancela
  o cambia de estado por varias vías casi a la vez (portal de 003, email de 002, recepción de
  001), el resultado final es una **única cancelación efectiva** y ningún estado imposible. Esta
  garantía la aporta la **transición atómica e idempotente de la 001**; 003 no implementa
  control de concurrencia propio (resuelve S7).
- **Enlace compartido/manipulado**: el control de qué token da acceso y qué se muestra ante un
  token inexistente, manipulado o regenerado es propiedad de **005**; 003 solo muestra las citas
  cuando 005 concede el acceso.
- **Paciente sin citas**: el portal se abre correctamente y muestra estados vacíos claros,
  sin errores.
- **Cita en el pasado que sigue "reservada"** (paciente que no acudió y aún no se marcó):
  aparece en el historial y no ofrece cancelar (fuera de la ventana de 005).
- **Zona horaria**: el cálculo de "futura/pasada" (propio del portal) y el de la ventana de
  cancelación (política de 005) se hacen en la zona peninsular española, coherente con el resto
  del producto.
- **Uso en móvil con conexión intermitente**: si la cancelación no llega a confirmarse, la
  cita permanece reservada y el paciente puede reintentar; la idempotencia de 001 evita estados
  ambiguos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El portal MUST mostrar a un paciente únicamente sus propias citas, identificando
  al paciente a través del acceso definido por la spec **005** (enlace personal `/p/[token]`);
  003 no define un mecanismo de acceso propio.
- **FR-002**: El portal MUST consumir el enlace personal estable `/p/[token]` **propiedad de la
  005** (005 FR-001..FR-006) para identificar al paciente y listar sus citas. El token, su
  opacidad, su regeneración por recepción y la denegación ante tokens inválidos son propiedad de
  005; 003 no los redefine ni mantiene un token paralelo.
- **FR-003**: El portal MUST delegar en 005 la concesión o denegación del acceso: cuando 005
  deniega el acceso (token inexistente, manipulado o regenerado), el portal MUST NOT mostrar
  ninguna cita ni dato personal y MUST presentar el mensaje neutro que corresponda, sin añadir
  una política de acceso propia.
- **FR-004**: 003 MUST NOT introducir un segundo factor de autenticación propio (p. ej. los 4
  últimos dígitos del teléfono): el acceso se basa en la posesión del token opaco según 005
  FR-006. Si en el futuro se desea reforzar el acceso, se especificará como **ampliación de la
  política de 005** (coordinada con su propietaria), nunca como una identidad o postura de
  seguridad paralela en 003.
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
- **FR-009**: El portal MUST permitir al paciente disparar la cancelación de una cita futura
  desde su portal, sin intervención de recepción, **cuando la política de cancelación de 005 lo
  permita** (ver FR-011). 003 solo decide si ofrece la acción; la autorización temporal es de
  005.
- **FR-010**: Al cancelar, el portal MUST **invocar la operación de cancelación de la 001**
  (transición `reservada → cancelada`), que es la que lleva la cita a "cancelada" y libera el
  hueco de forma inmediata en la agenda de recepción. 003 NO reimplementa la transición ni la
  liberación del hueco (propiedad de 001) y MUST NOT reasignar ni ofrecer automáticamente ese
  hueco a otros pacientes en la v1.
- **FR-011**: El portal MUST aplicar la **política de cancelación del paciente definida por la
  005** (005 FR-007/FR-008: umbral único de 24 horas): ofrece cancelar solo cuando 005 lo
  permite (24 h o más para el inicio) y, dentro de la ventana (menos de 24 h, o cita ya empezada
  o pasada), MUST **no ofrecer** la acción de cancelar y MUST mostrar el **teléfono de la
  clínica**. 003 NO define ni fija este umbral; lo remite a 005.
- **FR-012**: El portal MUST NOT ofrecer la opción de cancelar sobre citas que no estén en
  estado "reservada" (completadas, ya canceladas o no asistidas) ni sobre citas pasadas,
  coherente con la política de 005 (005 FR-009).
- **FR-013**: El portal MUST exigir una confirmación explícita del paciente antes de invocar la
  cancelación; sin confirmación, la cita permanece reservada.
- **FR-014**: El portal MUST comportarse de forma idempotente ante reintentos apoyándose en la
  **garantía de idempotencia de la 001**: si la cita ya no está "reservada" (p. ej. ya cancelada),
  la operación de 001 no produce cambios adicionales y el portal MUST mostrar un mensaje claro de
  que ya no procede, sin errores confusos.
- **FR-015**: El portal MUST delegar la resolución de la concurrencia en la **transición atómica
  e idempotente de la 001**: ante varias solicitudes concurrentes sobre la misma cita —del propio
  portal (003), del email de recordatorios (002) o de recepción (001)— queda **una sola
  cancelación efectiva** y ningún estado imposible. 003 NO implementa un control de concurrencia
  propio; se limita a invocar 001 y a mostrar el mensaje adecuado si la cita ya no estaba
  "reservada" (resuelve S2 y S7).
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
  con estado reservada/completada/cancelada/no_asistida). El portal la **lee** y, para citas
  "reservada" cancelables según 005, **invoca** la transición `reservada → cancelada` de 001;
  003 no define su ciclo de vida ni el efecto sobre el hueco.
- **Enlace de acceso del paciente `/p/[token]`** (propiedad de **005**, referido aquí): token
  opaco estable 1:1 con el paciente, regenerable por recepción. 003 lo **consume** para
  identificar al paciente; no lo define ni lo almacena como concepto propio.
- **Política de cancelación del paciente** (propiedad de **005**, referida aquí): umbral único
  de 24 h antes del inicio y acción alternativa (mostrar teléfono de la clínica) dentro de la
  ventana. 003 la **consume**; no fija el umbral.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un paciente ve todas sus citas (futuras y pasadas) y ninguna de otro paciente
  en el 100 % de los accesos válidos.
- **SC-002**: Un paciente puede cancelar una cita futura cancelable en 3 interacciones o
  menos desde su portal (abrir la cita, pulsar cancelar, confirmar), sin ayuda ni manual.
- **SC-003**: En el 100 % de los casos, al cancelar una cita reservada el hueco queda libre
  en la agenda de recepción de forma inmediata.
- **SC-004**: En el 100 % de los intentos, el portal no ofrece cancelar (y muestra el teléfono
  de la clínica) cuando la política de cancelación de 005 lo bloquea —menos de 24 h, cita ya
  empezada o estado distinto de "reservada"—, coherente con 005.
- **SC-005**: En el 100 % de los intentos, cuando 005 deniega el acceso (token inválido,
  manipulado o regenerado) el portal no muestra ninguna cita ni dato personal.
- **SC-006**: Ante cancelaciones/cambios de estado concurrentes sobre la misma cita (portal,
  email o recepción), en el 100 % de los casos queda exactamente una cancelación efectiva y
  ningún estado imposible, gracias a la transición atómica e idempotente de la 001.
- **SC-007**: El portal es usable y legible en móvil y en escritorio, con contraste y tamaños
  accesibles, verificado en un recorrido de extremo a extremo.
- **SC-008**: Todas las fechas, horas e importes que se muestren cuadran y se presentan en
  formato inequívoco para España (0 ambigüedades detectadas en la revisión).

## Assumptions

- **Reutiliza la 001**: pacientes, citas y estados provienen del núcleo de agenda (001). El
  portal no crea entidades de negocio nuevas; consume acceso y política de 005 y el ciclo de
  vida de 001.
- **Acceso propiedad de 005**: el acceso del paciente (enlace `/p/[token]`, token opaco,
  regeneración por recepción, denegación ante tokens inválidos) lo define y posee la **005**
  (FR-001..FR-006). 003 lo consume; no mantiene token ni segundo factor propios.
- **Segundo factor**: 003 no añade un segundo factor propio. Cualquier refuerzo sería una
  ampliación de la política de acceso de 005, decidida por su propietaria (no una postura de
  seguridad paralela en 003).
- **Ventana de cancelación propiedad de 005**: el umbral único de **24 horas** y la acción
  dentro de la ventana (mostrar el teléfono de la clínica) los define la **005** (FR-007/FR-008).
  003 los remite; conserva el comportamiento observable atribuido a 005.
- **Transición y liberación del hueco propiedad de 001**: al cancelar, la transición
  `reservada → cancelada` y la liberación del hueco las realiza la **001**; 003 solo la invoca.
  No hay lista de espera ni reasignación automática en la v1.
- **Concurrencia propiedad de 001**: la atomicidad e idempotencia ante cancelaciones
  concurrentes (portal 003, email 002, recepción 001) las garantiza la **001**; 003 no
  implementa control de concurrencia propio.
- **Coherencia de textos (005 FR-012)**: cualquier texto del portal sobre la política de
  cancelación se deriva de 005 (24 h) y no afirma un plazo distinto.
- **Zona horaria**: todas las citas se interpretan en la zona peninsular española, coherente
  con la 001.
- **Canal de entrega del enlace fuera de alcance**: cómo se hace llegar el enlace `/p/[token]`
  al paciente (SMS, email, en persona) no lo decide esta feature; el envío automático de
  recordatorios se aborda en la spec de recordatorios (002), que también consume el acceso de 005.
- **Datos de demostración**: se usan los de la semilla determinista (clínica "Clínica Eleva";
  profesionales María Ferrer, Jorge Nieto y Lucía Prados; servicios de 40,00 €, 50,00 €,
  35,00 € y 45,00 €; pacientes con email `paciente{n}@ejemplo.es`), que ya incluye 2 semanas
  de citas futuras "reservada" y 8 semanas de historial pasado.

## Fuera de alcance (v1)

Se abordarán, si procede, en specs propias:

- Reservar citas nuevas online por el paciente.
- Mover o reprogramar citas (cambiar hora o profesional) desde el portal.
- Pagos o cobros online.
- Definición del acceso del paciente (token/enlace, regeneración, segundo factor): propiedad de
  **005**; 003 lo consume.
- Definición del umbral de cancelación y de la lista de espera: propiedad de **005** (la lista
  de espera y el umbral de 2 h quedan como posible v2 en 005).
- La transición de estado y la liberación del hueco: propiedad de **001**; 003 solo la invoca.
- Envío automático del enlace o de recordatorios (competencia de la spec 002 de
  recordatorios, que también consume el acceso de 005).
- Notificaciones al profesional o a recepción al cancelar (más allá de que el hueco quede
  libre en la agenda, efecto de la 001).
