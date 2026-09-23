# Revisión cruzada de specs — CitaClara (jul 2026)

**Fecha**: 2026-09-22
**Autor**: Revisión de solapamiento entre specs (análisis en tronco `main`, sin checkout).
**Método**: Lectura de la PUNTA de cada rama con `git show REF:RUTA`, sin sacar ramas ni
entrar en worktrees.

## Fuentes leídas (punta de cada rama)

| Spec | Rama | Commit (punta) | Ruta leída |
|------|------|----------------|------------|
| 001 Núcleo de Agenda | `main` | `b152465` | `4_multi_agent/citaclara/specs/001-agenda-core/spec.md` |
| 002 Recordatorios de Cita | `002-recordatorios-cita` | `1826bfc` | `4_multi_agent/citaclara/specs/002-recordatorios-cita/spec.md` |
| 003 Portal del Paciente | `003-portal-paciente` | `579cb7d` | `4_multi_agent/citaclara/specs/003-portal-paciente/spec.md` |
| 004 Panel de Analítica | `004-panel-analitica` | `0f060ed` | `4_multi_agent/citaclara/specs/004-panel-analitica/spec.md` |

Las cuatro specs están commiteadas en la punta de su rama. No falta ninguna.

## Resumen ejecutivo

Se han detectado **7 solapamientos** donde dos o más specs tocan el mismo dominio. El más
grave (S1) es una **contradicción dura**: 002 y 003 fijan ventanas de cancelación del
paciente **distintas** (2 h vs 24 h) para exactamente la misma acción. El resto son
mayormente riesgos de **propiedad difusa** de conceptos (estados de cita, acceso del
paciente, definición de métricas) que conviene asignar a UN propietario antes de que dos
equipos codifiquen dos verdades.

| # | Título | Specs | Severidad | Tipo de choque |
|---|--------|-------|-----------|----------------|
| S1 | Ventana de cancelación del paciente (2 h vs 24 h) | 002, 003 | **Alta** | Contradicción de regla |
| S2 | Propiedad del ciclo de vida / transición `reservada→cancelada` | 001, 002, 003 | Media | Escritura sobre mismos estados |
| S3 | Identidad y acceso del paciente sin cuenta (dos tokens distintos) | 002, 003 | Media-Alta | Concepto duplicado / seguridad |
| S4 | Definición de "no asistencia" vs estado `no_asistida` del núcleo | 001, 002, 004 | Media | Definición de métrica vs estado |
| S5 | "Ocupación" y `ESTADOS_ACTIVOS` (qué estado ocupa hueco) | 001, 004 | Baja-Media | Definición derivada del núcleo |
| S6 | "Mover cita = cancelar + crear" (semántica compartida) | 001, 002 | Baja | Regla del núcleo reutilizada |
| S7 | Escritura concurrente sobre la misma cita desde features distintas | 002, 003, (001 recepción) | Media | Escritura sobre la misma fila/estado |

---

## S1 — Ventana de cancelación del paciente: 2 horas (002) vs 24 horas (003)

**Specs implicadas**: 002 (Recordatorios), 003 (Portal del Paciente).

**Cita textual — 002** (rama `002-recordatorios-cita`):
> **FR-008**: El sistema MUST permitir que el paciente cancele su cita desde el medio incluido
> en el recordatorio, pasando la cita a "cancelada" y liberando el hueco, siempre que la
> solicitud se haga con al menos **2 horas de antelación** respecto al inicio de la cita.

> **FR-009**: El sistema MUST rechazar [...] cualquier cancelación desde el email solicitada
> con **menos de 2 horas** de antelación respecto al inicio de la cita (fuera de plazo).

**Cita textual — 003** (rama `003-portal-paciente`):
> **FR-011**: El sistema MUST permitir la cancelación por el paciente solo cuando falten **24
> horas o más** para la hora de inicio de la cita; MUST impedirla cuando falte menos de 24
> horas o la cita ya haya empezado o pasado, informando de que para cancelar con menos
> antelación debe llamar a la clínica.

**Por qué chocarán**:
- **En producción**: es el **mismo actor** (el paciente) cancelando **la misma cita**
  (`reservada→cancelada` de la 001) por dos puertas distintas. Una cita a la que le faltan
  10 horas es **cancelable desde el email (002)** pero **NO cancelable desde el portal (003)**.
  El paciente que ve "no puedes cancelar, llama a la clínica" en el portal y acto seguido
  cancela con un clic desde el email vivirá una incoherencia flagrante, y recepción no sabrá
  qué política es la "de verdad".
- **En código**: si ambos flujos comparten un mismo servicio de cancelación
  (lo natural, porque ambos hacen la misma transición), ese servicio no puede tener a la vez
  un umbral de 2 h y de 24 h. Si NO lo comparten, habrá **dos reglas de negocio duplicadas**
  que divergirán con el tiempo.
- **En spec**: ninguna de las dos referencia a la otra; cada una fija su umbral como si fuera
  el único. No hay un propietario declarado de "política de cancelación del paciente".

**Propuesta de resolución (propietario único)**:
Crear un único concepto **"Política de cancelación por el paciente"** con **un solo
propietario**. Recomendación: que **003 (Portal)** sea el propietario de la política de
autoservicio del paciente, por ser la feature centrada en la experiencia del paciente y su
ciclo de vida de cancelación. 002 (Recordatorios) **NO debe redefinir el umbral**: el enlace
del email debe **delegar** en la misma política/endpoint de cancelación que el portal, de modo
que exista **un único umbral** (elegir 2 h o 24 h como decisión de negocio de Sara, pero uno
solo). Acción concreta:
- Unificar el umbral en un valor único (decisión de negocio pendiente para Sara).
- 002 sustituye "2 horas" por "según la política de cancelación del paciente (003)".
- El enlace de cancelación del email (002) y el botón de cancelar del portal (003) invocan
  **el mismo** camino de cancelación, no dos implementaciones paralelas.

> Nota: si el negocio realmente quiere dos umbrales distintos por canal (poco recomendable),
> debe declararse explícitamente en AMBAS specs, justificando por qué el email es más
> permisivo que el portal; hoy la divergencia parece accidental, no intencionada.

---

## S2 — Propiedad del ciclo de vida de la cita y de la transición `reservada→cancelada`

**Specs implicadas**: 001 (núcleo, propietario), 002, 003 (ambas escriben la transición).

**Cita textual — 001** (rama `main`):
> **FR-008**: El sistema MUST permitir las transiciones de estado reservada → completada,
> reservada → cancelada y reservada → no_asistida, y MUST rechazar cualquier otra transición.

> Assumptions: Los estados "cancelada" y "no_asistida" son finales en la 001 y liberan el
> hueco para nuevas reservas; "completada" es final y mantiene el hueco ocupado [...].

**Cita textual — 002** (rama `002-recordatorios-cita`):
> **Key Entities → Cita**: [...] La cancelación desde el email transiciona la cita
> "reservada" → "cancelada" (transición ya prevista en la 001).

**Cita textual — 003** (rama `003-portal-paciente`):
> **FR-010**: Al cancelar, el sistema MUST llevar la cita al estado "cancelada" definido en la
> 001, de modo que el hueco quede inmediatamente libre en la agenda de recepción (la 001
> establece que "cancelada" libera el hueco).

**Por qué chocarán**:
- **En código**: 002 y 003 (y la propia recepción de la 001) escriben la MISMA transición
  sobre la MISMA entidad. Si cada feature implementa su propia lógica de cancelación
  (validaciones, liberación de hueco, idempotencia), habrá tres implementaciones de la misma
  regla, con riesgo de que una olvide, por ejemplo, revalidar que la cita siga "reservada".
- **En spec**: las tres coinciden en el resultado (bien), pero ninguna declara **quién es el
  dueño del servicio de transición de estado**. El riesgo no es de contradicción hoy, sino de
  divergencia futura y de duplicar reglas.

**Propuesta de resolución (propietario único)**:
Declarar explícitamente que **001 es el ÚNICO propietario del ciclo de vida de la cita** y de
la operación de transición de estado (incluida `reservada→cancelada` y su efecto de liberar
hueco). 002 y 003 son **consumidores**: invocan la operación de cancelación de la 001 y solo
aportan **su propia capa de autorización/pre-condición** (002: token de email + umbral;
003: token de portal + 4 dígitos + umbral), pero **no reimplementan** la transición ni el
efecto sobre el hueco. Añadir a 002 y 003 una frase del tipo: "la transición y la liberación
del hueco las realiza el servicio de citas de la 001; esta feature solo decide *si* se permite
disparar la cancelación".

---

## S3 — Identidad y acceso del paciente sin cuenta: dos tokens distintos (002 vs 003)

**Specs implicadas**: 002 (token de cancelación por cita), 003 (magic link por paciente + 4 dígitos).

**Cita textual — 002** (rama `002-recordatorios-cita`):
> **FR-010**: El enlace de cancelación MUST usar un **token opaco, único e imposible de
> adivinar por cita** [...]; el sistema MUST aceptar la cancelación únicamente cuando el token
> corresponda a la cita [...].

> **Key Entities → Recordatorio**: [...] y **token de cancelación** (opaco, único e imposible
> de adivinar) usado en el enlace del email.

**Cita textual — 003** (rama `003-portal-paciente`):
> **FR-002**: El sistema MUST dar acceso mediante un **enlace personal con un token secreto
> asociado al paciente** (no adivinable) [...]. **Un único enlace por paciente** da acceso a
> todas sus citas [...]; no se emite un enlace por cita.

> **FR-004**: El sistema MUST reforzar el acceso pidiendo al paciente **los 4 últimos dígitos
> de su teléfono** [...].

**Por qué chocarán**:
- **Concepto duplicado (dos identidades del paciente sin sesión)**: 002 introduce un
  **token por cita** que autoriza a cancelar UNA cita; 003 introduce un **token por paciente**
  (magic link persistente) + segundo factor (4 dígitos) que autoriza a ver/cancelar TODAS.
  Son dos mecanismos de acceso del paciente sin cuenta que coexisten y **cubren parcialmente
  el mismo terreno** (cancelar una cita futura sin sesión).
- **En producción / seguridad**: dos superficies de acceso distintas con posturas de seguridad
  distintas. El token por cita de 002 **no exige** los 4 dígitos del teléfono; el de 003 **sí**.
  Un mismo paciente podría cancelar una cita desde el email sin segundo factor (002) pero
  necesitar el segundo factor para hacer lo mismo desde el portal (003). Incoherencia de
  postura de seguridad para la misma acción.
- **En código**: dos emisores/validadores de tokens, dos tablas o dos formatos, dos flujos de
  revocación (003 contempla revocación por recepción; 002 no habla de revocar el token de cita).

**Propuesta de resolución (propietario único)**:
Asignar a **003 (Portal) la propiedad del concepto "acceso/identidad del paciente sin cuenta"**
(token de paciente + segundo factor + revocación). Reencaminar 002 para que **no cree una
segunda identidad**:
- Opción preferida: el enlace de cancelación del email (002) lleva al **portal del paciente
  (003)** a la vista de esa cita, reutilizando el token de paciente y su segundo factor; así
  hay **un único mecanismo de acceso** y una única postura de seguridad.
- Si por plazos 002 necesita un enlace autónomo antes de que 003 exista, debe declararse como
  **token de un solo uso y una sola cita**, con caducidad, y dejar constancia en AMBAS specs de
  que es una **medida puente** que 003 sustituirá, para no perpetuar dos identidades.
En cualquier caso, **decidir explícitamente** si la cancelación desde email exige o no segundo
factor, y alinearla con la política de 003 (hoy divergen).

---

## S4 — Definición de "no asistencia" (004) vs estado `no_asistida` del núcleo (001) y objetivo de 002

**Specs implicadas**: 001 (define el estado), 004 (define la métrica/tasa), 002 (mide reducción de no-shows).

**Cita textual — 001** (rama `main`):
> **FR-009**: El sistema MUST tratar "no_asistida" exclusivamente como que el paciente no se
> presentó a una cita que seguía reservada.

**Cita textual — 004** (rama `004-panel-analitica`):
> **FR-006**: El sistema MUST calcular, por profesional, la tasa de no asistencia como
> **no_asistida ÷ (completada + cancelada + no_asistida)** de sus citas pasadas con desenlace
> (Definición A [...]).

> **FR-006a**: El sistema MUST tratar como "pasadas con desenlace" únicamente las citas cuyo
> estado ya no es "reservada" [...].

**Cita textual — 002** (rama `002-recordatorios-cita`):
> **SC-008**: Reducción medible de la no asistencia [...], medida como el porcentaje de citas
> recordadas que terminan en "no_asistida" comparado con la línea base histórica de la semilla.

**Por qué chocarán**:
- **En spec / métricas**: hay **tres lecturas de "no asistencia"** que deben cuadrar:
  el estado del núcleo (001), la **tasa** con un denominador concreto (004, Definición A) y la
  **métrica de reducción** de 002 (numerador = citas recordadas que acaban en `no_asistida`;
  denominador = citas recordadas). 002 y 004 **NO usan el mismo denominador**: 004 divide entre
  todas las citas pasadas con desenlace; 002 divide entre "citas recordadas". Si ambas se
  presentan a la clínica como "tasa de no asistencia", darán **números distintos** y se
  interpretarán como error.
- **Riesgo latente en 004**: su Definición A **incluye `cancelada` en el denominador**. Como
  003 y 002 van a **aumentar el volumen de cancelaciones** (el paciente cancela en lugar de no
  presentarse — que es justo el objetivo), el denominador de 004 crecerá y la **tasa de no
  asistencia bajará** en parte por un cambio de comportamiento, no solo por menos no-shows.
  Es coherente con la definición elegida, pero conviene que 004 y 002 lo declaren para no
  atribuir a los recordatorios (002) una mejora que en parte es "conversión de no-show en
  cancelación".

**Propuesta de resolución (propietario único)**:
- **001 es propietario del ESTADO** `no_asistida` (su significado no lo redefine nadie más).
- **004 es propietario de la métrica "tasa de no asistencia"** (Definición A, denominador
  explícito). Cualquier otra spec que hable de "tasa de no asistencia" debe **remitir a 004**,
  no inventar su propia fórmula.
- **002 debe renombrar su métrica** de SC-008 para no llamarla "tasa de no asistencia" a secas:
  es una métrica de *eficacia del recordatorio* (p. ej. "% de citas recordadas que acaban en
  no_asistida"), con denominador distinto, y debe declararse como tal, remitiendo a 004 para la
  tasa oficial de la clínica. Documentar en 004 y 002 el efecto "cancelación sustituye a
  no-show" para lectura correcta de la tendencia.

---

## S5 — "Ocupación" y qué estados ocupan hueco (`ESTADOS_ACTIVOS`)

**Specs implicadas**: 001 (regla anti-solape / estados que bloquean hueco), 004 (ocupación).

**Cita textual — 001** (rama `main`):
> **FR-010 (RN1, capital)**: El sistema MUST impedir la creación de una cita que solape [...]
> con otra cita en estado "reservada" o "completada" del mismo profesional. Las citas en
> estado "cancelada" o "no_asistida" NO bloquean el hueco.

**Cita textual — 004** (rama `004-panel-analitica`):
> **FR-007 (ocupación)**: [...] (minutos de citas en estado "reservada" o "completada") ÷
> (minutos de la jornada [...]). [...] reservada y completada son los estados que ocupan hueco
> (**ESTADOS_ACTIVOS de la 001**) [...].

**Por qué chocarán**:
- **En código**: 004 depende de un concepto del núcleo (los estados que "ocupan hueco":
  reservada + completada) y lo nombra `ESTADOS_ACTIVOS de la 001`. Pero **001 no define ese
  nombre**: la 001 describe la regla anti-solape con esos dos estados, sin bautizar una
  constante `ESTADOS_ACTIVOS`. Si 001 nunca expone esa lista como un concepto con nombre, 004
  la re-derivará por su cuenta y podría **desincronizarse** si algún día 001 cambia qué estado
  ocupa hueco (p. ej. si "completada" dejara de contar para solape).
- Hoy los conjuntos **coinciden** (reservada+completada), así que no es contradicción, sino
  **acoplamiento a un concepto no publicado formalmente por el propietario**.

**Propuesta de resolución (propietario único)**:
**001 debe publicar formalmente el conjunto "estados que ocupan hueco"** como un concepto con
nombre (p. ej. `ESTADOS_ACTIVOS = {reservada, completada}`) en sus Key Entities/Requirements.
004 (y cualquier otra spec) lo **consume por referencia** en lugar de reenumerarlo. Así hay UN
propietario (001) de "qué ocupa hueco" y 004 no mantiene una copia que pueda divergir.

---

## S6 — "Mover cita = cancelar + crear" (semántica compartida 001↔002)

**Specs implicadas**: 001 (define la semántica), 002 (depende de ella para el reenvío de recordatorio).

**Cita textual — 001** (rama `main`):
> **FR-017a**: La 001 NO incluye reprogramación: para cambiar la hora o el profesional de una
> cita, la recepción MUST cancelar la cita y crear una nueva (que revalida RN1 y RN2).

**Cita textual — 002** (rama `002-recordatorios-cita`):
> **FR-011**: Cuando una cita se mueve (en la 001 mover equivale a cancelar la cita original y
> crear una cita nueva), la cita nueva MUST ser tratada como cualquier otra cita "reservada" a
> efectos de recordatorio [...].

**Por qué chocarán**:
- Es una dependencia **coherente hoy** (002 se apoya bien en la regla de 001). El riesgo es de
  **propiedad**: 002 codifica su comportamiento de reenvío **asumiendo** que mover = cancelar +
  crear. Si una spec futura (p. ej. una de reprogramación in situ, hoy fuera de alcance de 001)
  cambiara esa semántica, la idempotencia de recordatorios de 002 (FR-003/FR-011) se rompería
  silenciosamente (una cita "movida" real ya no sería una cita nueva y no generaría su
  recordatorio, o lo duplicaría).

**Propuesta de resolución (propietario único)**:
Mantener a **001 como propietario de la semántica de "mover cita"**. Dejar constancia en 002 de
que su FR-011 **depende explícitamente** de FR-017a de 001, de modo que si esa regla cambia en
el futuro, se sepa que 002 debe revisarse. No requiere cambio de comportamiento hoy; es una
anotación de dependencia para evitar rupturas silenciosas.

---

## S7 — Escritura concurrente sobre la misma cita desde features distintas

**Specs implicadas**: 002 (cancelación por email), 003 (cancelación por portal), 001 (recepción cambia estado).

**Cita textual — 003** (rama `003-portal-paciente`):
> **FR-015**: El sistema MUST resolver de forma coherente la concurrencia entre la cancelación
> del paciente y un cambio de estado de recepción sobre la misma cita, sin dejar la cita en un
> estado imposible ni permitir dos transiciones contradictorias [...].

> **Edge Cases → Cancelación simultánea paciente/recepción**: [...] el resultado final es
> coherente (una sola cancelación efectiva) [...].

**Cita textual — 002** (rama `002-recordatorios-cita`):
> **FR-010**: [...] MUST rechazar de forma segura [...] cualquier token [...] correspondiente a
> una cita que ya no está "reservada".

> **Acceptance Scenarios (US3) #3**: **Given** una cita que ya no está "reservada" [...],
> **When** el paciente usa el enlace de cancelación, **Then** el sistema informa de que la cita
> ya no puede cancelarse por esta vía y no realiza ningún cambio.

**Cita textual — 001** (rama `main`):
> **FR-008**: [...] MUST rechazar cualquier otra transición. (Los estados finales no se
> reabren.)

**Por qué chocarán**:
- **En producción**: ahora hay **tres orígenes** de cambio de estado sobre la misma fila de
  cita: recepción (001), email (002) y portal (003). 003 contempla la concurrencia
  paciente↔recepción; 002 contempla que la cita "ya no esté reservada". Pero **ninguna spec
  contempla la concurrencia email (002) ↔ portal (003)** entre sí, que con 003 en juego es un
  escenario real (paciente cancela por email y por portal casi a la vez). Si cada flujo hace su
  propia comprobación "¿sigue reservada?" sin un control de concurrencia común, puede haber
  carreras.
- El núcleo (001) ya exige atomicidad en la creación (FR-011 RN1 concurrencia) pero **no
  describe** una garantía equivalente para transiciones de estado concurrentes desde varios
  clientes.

**Propuesta de resolución (propietario único)**:
Consolidar en **001 (propietario del ciclo de vida, ver S2)** una **garantía de transición de
estado atómica e idempotente**: la transición `reservada→cancelada` debe ser segura ante
cualquier número de solicitantes concurrentes (recepción, email, portal), quedando "una sola
cancelación efectiva". 002 y 003 se limitan a invocar esa operación y a mostrar el mensaje
adecuado si la cita ya no estaba "reservada". Añadir a 001 un criterio análogo a FR-011 pero
para transiciones de estado, y que 002/003 lo referencien en lugar de resolver la concurrencia
por su cuenta.

---

## Matriz de propietarios propuesta (un concepto → un dueño)

| Concepto | Propietario propuesto | Consumidores |
|----------|-----------------------|--------------|
| Ciclo de vida y transiciones de la cita (incl. `reservada→cancelada`) | **001** | 002, 003 |
| Estados que ocupan hueco (`ESTADOS_ACTIVOS = {reservada, completada}`) | **001** | 004 |
| Semántica "mover cita = cancelar + crear" | **001** | 002 |
| Estado/significado de `no_asistida` | **001** | 002, 004 |
| Concurrencia/atomicidad de transición de estado | **001** | 002, 003 |
| Política de cancelación por el paciente (umbral único) | **003** | 002 |
| Identidad/acceso del paciente sin cuenta (token + 2º factor + revocación) | **003** | 002 |
| Métrica oficial "tasa de no asistencia" (Definición A) | **004** | (002 remite a ella) |
| Métrica de eficacia del recordatorio (renombrar en 002) | **002** | — |

## Acciones recomendadas (prioridad)

1. **[Alta] S1**: Decidir con Sara UN umbral de cancelación del paciente y hacer que 002
   delegue en la política de 003. Es una contradicción dura que hoy daría dos comportamientos
   observables distintos.
2. **[Media-Alta] S3**: Unificar el acceso del paciente en un único mecanismo (003) y decidir
   si el email (002) exige segundo factor.
3. **[Media] S2 y S7**: Declarar a 001 propietario del ciclo de vida y añadirle una garantía de
   transición atómica/idempotente que 002 y 003 consuman.
4. **[Media] S4**: Renombrar la métrica de 002 y remitir a 004 como tasa oficial; documentar el
   efecto "cancelación sustituye a no-show".
5. **[Baja-Media] S5**: 001 publica `ESTADOS_ACTIVOS` con nombre; 004 lo consume por referencia.
6. **[Baja] S6**: Anotar en 002 la dependencia explícita de FR-017a de 001.

---

*Informe generado sin modificar ninguna spec ni sacar ninguna rama. Solo se ha escrito este
fichero en el árbol del tronco (`main`).*
