# Feature Specification: Panel de Analítica

**Feature Branch**: `004-panel-analitica`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Panel de analítica para la clínica. Sara lo necesita para las renovaciones: 'enseñar a la clínica lo que CitaClara le ahorra'. Alcance: una página del panel (misma clave que la agenda), con interfaz moderna y gráficos claros: ocupación semanal por profesional, tasa de no asistencia por profesional, ingresos por servicio (citas completadas; importes exactos, al céntimo), y evolución de las últimas 8 semanas. Solo lectura: esta feature no escribe NADA. Construir los ejemplos con los números reales de la semilla."

## Decisiones de negocio de Sara (resueltas)

Estas dos definiciones cambian los números que se enseñan a la clínica; Sara las decidió en
la sesión de clarificación del 2026-09-19 (ver Clarifications). Los ejemplos de esta spec
usan las definiciones acordadas y son reproducibles con la semilla.

- **P1 — Definición de "tasa de no asistencia"** (resuelta, ver Clarifications 2026-09-19):
  Definición A = no asistidas ÷ (completadas + canceladas + no asistidas), es decir, sobre
  todas las citas pasadas que ya tenían un desenlace. Los ejemplos de esta spec usan esta
  definición.

- **P2 — Definición de "ocupación"** (resuelta, ver Clarifications 2026-09-19): numerador =
  minutos de citas en estado reservada + completada (los estados que ocupan hueco, por
  referencia a la 001 FR-010/RN1); denominador = jornada de actividad 09:00–19:00 en días
  laborables (600 min por día laborable). Los ejemplos de esta spec usan esta definición.

## Propiedad y consumo entre specs (revisión cruzada jul 2026)

Esta sección resuelve los solapamientos **S4** y **S5** del informe
`specs/000-revision-cruzada-jul2026.md`, siguiendo el Principio 1 (Spec Primero) y la regla
"un propietario por concepto". La 004 **no cambia el comportamiento del núcleo 001**: lo
consume por referencia tal como está hoy.

- **S4 — 004 es la propietaria única de la métrica "tasa de no asistencia"** (Definición A,
  denominador explícito en FR-006). Cualquier otra spec que hable de "tasa de no asistencia"
  DEBE remitir a la 004 y no inventar su propia fórmula.
  - El **estado `no_asistida`** (su significado) es propiedad de la **001** (001 FR-009): la
    004 lo **cita**, no lo redefine.
  - La métrica de eficacia del recordatorio de la **002** (porcentaje de citas recordadas que
    acaban en `no_asistida`) **no es** la tasa oficial de la clínica: usa un denominador
    distinto (citas recordadas). La 002 remite a la 004 para la tasa oficial; la 004 **no**
    adopta la fórmula de la 002.
- **S5 — 004 consume por referencia el conjunto de "estados que ocupan hueco"** (reservada y
  completada), que define la **001** en su regla anti-solape (001 FR-010, RN1). La 004 **no
  publica ni inventa** una constante `ESTADOS_ACTIVOS` atribuida a la 001; describe el
  conjunto citando su fuente real. Si la 001 cambiara algún día qué estado ocupa hueco, el
  FR-007 de la 004 DEBE revisarse (nota de dependencia).

## Clarifications

### Session 2026-09-19

- Q: Para la tasa de no asistencia por profesional, ¿qué citas forman el denominador? → A: Definición A — no asistidas ÷ (completadas + canceladas + no asistidas), es decir, todas las citas pasadas con desenlace.
- Q: Para la ocupación semanal por profesional, ¿qué numerador y denominador se usan? → A: Numerador = minutos de citas reservada + completada (estados que ocupan hueco); denominador = jornada de actividad 09:00–19:00 en días laborables (600 min/día laborable).
- Q: ¿La ocupación semanal incluye semanas futuras con reservas o solo hasta la semana en curso? → A: Solo hasta la semana en curso (histórico + semana actual); no se pintan semanas futuras.

### Session 2026-09-22 (revisión cruzada, S4/S5)

- Q: ¿Quién es el propietario de la métrica "tasa de no asistencia"? → A: La 004, como propietaria única (Definición A, denominador explícito); las demás specs remiten a la 004.
- Q: ¿De quién es el significado del estado `no_asistida`? → A: De la 001 (FR-009); la 004 lo cita, no lo redefine.
- Q: ¿Cómo consume la 004 el conjunto "estados que ocupan hueco" para la ocupación? → A: Por referencia a la regla anti-solape de la 001 (FR-010, RN1) = "reservada" + "completada"; sin inventar una constante con nombre atribuida a la 001, y con nota de dependencia si la 001 cambia.
- Q: ¿Cómo debe leerse la tendencia de la tasa cuando 005/002 facilitan la cancelación del paciente? → A: Al crecer las cancelaciones sube el denominador de la Definición A, por lo que la tasa puede bajar en parte por "conversión de no-show en cancelación", no solo por menos no-shows; se documenta para no atribuir toda la mejora a los recordatorios.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enseñar el valor a la clínica en la renovación (Priority: P1)

Sara (responsable de cuenta de CitaClara) o la propia recepción abre el panel de analítica
—con la misma clave de clínica que da acceso a la agenda— y ve, en una sola página, cuánto
ha facturado la clínica por servicio en citas completadas, cómo evoluciona su actividad y
qué profesionales tienen más no asistencias. Con esa foto, Sara sostiene la conversación de
renovación mostrando "lo que CitaClara le ahorra y le ordena".

**Why this priority**: Es la razón de ser de la feature. Sin una vista clara y creíble de
ingresos y actividad, la renovación se apoya en percepciones y no en hechos. Entrega valor
por sí sola aunque el resto de gráficos llegue después.

**Independent Test**: Con los datos de la semilla, acceder al panel con la clave correcta y
comprobar que los ingresos totales por citas completadas suman **31.425,00 €** y que el
desglose por servicio cuadra al céntimo con los importes esperados.

**Acceptance Scenarios**:

1. **Given** una clínica con historia de demostración sembrada, **When** se accede al panel
   de analítica con la clave correcta, **Then** se muestran, en una sola página, los cuatro
   bloques: ocupación semanal por profesional, tasa de no asistencia por profesional,
   ingresos por servicio y evolución de las últimas 8 semanas.
2. **Given** el panel abierto, **When** se leen los ingresos por servicio, **Then** el total
   de citas completadas es **31.425,00 €** y el desglose es: Primera visita de fisioterapia
   **10.250,00 €**, Sesión de fisioterapia **9.880,00 €**, Primera visita de nutrición
   **6.255,00 €** y Consulta de nutrición **5.040,00 €** (suma exacta al céntimo).
3. **Given** una petición sin clave o con clave incorrecta, **When** se intenta abrir el
   panel de analítica, **Then** el acceso se deniega y no se muestra ningún dato.

---

### User Story 2 - Ingresos por servicio, exactos al céntimo (Priority: P1)

La clínica quiere ver de qué servicios viene el dinero. El panel muestra, solo para citas
**completadas**, el importe total de cada servicio y el total general, siempre cuadrado al
céntimo (constitución, Principio 2).

**Why this priority**: El argumento económico es el corazón de la renovación. Los importes
inexactos destruirían la confianza; por eso es P1 y debe ser verificable con la semilla.

**Independent Test**: Sumar por servicio los importes de las citas completadas de la semilla
y comprobar que coinciden exactamente con los del panel, sin descuadre de un solo céntimo.

**Acceptance Scenarios**:

1. **Given** la historia de la semilla, **When** se consultan los ingresos por servicio,
   **Then** se listan los servicios ordenados por importe con: Primera visita de
   fisioterapia 10.250,00 € (205 citas completadas), Sesión de fisioterapia 9.880,00 €
   (247), Primera visita de nutrición 6.255,00 € (139) y Consulta de nutrición 5.040,00 €
   (144).
2. **Given** los ingresos por servicio, **When** se suman todos, **Then** el total es
   exactamente 31.425,00 € (suma al céntimo de los cuatro servicios).
3. **Given** una cita en estado reservada, cancelada o no asistida, **When** se calculan los
   ingresos, **Then** esa cita NO aporta importe (solo cuentan las completadas).

---

### User Story 3 - Tasa de no asistencia por profesional (Priority: P2)

La clínica ve, por cada profesional, qué porcentaje de sus citas pasadas terminó en "no
asistida", para detectar dónde se pierden huecos y valorar recordatorios (feature aparte).

**Why this priority**: Aporta un argumento operativo potente ("CitaClara te ayuda a reducir
esto"), pero el bloque económico (US1/US2) es el que cierra la renovación, así que va detrás.

**Independent Test**: Con la semilla y la Definición A (Clarifications 2026-09-19), comprobar
que las tasas por profesional coinciden con los valores esperados.

**Acceptance Scenarios**:

1. **Given** la historia de la semilla y la Definición A de no asistencia, **When** se
   consulta la tasa por profesional, **Then** se muestra: María
   Ferrer **11,3 %** (32 no asistidas de 284 citas pasadas), Jorge Nieto **7,9 %** (22 de
   279) y Lucía Prados **11,0 %** (39 de 353).
2. **Given** la tasa por profesional, **When** se muestra el porcentaje, **Then** aparece con
   una cifra clara y su lectura literal ("de cada 100 citas pasadas, N terminaron en no
   asistida"), sin jerga técnica.
3. **Given** un profesional sin citas pasadas en el periodo, **When** se calcula su tasa,
   **Then** el panel muestra "sin datos" en lugar de un porcentaje engañoso o una división
   por cero.
4. **Given** que la clínica usa la cancelación por el paciente (specs 005/002) y crecen las
   cancelaciones, **When** se muestra la tasa de no asistencia, **Then** el panel acompaña la
   cifra de una nota que advierte de que parte de la bajada puede deberse a no-shows
   convertidos en cancelaciones (aumento del denominador, Definición A), y no solo a menos
   no-shows (FR-006c).

---

### User Story 4 - Ocupación semanal por profesional (Priority: P2)

La clínica ve, semana a semana, qué porcentaje de la jornada de cada profesional estuvo
ocupado por citas, para entender su carga real y su margen de crecimiento.

**Why this priority**: Complementa el relato ("tienes hueco para crecer" / "vas lleno"),
pero es secundario frente al bloque económico.

**Independent Test**: Con la semilla y la definición de ocupación acordada (Clarifications
2026-09-19), comprobar que la ocupación media por profesional coincide con los valores
esperados.

**Acceptance Scenarios**:

1. **Given** la historia de la semilla y la definición de ocupación acordada, **When** se
   consulta la ocupación semanal por profesional, **Then** la ocupación media aproximada es
   María Ferrer **46 %**, Jorge Nieto **47 %** y Lucía Prados **41 %**.
2. **Given** la ocupación semanal, **When** se representa, **Then** cada profesional tiene su
   propia serie por semana y las semanas se identifican de forma inequívoca para una clínica
   española.
3. **Given** una semana sin jornada (p. ej. festivo completo), **When** se calcula la
   ocupación, **Then** el panel no muestra porcentajes por encima del 100 % ni divisiones por
   cero.
4. **Given** semanas futuras con citas reservadas, **When** se consulta la ocupación,
   **Then** el panel no pinta esas semanas futuras (solo hasta la semana en curso, FR-007a).

---

### User Story 5 - Evolución de las últimas 8 semanas (Priority: P3)

La clínica ve la tendencia de las últimas 8 semanas (citas completadas e ingresos por
semana) para responder a "¿vamos a más o a menos?".

**Why this priority**: Refuerza el relato de tendencia, pero es el bloque que menos pesa en
la decisión de renovar respecto a los ingresos y a las tasas.

**Independent Test**: Con la semilla, comprobar que la serie semanal de citas completadas e
ingresos reproduce los valores esperados para las semanas del periodo.

**Acceptance Scenarios**:

1. **Given** la historia de la semilla, **When** se consulta la evolución semanal de citas
   completadas e ingresos, **Then** la serie de semanas completas reproduce, por ejemplo:
   87 completadas / 3.675,00 € (semana ISO 31), 91 / 3.890,00 € (32), 97 / 4.120,00 € (33),
   95 / 4.065,00 € (34), 90 / 3.860,00 € (35), 83 / 3.590,00 € (36), 84 / 3.565,00 € (37).
2. **Given** la evolución, **When** se representa, **Then** se ve una única serie temporal
   ordenada cronológicamente, con semanas etiquetadas de forma inequívoca.
3. **Given** que hay menos de 8 semanas de historia, **When** se muestra la evolución,
   **Then** se muestran solo las semanas disponibles sin inventar semanas vacías.

---

### Edge Cases

- **Acceso sin clave**: abrir el panel sin la clave de la clínica o con una incorrecta se
  deniega igual que la agenda; no se filtra ningún número.
- **Clínica sin historia**: una clínica recién creada, sin citas, muestra cada bloque con un
  "sin datos" claro en lugar de ceros ambiguos o errores.
- **Solo citas futuras**: si la clínica solo tiene reservas futuras y ninguna cita pasada,
  ingresos y tasas de no asistencia muestran "sin datos"; la ocupación no pinta esas semanas
  futuras (FR-007a), por lo que también muestra "sin datos" hasta que haya semanas hasta la
  semana en curso.
- **Profesional sin citas en una semana**: su ocupación esa semana es 0 %, no "sin datos"
  (la jornada existía aunque no se usara).
- **División por cero**: ningún cálculo (tasa, ocupación) puede fallar ni mostrar valores
  imposibles cuando el denominador es cero; se muestra "sin datos".
- **Importe y fecha inequívocos**: todos los importes se muestran al céntimo en euros y todas
  las semanas/fechas en formato inequívoco para España.
- **Solo lectura**: ninguna interacción del panel (filtrar, cambiar de rango, recargar)
  modifica dato alguno; el panel jamás escribe en la agenda.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer una página de analítica dentro del panel de la
  clínica, accesible con la MISMA clave de clínica que da acceso a la agenda (FR-018 de la
  001); MUST denegar el acceso cuando la clave sea incorrecta o esté ausente.
- **FR-002 (solo lectura, capital de esta feature)**: El panel de analítica MUST ser de
  solo lectura; NO MUST escribir, modificar ni borrar ningún dato de la clínica, ni la
  agenda, ni las citas, ni ninguna otra entidad, bajo ninguna interacción.
- **FR-003**: El sistema MUST mostrar los cuatro bloques en una sola página: (a) ocupación
  semanal por profesional, (b) tasa de no asistencia por profesional, (c) ingresos por
  servicio y (d) evolución de las últimas 8 semanas.
- **FR-004 (ingresos por servicio)**: El sistema MUST calcular los ingresos por servicio
  sumando ÚNICAMENTE los importes de las citas en estado "completada"; las citas reservada,
  cancelada y no_asistida NO aportan importe.
- **FR-005**: El sistema MUST mostrar todos los importes cuadrados al céntimo, en euros y en
  formato inequívoco para España (constitución, Principio 2); MUST mostrar también el total
  general de ingresos por citas completadas.
- **FR-006 (tasa de no asistencia — métrica propiedad de la 004)**: La 004 es la **propietaria
  única** de la métrica oficial "tasa de no asistencia" de la clínica. El sistema MUST
  calcularla, por profesional, como no_asistida ÷ (completada + cancelada + no_asistida) de
  sus citas pasadas con desenlace (Definición A, Clarifications 2026-09-19), expresada en
  porcentaje. Cualquier otra spec que hable de "tasa de no asistencia" MUST remitir a esta
  definición y NO usar una fórmula propia.
- **FR-006a**: El sistema MUST tratar como "pasadas con desenlace" únicamente las citas cuyo
  estado ya no es "reservada" (completada, cancelada o no_asistida); las reservas futuras NO
  entran en el cálculo de la tasa de no asistencia.
- **FR-006b (significado de `no_asistida`, propiedad de la 001)**: El sistema MUST interpretar
  el estado `no_asistida` exactamente como lo define la **001 (FR-009)**: el paciente no se
  presentó a una cita que seguía reservada. La 004 **cita** ese significado y NO lo redefine.
- **FR-006c (efecto "la cancelación sustituye al no-show")**: El panel MUST acompañar la tasa
  de no asistencia de una lectura que advierta que, al facilitar la cancelación por el
  paciente (specs 005 y 002), el número de citas "cancelada" crece y con él el **denominador**
  de la Definición A; por tanto la tasa puede **bajar en parte por un cambio de comportamiento**
  (no-shows que se convierten en cancelaciones), no solo por menos no-shows. La clínica NO debe
  atribuir toda la mejora a los recordatorios.
- **FR-006d (delimitación frente a la métrica de la 002)**: La métrica de eficacia del
  recordatorio de la **002** (porcentaje de citas recordadas que terminan en `no_asistida`)
  NO es la tasa oficial de no asistencia: tiene un denominador distinto (citas recordadas). La
  002 remite a la 004 para la tasa oficial; la 004 NO adopta la fórmula de la 002.
- **FR-007 (ocupación)**: El sistema MUST calcular, por profesional y por semana, la
  ocupación como (minutos de citas en estado "reservada" o "completada") ÷ (minutos de la
  jornada de actividad de la clínica esa semana), expresada en porcentaje. La jornada de
  actividad es 09:00–19:00 en días laborables (600 min por día laborable). El conjunto de
  estados que ocupan hueco —"reservada" y "completada"— se **consume por referencia a la
  regla anti-solape de la 001 (FR-010, RN1)**, que es quien define qué estados bloquean el
  hueco; "cancelada" y "no_asistida" NO ocupan (001 FR-010). La 004 NO define ni publica una
  constante con nombre propia para este conjunto.
- **FR-007b (nota de dependencia con la 001)**: El conjunto de estados que ocupan hueco usado
  en FR-007 depende de la 001 (FR-010, RN1). Si la 001 cambiara en el futuro qué estados
  ocupan hueco (p. ej. si "completada" dejara de contar para el solape), el FR-007 de la 004
  MUST revisarse para seguir alineado con la fuente.
- **FR-007a (alcance temporal de la ocupación)**: El sistema MUST mostrar la ocupación
  semanal solo hasta la semana en curso de la clínica (histórico más la semana actual); NO
  MUST pintar semanas futuras aunque ya tengan citas reservadas (Clarifications 2026-09-19).
- **FR-008 (evolución 8 semanas)**: El sistema MUST mostrar la evolución de las últimas 8
  semanas con, al menos, citas completadas por semana e ingresos por semana, ordenadas
  cronológicamente.
- **FR-009**: El sistema MUST etiquetar cada semana de forma inequívoca para una clínica
  española (de modo que dos personas identifiquen sin ambigüedad de qué semana se habla).
- **FR-010**: El sistema MUST mostrar "sin datos" (no un cero engañoso ni un error) cuando un
  cálculo carezca de base (p. ej. profesional sin citas pasadas, clínica sin historia,
  denominador cero).
- **FR-011**: El sistema MUST presentar la interfaz en español de España, moderna, con
  gráficos claros, sin jerga técnica, legible con contraste y tamaños accesibles, y usable
  tanto en el portátil de recepción como en el móvil (constitución, Principios 7 y 8).
- **FR-012**: El sistema MUST calcular todos los indicadores sobre los datos de la clínica
  autenticada exclusivamente; NO MUST mezclar datos de otras clínicas.
- **FR-013**: El sistema MUST interpretar fechas, días y semanas en la zona horaria de
  negocio de la clínica (peninsular española), de forma coherente con la agenda de la 001.
- **FR-014 (reproducibilidad)**: Los indicadores del panel, calculados sobre los datos de
  demostración deterministas, MUST reproducir exactamente los números citados en esta spec
  (constitución, Principio 5).

### Números de referencia (semilla determinista)

Cifras verificadas ejecutando la semilla determinista de la 001 (semilla
`citaclara-eleva-2026`) sobre la historia de la clínica de demostración "Clínica Eleva",
con día de referencia **16/09/2026** (el mismo que usan las pruebas de la 001). Cualquiera
puede reproducirlas regenerando la semilla (Principio 5). Total de citas generadas: **1141**
(225 reservadas, 735 completadas, 88 canceladas, 93 no asistidas; 916 citas pasadas).

**Ingresos por servicio (solo completadas):**

| Servicio | Citas completadas | Ingresos |
|----------|-------------------|----------|
| Primera visita de fisioterapia | 205 | 10.250,00 € |
| Sesión de fisioterapia | 247 | 9.880,00 € |
| Primera visita de nutrición | 139 | 6.255,00 € |
| Consulta de nutrición | 144 | 5.040,00 € |
| **Total** | **735** | **31.425,00 €** |

**Tasa de no asistencia por profesional** (Definición A acordada — no asistidas ÷ citas
pasadas con desenlace; se incluye Def. B solo como referencia de contraste):

| Profesional | Especialidad | No asistidas | Citas pasadas | Tasa (Def. A) | Tasa (Def. B) |
|-------------|--------------|--------------|---------------|---------------|---------------|
| María Ferrer | Fisioterapia | 32 | 284 | 11,3 % | 12,5 % |
| Jorge Nieto | Fisioterapia | 22 | 279 | 7,9 % | 8,8 % |
| Lucía Prados | Nutrición | 39 | 353 | 11,0 % | 12,1 % |

- Def. A = no_asistida ÷ (completada + cancelada + no_asistida).
- Def. B = no_asistida ÷ (completada + no_asistida) (excluye canceladas del denominador).

**Ocupación media por profesional** (definición acordada — minutos activos ÷ minutos de
jornada; jornada de referencia de la semilla 09:00–19:00, 5 días laborables):

| Profesional | Ocupación media |
|-------------|-----------------|
| María Ferrer | ≈ 46 % |
| Jorge Nieto | ≈ 47 % |
| Lucía Prados | ≈ 41 % |

**Evolución semanal (citas completadas e ingresos), semanas completas del periodo:**

| Semana ISO | Citas completadas | Ingresos |
|------------|-------------------|----------|
| 31 | 87 | 3.675,00 € |
| 32 | 91 | 3.890,00 € |
| 33 | 97 | 4.120,00 € |
| 34 | 95 | 4.065,00 € |
| 35 | 90 | 3.860,00 € |
| 36 | 83 | 3.590,00 € |
| 37 | 84 | 3.565,00 € |

> Nota: las semanas de los extremos del periodo (semanas ISO 30 y 38 respecto al día de
> referencia) son parciales y muestran cifras más bajas por recoger solo parte de sus días
> laborables; por eso los ejemplos anteriores usan semanas completas.

### Key Entities *(include if feature involves data)*

Esta feature NO crea entidades nuevas; solo lee y agrega las de la 001.

- **Cita**: fuente de todos los indicadores. Relevan su estado (reservada, completada,
  cancelada, no_asistida —significado propiedad de la 001, FR-009), su franja [inicio, fin)
  —para minutos de ocupación— y su servicio —para ingresos e importe.
- **Servicio**: aporta el importe (precio en céntimos) que se suma en los ingresos de citas
  completadas y su nombre para el desglose.
- **Profesional**: dimensión de agrupación de la ocupación y de la tasa de no asistencia.
- **Clínica**: ámbito de todos los cálculos; la clave de clínica autoriza el acceso al panel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sobre los datos de la semilla, el total de ingresos por citas completadas que
  muestra el panel es exactamente 31.425,00 €, con 0 céntimos de descuadre respecto a la suma
  del desglose por servicio.
- **SC-002**: En el 100 % de los accesos sin clave válida, el panel no muestra ningún dato de
  analítica.
- **SC-003**: El panel no realiza ninguna escritura: tras abrirlo e interactuar con todos sus
  controles, el estado de la clínica (citas y demás datos) es idéntico byte a byte al previo
  (verificable comparando la historia antes y después).
- **SC-004**: Sobre los datos de la semilla y con la Definición A de no asistencia
  (Clarifications 2026-09-19), la tasa por profesional reproduce los valores de esta spec:
  11,3 %, 7,9 % y 11,0 %.
- **SC-005**: Sobre los datos de la semilla y con la definición de ocupación acordada
  (Clarifications 2026-09-19), la ocupación media por profesional reproduce los valores de
  esta spec (≈ 46 %, ≈ 47 %, ≈ 41 %).
- **SC-006**: La evolución muestra como máximo 8 semanas, ordenadas cronológicamente, y sobre
  los datos de la semilla reproduce la serie de citas completadas e ingresos de las semanas
  completas del periodo.
- **SC-007**: Al regenerar los datos de demostración con la misma semilla, todos los
  indicadores del panel son idénticos en el 100 % de las ejecuciones (Principio 5).
- **SC-008**: Ningún indicador muestra valores imposibles (porcentajes > 100 %, divisiones
  por cero) ni errores cuando falta base de cálculo; en su lugar aparece "sin datos".
- **SC-009**: El panel es legible y usable tanto en portátil como en móvil, con contraste y
  tamaños accesibles, y sin jerga técnica en pantalla.
- **SC-010**: Junto a la tasa de no asistencia, el panel muestra en el 100 % de los casos la
  nota de lectura del efecto "la cancelación sustituye al no-show" (FR-006c), de modo que la
  tendencia no se atribuya por completo a los recordatorios.

## Assumptions

- El panel usa la autenticación de clínica ya existente (clave de clínica de la 001); no
  introduce usuarios, roles ni permisos nuevos.
- Los indicadores se calculan sobre los datos vivos de la clínica autenticada; los números de
  ejemplo de esta spec corresponden a la historia de demostración con día de referencia
  16/09/2026, elegido para que las cifras sean reproducibles con independencia del día real
  de ejecución.
- "Últimas 8 semanas" se cuenta hacia atrás desde la semana en curso de la clínica; el
  detalle exacto (semanas naturales completas vs. ventana móvil de 56 días) se decide en el
  plan y no cambia el valor de negocio.
- Los importes provienen del precio del servicio en el momento del cálculo; la 001 no
  contempla histórico de precios, por lo que se usa el precio vigente del servicio.
- La "jornada" de referencia para la ocupación es la franja de actividad de la clínica,
  fijada en 09:00–19:00 en días laborables (600 min por día laborable), coherente con la
  franja de generación de la semilla (Clarifications 2026-09-19).
- Los estados que ocupan hueco (reservada y completada) son los que cuentan como "ocupación",
  por referencia a la regla anti-solape de la 001 (FR-010, RN1); cancelada y no_asistida
  liberan el hueco y no ocupan. La 004 consume ese conjunto, no lo redefine (S5).
- Esta feature no incluye exportación (PDF/CSV), comparación entre clínicas, ni filtros
  avanzados de rango de fechas más allá de las últimas 8 semanas; se abordarían en specs
  propias si se piden.

## Fuera de alcance (004)

- Cualquier escritura o acción sobre la agenda o las citas (esta feature es solo lectura).
- Exportar informes (PDF, CSV, impresión formateada) o enviarlos por email.
- Comparativas entre clínicas o agregados multiclínica.
- Rangos de fecha configurables más allá de las últimas 8 semanas y de la ocupación semanal.
- Predicciones o proyecciones de ingresos (solo se muestran datos históricos reales).
- Recordatorios para reducir la no asistencia (feature aparte, 002). La 004 no mide la
  eficacia del recordatorio; la 002 tiene su propia métrica con denominador distinto y remite
  a la 004 para la tasa oficial de no asistencia (S4).
