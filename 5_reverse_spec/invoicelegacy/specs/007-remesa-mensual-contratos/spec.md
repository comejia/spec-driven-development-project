# Feature Specification: Remesa mensual de contratos

**Feature Branch**: `007-remesa-mensual-contratos`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Remesa mensual de contratos (scripts/remesa_mensual.js). Alcance: qué contratos entran cada mes, el importe de cada cuota (días reales del mes), la forma de la factura generada, y lo que no impide (repetir, clientes de baja). Camino batch. RN: RN-19, RN-20, RN-21, RN-22, RN-23, RN-24, RN-25, RN-26, RN-54. Anomalías: A-23, A-04, A-27, A-31, A-03, A-70, A-71, A-65. Dueño natural: Administración."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la remesa mensual de contratos de GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
>
> **Reglas de esta spec.**
> - Cada requisito describe el comportamiento ACTUAL y cita su evidencia (fichero y función, o dato real). Esa evidencia es obligatoria (Constitución, Principio II) y por eso aparecen nombres de fichero; no describen cómo construir nada nuevo.
> - Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, con su ID del registro (`specs/000-reconocimiento/registro-de-anomalias.md`).
> - Cada criterio es verificable contra la suite de `test/` (se cita el test) y se ejecuta con `npm test`.
> - Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha).

## Actas y estado de aprobación

No existe ninguna entrevista con una persona identificada (`entrevista-negocio.md` no existe). Las decisiones que esta spec cita provienen de:

| Cita | Documento | Persona | Fecha | Valor |
|---|---|---|---|---|
| P2 (A-04) | `entrevista-negocio-simulada.md` | Administración, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Una sola vía para la baja: la remesa. El hecho de cómo se factura hoy la baja queda **sin respuesta concluyente** |
| P6 (A-27) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Las cuotas no llevan descuento por volumen; si lo llevaran, constaría en la factura |
| P10 (A-23) | `entrevista-negocio-simulada.md` | Gestoría y Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Unificar a 30 días comerciales las dos vías, solo hacia delante y con confirmación escrita de la gestoría; hasta entonces, cada vía mantiene su fórmula |
| P13 (A-31) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Las fechas de alta y baja son inclusivas; definir por escrito «fecha de baja» (PD-07) |
| MH-15 | `memoria-historica.md` | Marga lanza la remesa el día 1 desde su ordenador | — | CÓDIGO / historia, **no es acta** |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica las anteriores |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). Las anomalías A-23, A-04, A-27 y A-31 siguen **PENDIENTE** en el registro; A-03 y A-70 son BUG A SECAS; A-71 y A-65 son ACCIDENTALES. Mientras no firme Administración (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cada mes se factura una cuota por cada contrato vigente (Priority: P1)

El día 1 de cada mes, Administración lanza la remesa del mes que acaba de terminar (`node scripts/remesa_mensual.js 2026-06`). El sistema recorre los contratos **vigentes en ese mes** y genera una factura por contrato, con una sola línea, fechada el último día del mes.

**Why this priority**: es el camino que emite las facturas recurrentes (en la semilla, 3 de cada mes) sin teclearlas.

**Independent Test**: lanzar la remesa de febrero de 2026 sobre la semilla. Tests: `remesa.test.js` «qué contratos entran (RN-19)»; golden G11.

**Acceptance Scenarios**:

1. **Given** los contratos de la semilla, **When** se lanza la remesa de 2026-02, **Then** se facturan los contratos 1, 2 y 4 (el 3 está de baja desde 2025-09-15) en las facturas FA-2026-000109 (108,90 €), FA-2026-000110 (175,45 €) y FA-2026-000111 (54,45 €), con fecha 2026-02-28. Test: «RN-19: febrero de 2026»; golden G11.
2. **Given** esos contratos, **When** se lanza la remesa de 2025-09, **Then** el contrato 3 entra (baja el 15-sep: 15 días de 30 → 30,00 €). Test: «RN-19/RN-20: septiembre de 2025».
3. **Given** el contrato 3, **When** se lanzan las remesas de 2025-10, 2025-05 y 2025-06, **Then** no entra en octubre (ya de baja) ni en mayo (aún sin alta) y sí en junio (16→30 = 15 días). Tests: «el contrato 3 entra en el mes de su baja», «no entra antes de su alta».
4. **Given** que no hay contratos vigentes, **When** se lanza, **Then** muestra «No hay contratos que facturar en <mes>», sale con código 0 y no crea facturas ni contadores. Test: «sin contratos vigentes».
5. **Given** dos contratos del mismo cliente, **When** se lanza, **Then** salen dos facturas (una por contrato). Test: «dos contratos del mismo cliente → dos facturas».

---

### User Story 2 - El importe es la cuota por los días de servicio sobre los días reales del mes (Priority: P1)

A un contrato que está vigente todo el mes se le factura la cuota entera. Si el alta o la baja caen dentro del mes, el sistema prorratea con los **días reales del mes** (28, 29, 30 o 31), no con 30: cuota / días del mes × días de servicio. Esto difiere de la pantalla de baja (spec 006) y es la anomalía A-23.

**Why this priority**: define el importe de cada cuota parcial; difiere hasta en 3 € del otro camino.

**Independent Test**: lanzar remesas con altas y bajas en distintos días y meses. Tests: «fronteras de alta y baja», «meses de 30, 31 y 29 días»; golden G11.

**Acceptance Scenarios**:

1. **Given** el contrato 4 (90 €, alta 2026-02-15), **When** se lanza febrero (28 días), **Then** son 14 días de 28 = 45,00 € (con 30 días serían 42,00 €). Tests: «RN-20: alta el 15 → 14 días de 28 = 45,00»; golden G11.
2. **Given** un contrato de 90 € con alta el 16-jul, **When** se lanza julio (31 días), **Then** son 16 de 31 = 46,45 € (con 30 días, 48,00 €); alta el 31-jul de 100 € → 3,23 €. Test: «julio (31 días)».
3. **Given** el contrato 2 (145 €, alta 2023-01-15), **When** se lanza enero de 2023, **Then** 17 días de 31 = 79,52 €. Test: «RN-20: contrato 2 … en enero de 2023».
4. **Given** febrero bisiesto de 2024, **When** se lanza, **Then** el mes completo es 90,00 € y un alta el día 15 vale 15/29 = 46,55 €. Test: «febrero bisiesto 2024».
5. **Given** abril (30 días), **When** hay un alta el 16, **Then** 15/30 = 45,00 €. Test: «abril (30 días)».
6. **Given** una baja el 15-mar-2026 de 145 € (31 días), **When** se lanza marzo, **Then** son 15/31 = 70,16 € (la pantalla de baja da 72,50 €). Test: «RN-18/RN-26».

---

### User Story 3 - El día de alta o de baja cuenta como día de servicio (Priority: P2)

Las fechas de alta y de baja son **inclusivas**: el contrato presta servicio en ambos días. Un alta el último día del mes factura 1 día; una baja el día 1 factura 1 día; una baja el último día cobra el mes completo (A-31).

**Why this priority**: cambia el importe de las cuotas parciales y el significado de «fecha de baja», que no está definido por escrito (PD-07).

**Independent Test**: lanzar febrero con altas y bajas en el primer y último día. Tests: «fronteras de alta y baja dentro del mes».

**Acceptance Scenarios**:

1. **Given** un alta el día 1, **When** se lanza febrero, **Then** mes completo: 90,00 € con sufijo «(febrero 2026)». Test: «alta el día 1».
2. **Given** un alta el 28 de febrero, **When** se lanza, **Then** 1 día = 90/28 = 3,21 € con sufijo «(1 dias)». Un alta el 1 de marzo no entra. Test: «A-31 alta el último día».
3. **Given** una baja el 28 de febrero (60 €), **When** se lanza, **Then** mes completo (60,00 €); una baja el 27 → 27/28 = 57,86 €. Test: «baja el último día».
4. **Given** una baja el día 1, **When** se lanza, **Then** 1 día (3,21 €); una baja el 31 de enero no entra en febrero. Test: «A-31 baja el día 1».
5. **Given** alta y baja el mismo día, **When** se lanza, **Then** 1 día (3,21 €). Test: «alta y baja el mismo día».

---

### User Story 4 - La factura generada tiene una forma fija (Priority: P1)

Cada factura de la remesa lleva una sola línea de cantidad 1, el IVA del contrato, el recargo del cliente si lo tiene, estado «emitida», fecha = último día del mes y vencimiento = fecha + días de pago del cliente (30 si no tiene). La descripción lleva el concepto más « (N dias)» si se prorratea o « (mes AAAA)» si no, y la observación es «Remesa <mes> <año>».

**Why this priority**: es lo que ve el cliente y lo que lee la gestoría; fija la fecha de declaración (último día del mes).

**Independent Test**: lanzar la remesa y comparar las facturas. Tests: «forma de la factura (RN-22, RN-23)».

**Acceptance Scenarios**:

1. **Given** un cliente sin plazo, **When** se lanza una remesa, **Then** la factura tiene una línea de cantidad 1, estado «emitida», fecha = último día del mes y vencimiento = +30. Test: «RN-22/RN-23».
2. **Given** un cliente a 60 días, **When** se lanza la de diciembre de 2026, **Then** vence el 2027-03-01 (2026-12-31 + 60). Test: «RN-23: vencimiento con los días de pago del cliente (60)».
3. **Given** un cliente con recargo (cliente 2, base 100, IVA 21 %), **When** se lanza, **Then** el recargo es 5,20 €. Test: «RN-03 en la remesa».
4. **Given** una remesa de mayo y un cliente sin plazo, **When** se lanza, **Then** la fecha es 2026-05-31 y el vencimiento 2026-06-30; la observación «Remesa mayo 2026». Test: `remesa.test.js` «contradicción 02» (rama remesa).
5. **Given** las facturas de una remesa, **When** se numeran, **Then** son correlativas en el orden de los contratos y todas llevan la misma observación. Test: «las facturas se numeran correlativamente».

---

### User Story 5 - La remesa no impide errores de proceso (Priority: P1)

La remesa **no comprueba** si un contrato ya se facturó ese mes: lanzarla dos veces duplica las facturas (A-03). Tampoco mira si el cliente está de baja (A-05) ni si la baja del contrato ya se facturó a mano con la pantalla de baja (A-04). Si falla a mitad, el proceso termina con error sin deshacer lo ya emitido (RN-24). Esta spec lo **documenta tal cual**.

**Why this priority**: son los riesgos que más dinero y trabajo de rectificación han causado (FA-2026-000106 fue una «cuota duplicada», rectificada con RE-2026-000001).

**Independent Test**: lanzar la remesa dos veces y tras una baja. Tests: «remesa: anomalías».

**Acceptance Scenarios**:

1. **Given** un contrato de 90 €, **When** se lanza la remesa de julio dos veces, **Then** salen dos facturas idénticas FA-2026-000109 y FA-2026-000110 de 108,90 €. Test: «A-03».
2. **Given** el contrato 2 dado de baja el 15-mar con la pantalla (que informa 72,50 € para facturar a mano), **When** se lanza la remesa de marzo, **Then** el contrato entra igualmente y factura 15/31 = 70,16 € (total 84,89 €): el mes de la baja se cobra dos veces. Test: «A-04».
3. **Given** un cliente con `activo = 0`, **When** se lanza, **Then** se le factura igualmente (108,90 €). Test: «A-05 / contradicción 08».
4. **Given** una cuota cero o negativa, **When** se lanza, **Then** se factura tal cual. Test: «cuota cero y cuota negativa».
5. **Given** un cliente con plazo 0, **When** se lanza, **Then** vence a los 30 días; con −5 días, el vencimiento es anterior a la fecha. Test: «A-36 un cliente con plazo de pago 0».

---

### User Story 6 - Una cuota grande recibe descuento sin dejar rastro (Priority: P3)

La remesa usa el mismo cálculo de factura que el alta manual, así que una cuota de más de 1.000 € recibe el descuento por volumen, y el recargo del cliente, pero la factura **no lleva la leyenda** «Descuento volumen» (A-27). No hay ninguna cuota real así (la máxima es 145 €).

**Why this priority**: sin caso real, pero la modernización debe saber que el descuento se aplica y no consta.

**Independent Test**: lanzar remesas con cuotas de 999,99, 1.000,00, 1.000,01, 1.500 y 5.000,01 €. Tests: «remesa: descuento por volumen (RN-25, A-27)».

**Acceptance Scenarios**:

1. **Given** cuotas de 999,99, 1.000,00 y 1.000,01 €, **When** se lanza julio, **Then** los precios son 999,99, 1.000,00 y 980,01 €. Test: «frontera de 1.000 €».
2. **Given** una cuota de 1.500 €, **When** se lanza, **Then** el precio es 1.470,00 €, el total 1.778,70 € y las observaciones solo dicen «Remesa julio 2026». Test: «A-27 una cuota de 1.500 €».
3. **Given** una cuota de 5.000,01 € y otra de 1.500 € con recargo, **When** se lanza, **Then** 4.750,01 € (5 %) y 1.470,00 € con recargo 76,44 € (total 1.855,14 €). Test: «A-27 con 5.000,01 €».
4. **Given** el golden G12 (remesa de diciembre con una cuota de 1.500 € con recargo), **When** se ejecuta, **Then** la factura FA-2027-000002 de Ferretería El Tornillo es de 1.855,14 €. Golden G12.

---

### User Story 7 - Argumentos y meses raros se aceptan o fallan sin avisar (Priority: P3)

El único control del argumento es el formato `AAAA-MM`; un mes 13 o 00 se acepta y genera facturas con fechas imposibles y textos «undefined» (A-70). Un argumento incorrecto muestra el uso y sale con código 1, pero deja un fichero de BD vacío en la carpeta de ejecución (A-71). `diasDelMes` con mes 14 devuelve 28 y con texto NaN (A-65).

**Why this priority**: la modernización necesita saber qué hace el script ante errores de tecleo (A-42, spec 008, los comparte).

**Independent Test**: lanzar la remesa con argumentos atípicos. Tests: «A-42 / A-70 el mes 13», «formato del argumento», «A-71»; `util.test.js` «diasDelMes».

**Acceptance Scenarios**:

1. **Given** el argumento 2026-13, **When** se lanza, **Then** se generan 3 facturas con fecha 2026-13-31, vencimiento «NaN-NaN-NaN», observación «Remesa undefined 2026» y descripciones «(undefined 2026)». Test: «A-42 / A-70 el mes 13».
2. **Given** el argumento 2026-00, **When** se lanza, **Then** se generan 2 facturas con fecha 2026-00-31. Test: «A-42 el mes 00».
3. **Given** los argumentos «2026-5», «2026-05-01», «junio», «26-05» o ninguno, **When** se lanza, **Then** muestra «Uso: node scripts/remesa_mensual.js YYYY-MM» y sale con código 1. Test: «formato del argumento».
4. **Given** el argumento «mal», **When** se lanza, **Then** sale con código 1 y deja un `datos/gesfact.db` de 0 bytes en el directorio de ejecución. Test: «A-71».
5. **Given** `diasDelMes`, **When** se pide febrero 2024, 2026, 1900, 2100 y 2000, **Then** 29, 28, 28, 28 y 29; mes 13 y 00 → 31; mes 14 → 28; texto → NaN. Tests: `util.test.js` «diasDelMes (RN-54)» (cinco).

---

### Edge Cases

- **La remesa de diciembre lanzada en enero** lleva fecha 2026-12-31 y numera con el año nuevo (A-10, spec 003): FA-2027-000001 a 000003 (108,90, 175,45 y 108,90 €). Test: «A-10 / contradicción 05»; golden G12.
- **La misma remesa lanzada dentro del año** (30-dic-2026) numera con 2026. Test: «A-10: la misma remesa lanzada dentro del año».
- **Baja anterior al alta** (A-30, spec 006): línea con −9 días, importe −28,93 € y factura negativa de −35,01 €. Test: «A-30 baja anterior al alta».
- **Alta 15 y baja 20 de febrero**: 6 días de 28 = 19,29 € en la remesa (60,00 € en la pantalla de baja). Test: «A-30 alta 15 y baja 20».
- **Fallo a mitad**: ante cualquier error de BD el script escribe el error y sale con código 1, sin deshacer las facturas ya emitidas (RN-24). *Sin test del fallo a mitad.*
- **Plazo por defecto propio**: la remesa lleva su propio literal 30 y no lee la configuración (A-38, spec 004). Test: «A-38 … el plazo por defecto de la remesa es un 30 propio».
- **Contratos con baja a fin de mes**: baja el último día → mes completo (RN-21).
- **El script se ejecuta con `node scripts/remesa_mensual.js`** desde el ordenador de Marga el día 1 (MH-15, historia).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-19)*: El sistema MUST incluir en la remesa los contratos con `fecha_alta <= último día del mes` y (`fecha_baja` vacía o `fecha_baja >= día 1`), con ambos límites inclusivos. No comprueba que el cliente esté activo. Evidencia: `scripts/remesa_mensual.js:26-29`. Ejemplo: remesa 2026-02 → contratos 1, 2 y 4; no el 3 (baja 2025-09-15). Test: «RN-19» (cuatro); golden G11.
- **FR-002** *(RN-20)*: El sistema MUST calcular el importe como cuota / **días reales del mes** × días de servicio, redondeado a 2 decimales, con `desde = max(alta, día 1)`, `hasta = min(baja, último día)` y días de servicio = día de `hasta` − día de `desde` + 1. Evidencia: `scripts/remesa_mensual.js:45-51`. Ejemplos: 90 € alta 2026-02-15, febrero → 14/28 = 45,00; 90 € alta 16-jul → 46,45; contrato 3 (60 €, baja 2025-09-15) → 30,00. Test: «RN-20» (varios); golden G11.
- **FR-003** *(RN-21, A-31)*: El sistema MUST contar el día de alta y el día de baja como días de servicio: alta el día 1 → mes completo; alta el último día → 1 día; baja el último día → mes completo; baja el día 1 → 1 día. Ejemplo: 60 € baja 28-feb → 60,00; baja 27-feb → 57,86. Evidencia: `scripts/remesa_mensual.js:45-50`. Test: «fronteras de alta y baja» (seis).
- **FR-004** *(RN-22)*: El sistema MUST generar **una factura por contrato**, con **una línea** de cantidad 1, precio = importe del mes y el IVA del contrato; la descripción es el concepto más « (N dias)» si los días de servicio son menos que los del mes, o « (<mes> <año>)» si no. Evidencia: `scripts/remesa_mensual.js:53-55`, `:80-84`. Ejemplo: FA-2026-000108, 1 × 90,00 al 21 %. Test: «RN-22/RN-23».
- **FR-005** *(RN-23)*: El sistema MUST fechar la factura el último día del mes, calcular el vencimiento como fecha + `dias_pago` del cliente (o un literal 30 propio si está vacío o es 0) y poner en observaciones «Remesa <mes> <año>». Evidencia: `scripts/remesa_mensual.js:59-62`. Ejemplo: mayo, cliente sin plazo → 2026-05-31 → 2026-06-30. Test: «RN-23»; «A-36»; «contradicción 02».
- **FR-006** *(RN-22)*: El sistema MUST aplicar a la línea el mismo cálculo de factura que el alta manual (spec 001): IVA del contrato, recargo del cliente si lo tiene y redondeo por línea. Evidencia: `scripts/remesa_mensual.js:55`. Test: «RN-03 en la remesa».
- **FR-007** *(RN-22)*: El sistema MUST numerar cada factura con la serie FA y el año del reloj (spec 003), en el orden en que la BD devuelve los contratos. Evidencia: `scripts/remesa_mensual.js:57`. Test: «las facturas se numeran correlativamente».
- **FR-008** *(RN-24, A-03, A-05)*: El sistema MUST NOT comprobar que el contrato ya se facturó en el mes ni que el cliente esté activo. Un fallo de BD en cualquier paso MUST escribir el error y terminar con código 1 sin deshacer lo ya emitido. Evidencia: `scripts/remesa_mensual.js:58, 64, 70`. Test: «A-03»; «A-05 / contradicción 08». *Sin test del fallo a mitad.*
- **FR-009** *(RN-24)*: El sistema MUST facturar tal cual las cuotas cero y negativas. Test: «cuota cero y cuota negativa».
- **FR-010** *(RN-25, A-27)*: Cuando la cuota supera 1.000 €, el sistema MUST aplicar el descuento por volumen (spec 002) y el recargo del cliente, **sin** añadir leyenda de descuento a las observaciones. Evidencia: `scripts/remesa_mensual.js:54-55, 62`. Ejemplo: 1.500 € → 1.470,00, total 1.778,70 (sin caso real: cuota máxima 145 €). Test: «remesa: descuento por volumen».
- **FR-011** *(RN-26, A-23)*: El sistema MUST usar para la baja a mitad de mes la fórmula de días reales aunque la pantalla de baja (spec 006) use 30 días. Ejemplo: 90 €, del 16 al 31 de julio → 46,45 (remesa) frente a 48,00 (pantalla). Evidencia: `scripts/remesa_mensual.js:47-51`. Test: `remesa.test.js` «contradicción 01» (siete casos).
- **FR-012** *(A-04)*: El mes de la baja MUST poder facturarse dos veces: una vez a mano con el importe de la pantalla de baja y otra por la remesa de ese mes. Test: «A-04».
- **FR-013** *(A-70)*: Con un mes inexistente (13 o 00) la remesa MUST continuar y generar facturas con fecha `AAAA-13-31`, vencimiento `NaN-NaN-NaN` y el texto «undefined» en observación y descripción. Evidencia: `scripts/remesa_mensual.js:15, 80-84`. Test: «A-42 / A-70» y «A-42 el mes 00».
- **FR-014** *(A-71)*: El script MUST cargar la BD antes de validar el argumento, de modo que un argumento incorrecto deja un `datos/gesfact.db` vacío en el directorio de ejecución, y MUST terminar con el mensaje de uso y código 1. Evidencia: `scripts/remesa_mensual.js:9, 14-18`. Test: «A-71»; «formato del argumento».
- **FR-015** *(RN-54, A-65)*: `diasDelMes` MUST devolver los días del calendario (2024-02 → 29; 2026-02 → 28; 1900-02 → 28), 31 para mes 13 o 00, 28 para mes 14 y NaN para un texto. Evidencia: `lib/util.js:36-39`. Test: `util.test.js` «diasDelMes (RN-54)» (cinco).
- **FR-016** *(A-10, referencia)*: Una remesa de diciembre lanzada en enero MUST llevar fecha 2026-12-31 y números del año nuevo. Test: «A-10 / contradicción 05»; golden G12.

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-23 | Dos fórmulas de prorrateo (esta usa días reales) | PENDIENTE | TC las dos | FR-002, FR-011 | «contradicción 01» (siete) |
| A-04 | Mes de la baja facturado dos veces | PENDIENTE | TC | FR-012 | «A-04» |
| A-27 | Descuento sin constancia | PENDIENTE | TC | FR-010 | «A-27» (dos) |
| A-31 | Un día de alta o baja factura un día | PENDIENTE | TC | FR-003 | «A-31» (tres) |
| A-03 | Remesa no idempotente ni reanudable | BUG A SECAS | Corregir hacia delante; no retroactiva | FR-008 | «A-03» |
| A-70 | Mes inexistente → «undefined» y `NaN-NaN-NaN` | BUG A SECAS | TC; corregir | FR-013 | «A-42 / A-70» |
| A-71 | Argumento erróneo deja `gesfact.db` vacío | ACCIDENTAL | TC | FR-014 | «A-71» |
| A-65 | `diasDelMes` mes 14 → 28; texto → `NaN` | ACCIDENTAL | TC | FR-015 | «A-65» |

TC = especificar tal cual. Las correcciones corresponden a la modernización, solo hacia delante y por decisión escrita del negocio. Contrato 4: A-23 supone **+3,00 € de base** (+3,63 € con IVA) respecto a la convención de 30 días.

**Por referencia**: A-10 (remesa de diciembre lanzada en enero; spec 003, FR-016) y A-05 (cliente de baja; spec 009, FR-008).

### Key Entities *(include if feature involves data)*

- **Contrato**: cliente, concepto, cuota mensual, tipo de IVA, fecha de alta y fecha de baja.
- **Remesa**: lote de facturas de un mes (`AAAA-MM`), una por contrato vigente.
- **Factura de remesa**: una línea de cantidad 1, fecha = último día del mes, observación «Remesa <mes> <año>».
- **Periodo de servicio**: de `max(alta, día 1)` a `min(baja, último día)`, inclusivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los golden master G11 (febrero con la semilla: 108,90, 175,45 y 54,45 €) y G12 (diciembre lanzada en enero) pasan (`npm test`).
- **SC-002**: Las 8 anomalías de esta spec (A-03, A-04, A-23, A-27, A-31, A-65, A-70, A-71) tienen al menos un test que congela su comportamiento actual; el fallo a mitad (RN-24) queda señalado como «sin test».
- **SC-003**: Los 48 tests de `test/remesa.test.js` (41 escritos y 7 generados por la contradicción 01) respaldan los 16 requisitos; ninguno requiere escribir código nuevo.
- **SC-004**: Los importes de ejemplo (45,00; 46,45; 79,52; 57,86; 3,21; 19,29; 70,16; 3,23) se reproducen al céntimo.
- **SC-005**: Un revisor de Administración puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- La convención de 30 días y la pantalla de baja: **spec 006**.
- Cálculo del importe de línea, IVA y recargo: **spec 001**. El descuento (política): **spec 002**.
- Formato y año del número: **spec 003**.
- Política de clientes de baja (A-05): **spec 009**.
- Validación de periodos de informes (A-42 en informes): **spec 008**.
- Alta y validación de contratos (A-06, A-53): **spec 009**.

## Assumptions

- **SUPOSICIÓN**: la remesa se lanza el día 1 desde el ordenador de Marga (MH-15, historia, no acta); el responsable actual no está identificado.
- **SUPOSICIÓN**: el script se lanza a mano y una vez al mes; no hay planificador ni control de que no se lance dos veces (A-03).
- La remesa fue añadida por Roberto (becario) en 2021 (comentario del script, CÓDIGO).
- Los ejemplos con contratos proceden de la semilla de `db.js` y de los tests; `datos/gesfact.db` puede ser una copia de esa semilla (A-18).
- Dependencia de otras specs: usa 001 (importes), 002 (descuento), 003 (número), 004 (plazo) y 006 (convención de 30 días, para comparar).
