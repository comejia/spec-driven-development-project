# Feature Specification: Prorrateo comercial de cuotas y baja de contratos

**Feature Branch**: `006-prorrateo-baja-contratos`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Prorrateo comercial de cuotas y baja de contratos. Alcance: la convención vigente «a lo comercial»: mes de 30 días, tope de 30, y la pantalla de baja que calcula el importe del último periodo y solo lo informa. RN: RN-14, RN-15, RN-16, RN-17, RN-18. Anomalías: A-30, A-68 (por referencia: A-23 y A-04, cuya spec principal es la 007). Dueño natural: Gestoría y Gerencia."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del prorrateo comercial de cuotas y de la pantalla de baja de contratos de GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
>
> **Reglas de esta spec.**
> - Cada requisito describe el comportamiento ACTUAL y cita su evidencia (fichero y función, o dato real). Esa evidencia es obligatoria (Constitución, Principio II) y por eso aparecen nombres de fichero; no describen cómo construir nada nuevo.
> - Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, con su ID del registro (`specs/000-reconocimiento/registro-de-anomalias.md`).
> - Cada criterio es verificable contra la suite de `test/` (se cita el test) y se ejecuta con `npm test`.
> - Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha).
> - **Hueco de protección**: el golden master **no cubre** esta spec. Se apoya solo en los tests unitarios y de rutas.

## Actas y estado de aprobación

No existe ninguna entrevista con una persona identificada (`entrevista-negocio.md` no existe). Las decisiones que esta spec cita provienen de:

| Cita | Documento | Persona | Fecha | Valor |
|---|---|---|---|---|
| P10 (A-23) | `entrevista-negocio-simulada.md` | Gestoría y Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Unificar a 30 días comerciales las dos vías (pantalla de baja y remesa), solo hacia delante y con confirmación escrita de la gestoría. Hecho sin respuesta concluyente. **Se especifica en la spec 007** |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica P10: hasta entonces, cada vía mantiene su fórmula |
| Comentario de `services/calculo.js` | Código | «Paco» (hacía el prorrateo a mano en el Access) | sin fecha | «Así lo espera la gestoría». CÓDIGO, no acta |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). La anomalía A-30 es BUG A SECAS y A-68 es ACCIDENTAL; A-23 y A-04 siguen **PENDIENTE** en el registro y se especifican en la spec 007. Mientras no firmen la gestoría y Gerencia (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un mes siempre vale 30 días a efectos comerciales (Priority: P1)

Cuando una cuota se cobra por días, el sistema reparte la cuota entre **30 días fijos** («a lo comercial») sin mirar cuántos días tiene el mes, y cobra por los días de servicio. Es una convención protegida por la Constitución (Principio I) y la que espera la gestoría.

**Why this priority**: es el cálculo del importe parcial de un contrato; un cambio altera el importe de cada baja y se nota en la declaración.

**Independent Test**: calcular el prorrateo de una cuota de 90 € en varios periodos. Tests: `calculo.test.js` «calcularProrrateo (RN-14..RN-18, A-23, A-30)».

**Acceptance Scenarios**:

1. **Given** una cuota de 90 €, **When** se prorratea del día 1 al 16, **Then** el importe es 48,00 € (16 días × 3 €). Test: «RN-14».
2. **Given** esa cuota, **When** se prorratea del 15 al 15 (un día), **Then** el importe es 3,00 €. Test: «RN-14».
3. **Given** esa cuota, **When** se prorratea del 1 al 15, **Then** el importe es 45,00 €. Test: «RN-14».
4. **Given** el resultado con decimales, **When** se calcula 1 día de 100 € o 2 días, **Then** se redondea a 3,33 € y 6,67 €; 1 día de 1 € → 0,03 €; 0,01 € × 15 días → 0,01 €. Test: «redondeo del importe».

---

### User Story 2 - El día 31 no se cobra y el tope es la cuota entera (Priority: P1)

Los días de servicio no pueden pasar de 30: un mes de 31 días completo cobra la cuota entera, y un periodo del 2 al 31 también. Si los días salen negativos, el importe es cero.

**Why this priority**: evita cobrar más de la cuota mensual y define la frontera del mes completo.

**Independent Test**: calcular periodos en torno a 29, 30 y 31 días. Tests: «RN-15» (dos), «RN-16».

**Acceptance Scenarios**:

1. **Given** una cuota de 90 €, **When** se prorratea del 1 al 29, **Then** el importe es 87,00 €; del 1 al 30, 90,00 €; del 1 al 31, 90,00 €. Test: «RN-15: el tope de 30 días».
2. **Given** una fecha final absurda (día 45), **When** se prorratea del 1 al 45, **Then** el importe es 90,00 €. Test: «RN-15».
3. **Given** una cuota de 100 €, **When** se prorratea del 2 al 31 y del 1 al 30, **Then** ambos cuestan 100,00 €. Test: «RN-15: del 2 al 31 y del 1 al 30 cuestan la cuota entera».
4. **Given** una fecha final anterior a la inicial (del 10 al 5, del 10 al 9, del 31 al 1), **When** se prorratea, **Then** el importe es 0,00 €; el mismo día cuenta 1 día (3,00 € de 90 €). Test: «RN-16: fecha final anterior a la inicial → 0».

---

### User Story 3 - Febrero completo cobra 28/30 (Priority: P2)

Como el mes siempre son 30 días, un febrero completo (del 1 al 28) cobra **28 de 30**, no la cuota entera; un febrero bisiesto (del 1 al 29) cobra 29/30. La convención es incoherente con el mes de 31 días, pero se mantiene tal cual.

**Why this priority**: es el caso donde la convención se separa más de la intuición (y de la fórmula de la remesa, spec 007).

**Independent Test**: calcular febrero completo con distintas cuotas. Test: «RN-17».

**Acceptance Scenarios**:

1. **Given** una cuota de 90 €, **When** se prorratea todo febrero de 2026 (1 al 28), **Then** el importe es 84,00 €. Test: «RN-17».
2. **Given** una cuota de 100 €, **When** se prorratea todo febrero de 2026, **Then** el importe es 93,33 €. Test: «RN-17».
3. **Given** una cuota de 90 € y febrero bisiesto de 2024 (1 al 29), **When** se prorratea, **Then** el importe es 87,00 €. Test: «RN-17».

---

### User Story 4 - La pantalla de baja calcula el último periodo y solo lo informa (Priority: P1)

Al dar de baja un contrato, el sistema guarda la fecha de baja, calcula el prorrateo **del día 1 del mes de la baja hasta el día de la baja** y muestra el importe en la dirección de la página (`/contratos?prorrateo=72.50`). **No emite ninguna factura**: Administración la emite después a mano con ese importe.

**Why this priority**: es el único uso del prorrateo en el camino web y la causa de la doble facturación de A-04.

**Independent Test**: dar de baja contratos de la semilla. Tests: `rutas.test.js` «POST /contratos/:id/baja».

**Acceptance Scenarios**:

1. **Given** el contrato 2 (145 €), **When** se da de baja el 15-mar-2026, **Then** el sistema redirige a `/contratos?prorrateo=72.50`. Tests: «RN-18», `calculo.test.js` «RN-18».
2. **Given** un contrato sin fecha de baja tecleada, **When** se da de baja con el reloj en 2026-11-11, **Then** se usa hoy: 11 días de 90 € = 33,00 €. Test: «sin fecha de baja se usa hoy».
3. **Given** un contrato inexistente (99), **When** se da de baja, **Then** responde 404 «Contrato no encontrado». Test: la misma.
4. **Given** el contrato 4 (alta 15-feb, 90 €), **When** se da de baja el 20-feb-2026, **Then** el importe es 60,00 € (se cuenta **desde el día 1**, aunque el alta fuera el día 15); la remesa daría 19,29 €. Test: «A-30 / A-23 la pantalla de baja prorratea siempre desde el día 1».
5. **Given** esa baja, **When** se consulta la BD, **Then** la fecha de baja del contrato queda grabada. Test: «estado final de la BD temporal».

---

### User Story 5 - Fechas mal formadas se aceptan o fallan sin avisar (Priority: P3)

El prorrateo solo mira el **día del mes** de las dos fechas y no valida nada: ignora año y mes (del 2026-03-15 al 2026-04-20 son 6 días), acepta día 45 o día 00 y devuelve NaN con textos; con una fecha nula lanza un error (A-30, A-68). Esta spec los **documenta tal cual**.

**Why this priority**: la modernización necesita saber qué hace hoy el cálculo ante entradas anómalas para decidir qué conservar.

**Independent Test**: calcular con fechas atípicas. Tests: «RN-16: solo mira el día del mes», «A-30», «A-68».

**Acceptance Scenarios**:

1. **Given** las fechas 2026-03-15 y 2026-04-20, **When** se prorratea una cuota de 90 €, **Then** son 6 días = 18,00 €; con 2026-07-01 y 2026-08-05, 15,00 €. Test: «RN-16: solo mira el día del mes».
2. **Given** un día 00 de inicio (2026-07-00 a 2026-07-10), **When** se prorratea 90 €, **Then** el importe es 33,00 € (11 días). Con un final «2026-07-0», 0,00 €. Test: «A-30».
3. **Given** fechas que no son fechas («x», «y»; «2026-07»; cadena vacía) o cuota NaN, **When** se prorratea, **Then** el resultado es NaN. Test: «A-30».
4. **Given** una fecha nula o indefinida, **When** se prorratea, **Then** lanza un `TypeError`. Test: «A-68».
5. **Given** una cuota cero, negativa o en texto, **When** se prorratea, **Then** 0, −48 (cuota −90 del 1 al 16) y 48 (cuota «90»). Test: «cuota cero, negativa y como texto».

---

### Edge Cases

- **Mismo día**: un solo día de servicio vale una treintava parte de la cuota (RN-16). Test: «RN-16».
- **Mes de 31 días completo**: coincide con la cuota entera; del 2 al 31 también. Test: «RN-15».
- **Alta a mitad de mes y baja el mismo mes**: la pantalla cuenta siempre desde el día 1 (contrato 4: 60,00 € frente a 19,29 € de la remesa; A-23 y A-30).
- **La baja grabada pero sin factura**: el importe aparece solo en la URL; si Administración no emite la factura a mano, no se cobra. Hecho de proceso, sin test.
- **Doble facturación de la baja (A-04)**: el mes de la baja también lo cobra la remesa si se lanza después. Se especifica en la spec 007.
- **Fechas de baja en meses distintos al de alta**: no se comprueba (A-30).
- **La cuota no se valida**: cero y negativa se aceptan. Test: «cuota cero, negativa y como texto».

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-14)*: El sistema MUST calcular el prorrateo como cuota / 30 × días de servicio, con los días = día final − día inicial + 1, redondeado a 2 decimales. Evidencia: `calcularProrrateo`, `services/calculo.js:95-102` (comentario: «a lo comercial … asi lo espera la gestoria»). Ejemplos con cuota 90: del 1 al 16 → 48,00; del 15 al 15 → 3,00; del 1 al 15 → 45,00. Test: «RN-14»; «redondeo del importe».
- **FR-002** *(RN-15)*: El sistema MUST limitar los días de servicio a 30. Evidencia: `services/calculo.js:99` («el dia 31 no se cobra»). Ejemplos: 90 € del 1 al 31 → 90,00; 100 € del 2 al 31 → 100,00; 100 € del 1 al 30 → 100,00. Test: «RN-15» (dos).
- **FR-003** *(RN-16)*: El sistema MUST devolver 0,00 si la fecha final es anterior a la inicial, y MUST contar el mismo día como 1 día. Evidencia: `services/calculo.js:100`. Test: «RN-16: fecha final anterior».
- **FR-004** *(RN-16)*: El sistema MUST usar solo el día del mes de cada fecha, ignorando el año y el mes. Evidencia: `services/calculo.js:96-97`. Ejemplo: 2026-03-15 a 2026-04-20 → 6 días → 18,00 € con 90 €. Test: «RN-16: solo mira el día del mes».
- **FR-005** *(RN-17)*: El sistema MUST cobrar un febrero completo como 28/30 de la cuota (29/30 si es bisiesto), porque el mes se trata siempre como de 30 días. Ejemplos: 90 € → 84,00; 100 € → 93,33; 90 € en 2024 → 87,00. Evidencia: `services/calculo.js:98-101`. Test: «RN-17».
- **FR-006** *(RN-18)*: La pantalla de baja MUST guardar la fecha de baja (la tecleada o la de hoy), MUST calcular el prorrateo desde el **día 1 del mes de la baja** hasta la fecha de baja con la cuota del contrato, y MUST redirigir a `/contratos?prorrateo=<importe con 2 decimales>`. No emite factura. Evidencia: `routes/contratos.js:31-43`; `views/contratos.ejs:17` («administración emite esa factura a mano»). Ejemplo: contrato 2 (145 €), baja 15-mar-2026 → 72,50. Test: `rutas.test.js` «RN-18»; «sin fecha de baja se usa hoy».
- **FR-007** *(RN-18)*: Si el contrato no existe, la pantalla de baja MUST responder 404 «Contrato no encontrado» sin cambiar nada. Evidencia: `routes/contratos.js:34`. Test: «sin fecha de baja … un contrato inexistente → 404».
- **FR-008** *(A-30)*: El sistema MUST NOT validar las fechas de baja ni las del prorrateo: día 45, día 00, meses distintos y textos se procesan con la misma fórmula (NaN si no hay números). Evidencia: `services/calculo.js:96-97`; `routes/contratos.js:32`. Test: «A-30» (cálculo y pantalla).
- **FR-009** *(A-68)*: El sistema MUST lanzar un `TypeError` si la fecha inicial o final es nula o indefinida. Evidencia: `services/calculo.js:96-97` (`desde.split`). Test: «A-68».
- **FR-010** *(A-30)*: La cuota MUST aceptarse cero, negativa o en texto numérico sin validar: 0 → 0; −90 del 1 al 16 → −48; «90» → 48. Test: «cuota cero, negativa y como texto».
- **FR-011** *(A-23, referencia)*: La convención de 30 días de esta spec MUST convivir con la fórmula de días reales de la remesa (spec 007). Los mismos periodos dan importes distintos: alta 16-jul de 90 € → 48,00 (pantalla) frente a 46,45 (remesa); baja 15-mar de 145 € → 72,50 frente a 70,16; todo febrero de 100 € → 93,33 frente a 100,00. Test: `remesa.test.js` «contradicción 01» (siete casos).

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-30 | Fechas de baja sin validar | BUG A SECAS | Corregir en modernización sin tocar fórmulas | FR-008, FR-010 | «A-30» (dos) |
| A-68 | `TypeError` con fecha nula | ACCIDENTAL | TC | FR-009 | «A-68» |

**Por referencia (su spec principal es la 007)**:

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Dónde |
|---|---|---|---|---|
| A-23 | Dos fórmulas de prorrateo (30 días frente a días reales) | PENDIENTE | TC las dos | Spec 007; FR-011 aquí |
| A-04 | El mes de la baja se puede facturar dos veces | PENDIENTE | TC | Spec 007 |

TC = especificar tal cual. Las correcciones corresponden a la modernización, solo hacia delante y por decisión escrita del negocio.

### Key Entities *(include if feature involves data)*

- **Contrato**: concepto, cuota mensual, tipo de IVA, fecha de alta y fecha de baja (vacía si está vigente).
- **Periodo de servicio**: día inicial y día final dentro del mismo mes.
- **Prorrateo**: importe parcial calculado como cuota / 30 × días.
- **Convención «a lo comercial»**: el mes siempre son 30 días y se cobra como máximo la cuota entera.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los importes de las historias 1 a 4 (48,00; 3,00; 45,00; 87,00; 90,00; 84,00; 93,33; 87,00; 72,50; 33,00; 60,00) se reproducen al céntimo con `npm test`.
- **SC-002**: Las 2 anomalías propias (A-30, A-68) y la convivencia con A-23 (siete casos de la contradicción 01) tienen al menos un test que congela su comportamiento actual.
- **SC-003**: Cada uno de los 11 requisitos funcionales se puede comprobar con al menos un test existente, sin escribir código nuevo.
- **SC-004**: El golden master **no** cubre esta spec; la protección es la de los tests unitarios y de rutas (señalado expresamente).
- **SC-005**: Un revisor de la gestoría y de Gerencia puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- La fórmula de días reales, qué contratos entran en la remesa y la doble facturación (A-23, A-04): **spec 007**.
- Alta de contratos y validación de sus campos (A-06, A-53): **spec 009** (cuota «1.210,00» → 1,21 se cita allí).
- Cálculo de IVA de la cuota: **spec 001**.
- Emisión de la factura de baja a mano: **spec 004**.

## Assumptions

- **SUPOSICIÓN**: la gestoría espera la convención de 30 días porque así se lo dijo «Paco» (comentario del código); no hay acta con persona identificada.
- **SUPOSICIÓN**: Administración emite a mano la factura de la baja con el importe que muestra la URL (comentario de `routes/contratos.js` y de `views/contratos.ejs`). El proceso real no está verificado.
- Los ejemplos con contratos proceden de la semilla de `db.js` (contratos 1 a 4) y de los tests; `datos/gesfact.db` puede ser una copia de esa semilla (A-18).
- Los importes que dependen de coma flotante son los de Node.js con números de doble precisión (Principio I).
- Dependencia de otras specs: usa 001 (redondeo). La spec 007 depende de ésta para A-23.
