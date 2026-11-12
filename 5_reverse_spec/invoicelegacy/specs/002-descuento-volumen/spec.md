# Feature Specification: Descuento por volumen

**Feature Branch**: `002-descuento-volumen`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Descuento por volumen. Alcance: tramos, fronteras, base de decisión y reparto del descuento por línea, y la constancia escrita en la factura. Política comercial de Gerencia. RN: RN-07, RN-08, RN-09, RN-10, RN-11. Anomalías: A-07, A-24, A-25, A-26, A-28, A-67, A-69. Dueño natural: Gerencia, con la Gestoría para el desglose."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del descuento por volumen de GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
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
| P7 (A-07) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | 5.000,00 € exactos llevan el 2 %: se mantiene el `>`; el comentario «a partir de» (`services/calculo.js:37`) es el que está mal |
| P8 (A-26) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | El descuento se aplica a todos los clientes, como hoy; quién es «Paco» queda **sin respuesta concluyente** |
| P9 (A-25) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | El tramo se decide con la base antes del descuento |
| P11 (A-28) | `entrevista-negocio-simulada.md` | Administración, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Se mantiene el reparto del descuento en el precio unitario |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica las anteriores; A-69: se mantiene la regla `>`, FA-2026-000103 se documenta sin especificar |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). Las anomalías A-07, A-25, A-26, A-28 y A-69 siguen **PENDIENTE** en el registro. Mientras no firmen Gerencia y la gestoría (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Una factura grande recibe su descuento y una pequeña no (Priority: P1)

Cuando la base de una factura supera 1.000,00 € se le aplica un 2 % de descuento; cuando supera 5.000,00 €, un 5 %. Los límites son **estrictos**: la cifra exacta no cambia de tramo. El 1.000,00 € exacto no descuenta (regla protegida, A-24) y el 5.000,00 € exacto sigue en el 2 % (A-07).

**Why this priority**: es la política comercial que decide cuánto se cobra en las facturas grandes y la única con una frontera comentada con la gestoría (`db.js:138`). Una frontera mal puesta cambia el importe de una factura al céntimo.

**Independent Test**: calcular facturas de una sola línea con bases justo por debajo, exactas y justo por encima de cada umbral. Tests: `porcentajeDescuento` y `calcularFactura` en `test/calculo.test.js`; golden master G04 a G07.

**Acceptance Scenarios**:

1. **Given** una línea de 999,99 € al 21 %, **When** se calcula la factura, **Then** no hay descuento: base 999,99 €, IVA 210,00 €, total 1.209,99 €. Test: «RN-07: 1.000,00 / 1.000,01 / 999,99».
2. **Given** una línea de 1.000,00 € exactos al 21 %, **When** se calcula, **Then** **no** hay descuento: base 1.000,00 €, IVA 210,00 €, total 1.210,00 €. Test: «A-24 una base de 1.000,00 € exactos no lleva descuento»; golden G04.
3. **Given** una línea de 1.000,01 € al 21 %, **When** se calcula, **Then** el descuento es del 2 %: el precio pasa a 980,01 €, el IVA a 205,80 € y el total a 1.185,81 €. Test: «RN-07»; golden G05.
4. **Given** una línea de 5.000,00 € exactos, **When** se calcula, **Then** el descuento es del **2 %** y no del 5 %: precio 4.900,00 €, base 4.900,00 €, IVA 1.029,00 €, total 5.929,00 €. Test: «A-07 una base de 5.000,00 € exactos lleva el 2 %»; golden G06.
5. **Given** una línea de 5.000,01 €, **When** se calcula, **Then** el descuento es del 5 %: precio 4.750,01 €, IVA 997,50 €, total 5.747,51 €. Test: «A-07» (rama «encima»); golden G07.
6. **Given** una línea de 4.999,99 €, **When** se calcula, **Then** el descuento es del 2 %: base 4.899,99 €. Test: «A-07» (rama «debajo»).

---

### User Story 2 - El tramo se decide con lo que suman las líneas antes de descontar (Priority: P1)

El sistema suma primero la base de todas las líneas **sin descuento** (la «base bruta») y con esa cifra elige el tramo. Después aplica el descuento. Por eso una factura puede acabar con una base final por debajo del umbral que la hizo descontar (A-25).

**Why this priority**: explica por qué una factura de 1.000,00 € de base final puede llevar descuento y otra idéntica no. Es la regla que más preguntas genera en la gestoría.

**Independent Test**: facturas cuya base bruta cae a un lado del umbral y cuya base final cae al otro. Tests: `calcularFactura` «RN-08» y «A-25»; golden G08.

**Acceptance Scenarios**:

1. **Given** una línea de 1.020,41 €, **When** se calcula, **Then** el tramo es el 2 %, el precio queda en 1.000,00 € y la base final es 1.000,00 € con `descuentoPct = 2`; IVA 210,00 €, total 1.210,00 €. Test: «RN-08: 1.020,41 € brutos → 2 %»; golden G08.
2. **Given** el mismo caso con un cliente con recargo de equivalencia, **When** se calcula, **Then** el recargo es 52,00 € y el total 1.262,00 €. Test: «RN-08» (tercera aserción); golden G08.
3. **Given** una línea de 1.020,40 €, **When** se calcula, **Then** el tramo sigue siendo el 2 % y la base final queda en 999,99 €, **por debajo** del umbral. Test: «RN-08» (segunda aserción).
4. **Given** tres líneas de 333,33 €, 333,33 € y 333,34 € (suma 1.000,00 €), **When** se calcula, **Then** no hay descuento: el tramo se decide con la **suma**, no con cada línea. Test: «RN-07: el tramo se decide con la suma de varias líneas».

---

### User Story 3 - El descuento se reparte en el precio de cada línea (Priority: P2)

El descuento no se resta del total: se aplica al **precio unitario** de cada línea (precio × (100 − %) / 100, redondeado a céntimos) y la línea se recalcula. Así, la gestoría ve el descuento desglosado en cada línea (petición de Puri, 2018, comentario de `services/calculo.js`: CÓDIGO). El precio que se guarda en la línea es el ya descontado.

**Why this priority**: determina el importe exacto de cada línea y de la cabecera. Afecta al céntimo y es visible en la factura impresa.

**Independent Test**: facturas con varias líneas y descuento; comparar precios, bases y cabecera. Tests: `calcularFactura` «RN-09» (dos), «A-28».

**Acceptance Scenarios**:

1. **Given** dos líneas, 1 × 1.000,50 € y 3 × 0,25 €, **When** se calcula, **Then** los precios con descuento son 980,49 € y 0,25 € (el descuento de la segunda **se pierde por redondeo**) y la base es 981,24 €; si se descontara sobre el total saldrían 981,23 €. Test: «RN-09: líneas 1 × 1.000,50 y 3 × 0,25».
2. **Given** 3 × 2.000 € y 1 × 0,01 € con cliente con recargo, **When** se calcula, **Then** el tramo es el 5 %, los precios guardados son 1.900,00 € y 0,01 €, y la cabecera es base 5.700,01 €, IVA 1.197,00 €, recargo 296,40 €, total 7.193,41 €. Test: «RN-09: el precio guardado en cada línea es el precio ya descontado».
3. **Given** las cinco líneas de FA-2026-000105, **When** se calculan con el código actual, **Then** el resultado es base 2.288,68 €, IVA 332,22 €, total 2.620,90 € con `descuentoPct = 2`, **distinto** de lo grabado en la BD (base 2.287,75 €, IVA 468,63 €, total 2.756,38 €, con las líneas sin descuento). La factura grabada **no se reproduce** y se documenta sin especificar (A-28, H-04). Test: «A-28 el descuento rebaja el precio unitario de cada línea».

---

### User Story 4 - El descuento no distingue cliente ni concepto y queda anotado (Priority: P2)

El descuento se aplica a cualquier cliente, sector o concepto (incluidos «Portes» o alquileres). En el alta manual, la factura lleva la leyenda « Descuento volumen N% aplicado» (con un espacio delante) al final de las observaciones.

**Why this priority**: el comentario original habla de «fidelizar hostelería», pero el código no lo comprueba (A-26). La leyenda es la única constancia escrita del descuento.

**Independent Test**: calcular la misma factura para clientes con y sin recargo y dar de alta una factura con y sin observaciones propias. Tests: `calcularFactura` «RN-10 / RN-25», «A-26»; `rutas.test.js` «RN-11»; golden G05.

**Acceptance Scenarios**:

1. **Given** una línea de 1.500 € al 21 % de un cliente sin recargo, **When** se calcula, **Then** el precio es 1.470,00 €, el IVA 308,70 € y el total 1.778,70 €. Con recargo: recargo 76,44 € y total 1.855,14 €. Test: «RN-10 / RN-25».
2. **Given** líneas de 1.500 € de concepto «Vasos», «Tornillos» o «Portes», **When** se calculan, **Then** todas reciben el 2 %. Test: «A-26».
3. **Given** un alta manual con descuento y **sin** observaciones propias, **When** se graba, **Then** las observaciones valen « Descuento volumen 2% aplicado» (con espacio inicial). Test: `rutas.test.js` «RN-11» (FA-2026-000117).
4. **Given** un alta manual con descuento y observaciones «Pedido X», **When** se graba, **Then** las observaciones valen «Pedido X Descuento volumen 2% aplicado». Test: «RN-11» (FA-2026-000118); golden G05 («con y sin observaciones propias»).

---

### User Story 5 - Una línea inválida anula el descuento de todo el pedido (Priority: P3)

Si una sola línea no tiene valor numérico, la base bruta pasa a ser no numérica, el tramo cae a 0 % y **ninguna** línea recibe descuento, aunque el resto sume más de 1.000,00 € (A-67). Esta spec lo documenta tal cual.

**Why this priority**: es un efecto colateral del cálculo (ACCIDENTAL), sin caso real, pero la modernización necesita saber que hoy ocurre.

**Independent Test**: calcular una factura con una línea no numérica y otra de 2.000 €. Test: `calcularFactura` «A-67».

**Acceptance Scenarios**:

1. **Given** una línea de 2.000 € y otra con cantidad no numérica, **When** se calcula, **Then** `descuentoPct` es 0, la primera línea mantiene su precio de 2.000 € y el total no tiene valor numérico. Test: «A-67».
2. **Given** solo la línea de 2.000 €, **When** se calcula, **Then** `descuentoPct` es 2. Test: «A-67» (contraste).

---

### Edge Cases

- **Comparación sin redondeo**: 999,999 → 0 %; 1000,0000001 → 2 %; 5000,001 → 5 %. Test: `porcentajeDescuento` «la comparación no redondea».
- **Cero, negativos y enormes**: 0 → 0 %; −1 → 0 %; 1.000.000 → 5 %. Test: «cero, negativos y valores enormes».
- **Valores no numéricos**: `NaN`, `null`, `undefined` → 0 %; los textos numéricos se comparan como números (`'1000.01'` → 2 %, `'5000.01'` → 5 %, `'1001'` → 2 %). Test: «vacíos, no numéricos y textos numéricos».
- **Líneas positivas y negativas**: se compensan **antes** de decidir el tramo (RN-12 en la spec 001). Test: `calcularFactura` «líneas negativas y positivas se compensan».
- **IVA mezclado 21/10/4 con recargo y descuento**: se descuenta el precio de cada línea y el recargo se calcula sobre la base ya descontada. Test: «IVA mezclado 21/10/4 con recargo y descuento».
- **El cálculo no modifica las líneas de entrada**: devuelve líneas nuevas con el precio descontado. Test: «no modifica las líneas de entrada».
- **Descuento sin leyenda en la remesa**: en el camino batch el descuento existe pero no deja leyenda (RN-25 y A-27, spec 007).
- **Factura grabada que no se reproduce (A-69)**: FA-2026-000103, que el código comenta como «1.000 justo, sin descuento», recalculada con sus líneas da 1.000,02 € brutos, 2 % de descuento y base 980,01 €.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-07, A-24, A-07)*: El sistema MUST decidir el porcentaje de descuento con la base bruta de la factura: **5 %** si es estrictamente mayor que 5.000, **2 %** si es estrictamente mayor que 1.000, **0 %** en el resto. 1.000,00 exactos no descuentan; 5.000,00 exactos descuentan el 2 %. Evidencia: `porcentajeDescuento`, `services/calculo.js:39-43` (comentario de origen: «acordado con Paco en 2018»). Test: `porcentajeDescuento` (todos); golden G04 a G07.
- **FR-002** *(RN-07)*: El sistema MUST comparar sin redondear: cualquier valor por encima del umbral, por pequeño que sea, cambia de tramo. Evidencia: `services/calculo.js:40-41`. Test: «fronteras con más decimales».
- **FR-003** *(RN-07, A-67)*: El sistema MUST devolver 0 % si la base bruta es cero, negativa o no numérica (`NaN`, `null`, `undefined`), y MUST tratar un texto numérico como el número que representa. Evidencia: `services/calculo.js:39-43`. Test: «cero, negativos y valores enormes»; «vacíos, no numéricos y textos numéricos».
- **FR-004** *(RN-08, A-25)*: El sistema MUST calcular la base bruta como la suma de las bases de todas las líneas **sin descuento**, redondeada a 2 decimales tras cada suma, y MUST decidir el tramo con ella, no con la base final. Evidencia: `calcularFactura`, `services/calculo.js:52-60`. Dato: 1.020,41 € brutos → 2 % → base final 1.000,00 €. Test: «RN-08»; «A-25»; golden G08.
- **FR-005** *(RN-09, A-28)*: El sistema MUST aplicar el descuento al **precio unitario** de cada línea (precio × (100 − %) / 100, redondeado a 2 decimales) y MUST recalcular la línea con ese precio. Cuando el porcentaje es 0 MUST dejar el precio de entrada. Evidencia: `services/calculo.js:62-71` (comentario: «peticion de Puri, 2018»). Test: «RN-09» (dos); «A-28».
- **FR-006** *(RN-09)*: El sistema MUST devolver en cada línea el precio ya descontado, y la cabecera MUST sumar las bases, IVA y recargo de esas líneas recalculadas. Evidencia: `services/calculo.js:72-86`. Test: «RN-09: el precio guardado en cada línea es el precio ya descontado».
- **FR-007** *(RN-09)*: El descuento por línea MUST poder perderse por redondeo (precio de 0,25 € con 2 % sigue en 0,25 €), de modo que la base de la factura puede diferir en un céntimo de «descontar sobre el total». Evidencia: `services/calculo.js:69`. Test: «RN-09: líneas 1 × 1.000,50 y 3 × 0,25» (981,24 € frente a 981,23 €).
- **FR-008** *(RN-10, A-26)*: El sistema MUST aplicar el descuento a cualquier cliente, con o sin recargo, y a cualquier concepto, sin consultar sector, artículo ni descripción. Evidencia: `calcularFactura` solo recibe las líneas y la marca de recargo del cliente. Test: «RN-10 / RN-25»; «A-26».
- **FR-009** *(RN-11)*: En el alta manual de factura, si el porcentaje es mayor que 0, el sistema MUST añadir a las observaciones el texto « Descuento volumen N% aplicado» con un espacio inicial, a continuación de las observaciones tecleadas (que pueden estar vacías). Con descuento 0 no añade nada. Evidencia: `routes/facturas.js:76`. Test: `rutas.test.js` «RN-11». Ejemplos: las facturas de prueba FA-2026-000117 y FA-2026-000118. La FA-2026-000105 de la BD lleva «Descuento volumen 2% aplicado» **sin** espacio inicial (`db.js:149`), porque es un dato de la semilla y no una factura generada por el código.
- **FR-010** *(A-67)*: Cuando alguna línea no tiene valor numérico, el sistema MUST dejar la base bruta sin valor numérico, el porcentaje en 0 y los precios de todas las líneas sin descontar. Evidencia: `services/calculo.js:52-71`. Test: «A-67».
- **FR-011** *(A-28, A-69)*: Las facturas grabadas FA-2026-000105 y FA-2026-000103 MUST NOT reproducirse con el código actual (se mantiene su estado grabado) y se documentan **sin especificar** (el negocio no ha dicho cuál de las dos versiones es la correcta). La regla que sí se especifica es el reparto en precio unitario (FR-005) y el `>` estricto (FR-001). Evidencia: `datos/gesfact.db`, `db.js:138`. Test: «A-28» (H-04) y «A-69».
- **FR-012** *(RN-12, límite con la spec 001)*: Los redondeos, el IVA y el recargo posteriores al descuento MUST seguir las reglas de la spec 001 sin excepción. Test: «IVA mezclado 21/10/4 con recargo y descuento».

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-07 | 5.000,00 € exactos → 2 % | PENDIENTE | TC | FR-001 | «A-07»; golden G06 |
| A-24 | 1.000,00 € exactos → sin descuento (protegida) | INTENCIONAL | TC | FR-001 | «A-24»; golden G04 |
| A-25 | El tramo se decide con la base bruta | PENDIENTE | TC | FR-004 | «A-25»; golden G08 |
| A-26 | Se aplica a cualquier cliente y concepto | PENDIENTE | TC | FR-008 | «A-26» |
| A-28 | Descuento en precio unitario; FA-2026-000105 no se reproduce (protegida) | PENDIENTE | TC la regla; DSE FA-2026-000105 | FR-005, FR-011 | «A-28» |
| A-67 | Una línea `NaN` anula el descuento del resto | ACCIDENTAL | TC | FR-010 | «A-67» |
| A-69 | FA-2026-000103 no se reproduce | PENDIENTE | DSE la factura; TC el `>` | FR-001, FR-011 | «A-69» |

TC = especificar tal cual. DSE = documentar sin especificar. Las correcciones corresponden a la modernización, solo hacia delante y por decisión escrita del negocio.

### Key Entities *(include if feature involves data)*

- **Tramo de descuento**: umbral exclusivo (1.000 €, 5.000 €) y porcentaje asociado (2 %, 5 %).
- **Base bruta**: suma de las bases de las líneas antes de descontar; es lo único que decide el tramo.
- **Línea de factura (a efectos de descuento)**: cantidad, precio de entrada y precio descontado, que es el que se guarda.
- **Observaciones de la factura**: texto libre al que se añade la leyenda del descuento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las fronteras documentadas (999,99; 1.000,00; 1.000,01; 4.999,99; 5.000,00; 5.000,01 y 1.020,41) el porcentaje y el total coinciden con los de esta spec.
- **SC-002**: Los cinco casos del golden master G04 a G08 cubren esta spec por completo y pasan (`npm test`).
- **SC-003**: Las 7 anomalías de esta spec (A-07, A-24, A-25, A-26, A-28, A-67, A-69) tienen al menos un test que congela su comportamiento actual.
- **SC-004**: Cada uno de los 12 requisitos funcionales se puede comprobar con al menos un test existente, sin escribir código nuevo.
- **SC-005**: Un revisor de Gerencia puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Redondeo, IVA, recargo y formato de importes: **spec 001** (aquí solo se fija el límite de FR-012).
- El descuento en las cuotas de la remesa, la ausencia de leyenda en ellas (RN-25, A-27): **spec 007**.
- Qué se imprime al reimprimir una factura con descuento (A-15): **spec 005**.
- Lectura de las cantidades y precios tecleados (A-06): **spec 004**.

## Assumptions

- **SUPOSICIÓN**: «Paco» es la persona que acordó los tramos en 2018 (comentario de `services/calculo.js`); su cargo y si sigue en la empresa quedan **sin respuesta concluyente** (P8).
- **SUPOSICIÓN**: la política de descuento es de Gerencia y el desglose por línea es de la gestoría (petición de Puri, 2018). Ambas fuentes son comentarios del código (CÓDIGO), no actas.
- Los ejemplos con número de factura proceden de `datos/gesfact.db`, que el registro (A-18) señala como posible copia de la semilla de `db.js` y no como histórico de producción. Si la BD real difiere, los datos de FA-2026-000103 y FA-2026-000105 pueden cambiar; las reglas no.
- Los resultados que dependen de coma flotante son los de Node.js con números de doble precisión; esta spec los trata como parte del contrato (Principio I).
- Dependencia de otras specs: usa el redondeo y el IVA de la spec 001. Las specs 005 y 007 la citan.
