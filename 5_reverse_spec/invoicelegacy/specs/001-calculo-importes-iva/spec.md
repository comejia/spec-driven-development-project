# Feature Specification: Cálculo de importes e IVA de una factura

**Feature Branch**: `001-calculo-importes-iva`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Cálculo de importes e IVA de una factura. Alcance: cómo se calcula base, IVA, recargo de equivalencia y total de cada línea y de la factura, con redondeo línea a línea; la tabla de recargos; y cómo se redondea y se muestra un importe. No incluye el descuento (002) ni de dónde vienen las líneas (004, 007). RN: RN-01, RN-02, RN-03, RN-04, RN-05, RN-06, RN-12, RN-13, RN-51, RN-52. Anomalías: A-02, A-29, A-39, A-34, A-45, A-62, A-63, A-73. Dueño natural: Gestoría."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo de importes e IVA de una factura. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
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
| P12 (A-02) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Se mantiene el redondeo tal cual; el hecho (¿lo exige el Contaplus?) queda **sin respuesta concluyente** |
| P18 (A-29) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Propone lista cerrada de tipos de IVA, solo hacia delante; el hecho queda sin respuesta concluyente |
| P21 (A-39) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Se conservan los recargos de tipos antiguos |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica las tres anteriores |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). Las anomalías A-02, A-29 y A-39 siguen **PENDIENTE** en el registro. Mientras no firme la gestoría (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La gestoría recibe importes que cuadran céntimo a céntimo (Priority: P1)

La gestoría cuadra cada factura en su contabilidad **línea a línea**. Por eso el sistema calcula la base, el IVA y el recargo de cada línea, redondea cada uno a céntimos en ese momento, y solo después los suma. Nunca calcula el IVA sobre el total de la factura.

**Why this priority**: es la regla más protegida del sistema. En mayo de 2019 un cambio a redondear sobre la base total hizo que la gestoría devolviera un trimestre entero (comentario de `services/calculo.js:1-7`, CÓDIGO; la Constitución, Principio I, la declara intocable).

**Independent Test**: calcular facturas de referencia y comprobar que cada importe coincide al céntimo con el valor esperado. Se verifica con `test/calculo.test.js` (`calcularLinea`, `calcularFactura`) y `test/util.test.js` (`redondear2`).

**Acceptance Scenarios**:

1. **Given** una línea de 0,44 cajas a 21,60 €, **When** se calcula, **Then** la base es 9,50 € (9,504 redondeado). Test: `calcularLinea` «RN-01: 0,44 cajas × 21,60 € = 9,504 → 9,50 €».
2. **Given** una línea de 20 × 28,90 € (base 578,00 €) al 21 %, **When** se calcula, **Then** el IVA es 121,38 € (línea real de FA-2026-000103, que coincide con la BD; la factura completa tiene otra línea que no se reproduce, A-69). Test: `calcularLinea` (cálculo de la línea; el dato de la BD se verificó ejecutando la función).
3. **Given** tres líneas de 0,12 € al 21 %, **When** se calcula la factura, **Then** el IVA es 0,09 € (0,03 € por línea) y **no** 0,08 € (lo que daría calcular sobre la base total de 0,36 €). Test: `calcularFactura` «RN-02: tres líneas de 0,12 €».
4. **Given** las líneas de FA-2026-000102 (cliente con recargo), **When** se calcula, **Then** el IVA es 24,28 € (15,54 + 6,07 + 2,27 + 0,40) y el recargo 6,01 € (3,85 + 1,50 + 0,56 + 0,10), que coinciden con lo grabado; la base calculada es 115,62 € y el total 145,91 €, mientras la cabecera grabada dice 115,60 € y 145,89 € (la línea «Portes» grabada es 1,90 y el código da 1,92: H-02, se trata en la spec 005 como A-32). Test: `calcularFactura` «RN-05/RN-06: FA-2026-000102».
5. **Given** las líneas de FA-2026-000104 (cliente con recargo, IVA 4 %), **When** se calcula, **Then** base 152,30 €, IVA 6,09 €, recargo 0,76 € y total 159,15 €, idénticos a la cabecera grabada. Test: `calcularFactura` «RN-04: FA-2026-000104 reproduce exactamente la cabecera grabada».

---

### User Story 2 - Un cliente con recargo de equivalencia paga el recargo correcto (Priority: P1)

A los clientes marcados con recargo de equivalencia se les suma, en cada línea, un recargo que depende del tipo de IVA de esa línea (5,2 % para el 21 %, 1,4 % para el 10 %, 0,5 % para el 4 %). Los demás clientes no pagan recargo.

**Why this priority**: afecta a las facturas de los clientes 2 y 4 de la BD y a lo que declara la gestoría. Está respaldado por datos reales.

**Independent Test**: calcular líneas con y sin marca de recargo y comprobar el recargo por tipo. Test: `recargoPara` y `calcularLinea` en `test/calculo.test.js`.

**Acceptance Scenarios**:

1. **Given** una línea de base 74,00 € al 21 % de un cliente con recargo, **When** se calcula, **Then** IVA 15,54 € y recargo 3,85 € (74 × 5,2 % = 3,848). Test: «RN-03: base 74,00 al 21 % con recargo».
2. **Given** una línea de base 113,60 € al 4 % de un cliente con recargo, **When** se calcula, **Then** el recargo es 0,57 € (FA-2026-000104). Test: «RN-04: FA-2026-000104 reproduce exactamente la cabecera».
3. **Given** el mismo cliente **sin** marca de recargo, **When** se calcula cualquier línea, **Then** el recargo es 0,00 € aunque el tipo tenga recargo. Test: «sin marca de recargo el recargo es 0».

---

### User Story 3 - El total de la factura es la suma de las líneas ya redondeadas (Priority: P2)

La base, el IVA y el recargo de la factura son la suma, línea a línea, de los importes ya redondeados de cada línea. El total es base + IVA + recargo.

**Why this priority**: define la cabecera que se imprime y que lee la gestoría. Depende de las historias 1 y 2.

**Independent Test**: calcular una factura de varias líneas y comparar cabecera y suma de líneas. Test: `calcularFactura` «forma exacta del resultado» y «suma paso a paso».

**Acceptance Scenarios**:

1. **Given** una factura con varias líneas, **When** se calcula, **Then** la base, el IVA y el recargo de la cabecera son exactamente la suma de los valores de sus líneas, y el total es su suma (FA-2026-000104: 152,30 + 6,09 + 0,76 = 159,15 €).
2. **Given** dos líneas de base 0,10 € y 0,20 €, **When** se acumulan, **Then** la base es 0,30 € exactos (no 0,30000000000000004). Test: «suma paso a paso: 0,1 + 0,2».

---

### User Story 4 - El sistema calcula tal cual lo que se le da, sin validar (Priority: P2)

El cálculo no valida cantidades, precios ni el tipo de IVA: cero, negativos, valores no numéricos y tipos de IVA inventados se calculan con la misma fórmula. Esta spec los **documenta tal cual**; no autoriza a corregirlos (A-45, A-29).

**Why this priority**: la modernización necesita saber exactamente qué hace hoy el sistema ante entradas anómalas para decidir qué conservar.

**Independent Test**: ejecutar las entradas anómalas y comprobar el resultado exacto. Tests: `calcularLinea` «RN-12», «RN-13», «A-45»; `calcularFactura` «RN-12»; rutas «A-29».

**Acceptance Scenarios**:

1. **Given** una línea de 1 × −2.000 € al 21 %, **When** se calcula la factura, **Then** el total es −2.420,00 €. Test: «RN-12: una línea con 1 × -2.000 € al 21 %».
2. **Given** una línea con IVA 5 % y cliente con recargo, **When** se calcula sobre 100 €, **Then** el IVA es 5,00 € y el recargo 0,00 €. Test: «CONGELA comportamiento actual: A-29».
3. **Given** una cantidad o un precio no numérico, **When** se calcula, **Then** la base y el IVA de esa línea carecen de valor numérico (NaN) y el total de la factura también. Test: «A-45».

---

### User Story 5 - Los importes se muestran en formato español (Priority: P3)

Un importe se muestra con punto de millares y coma decimal (1.234,50). El formato de pantalla **no** redondea exactamente igual que el cálculo.

**Why this priority**: afecta a la presentación, no al importe grabado. Interesa porque la diferencia es visible en las sumas del informe de IVA.

**Independent Test**: formatear una batería de valores y comparar el texto. Test: `formatearImporte` en `test/util.test.js`.

**Acceptance Scenarios**:

1. **Given** 1234,5, **When** se muestra, **Then** «1.234,50». Test: «RN-52: ejemplos del documento».
2. **Given** 2,675, **When** se redondea para calcular **y** se muestra, **Then** el cálculo da 2,68 pero la pantalla da «2,67». Test: «A-34».

---

### Edge Cases

- **Medio céntimo exacto, por la derecha o la izquierda del cero** (`redondear2`): 1,005 → 1,00; 2,675 → 2,68; 1,255 → 1,25; 10,075 → 10,07; 0,285 → 0,28; 0,125 → 0,13 pero −0,125 → −0,12 (los negativos van hacia cero). Test: `redondear2` «frontera del medio céntimo».
- **Coma flotante en el producto**: 0,01 × 14,50 = 0,145 → 0,14; 0,03 × 7,50 = 0,225 → 0,22. Test: «coma flotante: 0,01 × 14,50».
- **Base de medio céntimo**: 0,004 → 0,00; 0,005 → 0,01; 0,006 → 0,01.
- **Precio negativo de medio céntimo** (A-62): base y cuotas quedan en −0 en la línea, pero 0 en la cabecera. Test: «A-62».
- **Cliente nulo o sin definir**: sin recargo y sin error. Test: «cliente nulo o indefinido».
- **Marca de recargo de valor inesperado** (A-73): la marca vale si es `1`, `"1"`, `true`, `"1.0"` o `[1]`; no vale `0`, `2`, `null`, `"a"`. Test: «RN-03: la marca de recargo se evalúa con == 1» y «A-73».
- **Tipo de IVA escrito como texto** (`"21"`): se calcula el IVA, pero no se añade recargo. Test: «el tipo de IVA como texto "21"».
- **Una línea no numérica** hace que toda la factura salga sin valor numérico (A-45).
- **Importe infinito o ≥ 1e21** al mostrar (A-63): «Infinity,undefined» y «1e+21,undefined». Test: «A-63».
- **Importe `null`, vacío o no numérico** al mostrar: «0,00». **Negativo muy pequeño** (−0,001): «-0,00».
- **Sin líneas**: todos los importes son 0.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-01)*: El sistema MUST calcular la base de cada línea como cantidad × precio unitario, redondeada a 2 decimales. Evidencia: `calcularLinea`, `services/calculo.js:27`. Dato real: 0,44 × 21,60 = 9,504 → 9,50 € (línea de FA-2026-000101). Test: `calcularLinea` «RN-01».
- **FR-002** *(RN-02)*: El sistema MUST calcular la cuota de IVA de cada línea como base de línea × tipo / 100, redondeada a 2 decimales **por línea**, y NEVER sobre el total de la factura. Evidencia: `services/calculo.js:28`. Ejemplo: tres líneas de 0,12 € al 21 % → 0,09 € (frente a 0,08 € sobre el total). Test: `calcularFactura` «RN-02».
- **FR-003** *(RN-03, A-73)*: El sistema MUST añadir a cada línea una cuota de recargo solo si el cliente tiene la marca de recargo de equivalencia; en caso contrario el recargo es 0. La marca se evalúa con igualdad laxa a 1 (`== 1`): `1`, `"1"`, `true`, `"1.0"` y `[1]` activan; `0`, `2`, `null`, `"a"` no. Evidencia: `calcularFactura`, `services/calculo.js:49` (marca) y `:30-32` (cuota). Test: `calcularFactura` «RN-03» y «A-73».
- **FR-004** *(RN-04, A-29, A-39)*: El sistema MUST aplicar estos porcentajes de recargo según el tipo de IVA de la línea: 21 → 5,2 · 10 → 1,4 · 4 → 0,5 · 18 → 4 · 16 → 4 · 8 → 1 · 7 → 1. Para **cualquier otro tipo** (incluido 0) el recargo es 0 sin aviso. La comparación es estricta (`===`): un tipo escrito como texto no recibe recargo. Evidencia: `recargoPara`, `services/calculo.js:12-23` (comentario de tipos antiguos «no borrar por si hay que reabrir ejercicios viejos del Access», `:16-17`). Test: `recargoPara` (todos).
- **FR-005** *(RN-05)*: El sistema MUST obtener la base, el IVA y el recargo de la factura sumando los importes ya redondeados de cada línea, y volver a redondear a 2 decimales tras cada suma. El orden es: (1) base de línea, (2) IVA y recargo sobre esa base ya redondeada, (3) acumulación. Evidencia: `services/calculo.js:26-34`, `:81-83`. Dato real: IVA de FA-2026-000102 = 15,54 + 6,07 + 2,27 + 0,40 = 24,28; recargo = 3,85 + 1,50 + 0,56 + 0,10 = 6,01 (ambos coinciden con la BD). Test: `calcularFactura` «RN-05/RN-06: FA-2026-000102».
- **FR-006** *(RN-06)*: El sistema MUST calcular el total como base + IVA + recargo, redondeado a 2 decimales. Evidencia: `services/calculo.js:86`. Dato real: FA-2026-000104, 152,30 + 6,09 + 0,76 = 159,15 (idéntico a la cabecera grabada). Con las líneas de FA-2026-000102 el código da 115,62 + 24,28 + 6,01 = 145,91, y la BD guarda 145,89 (H-02, spec 005). Test: «RN-04: FA-2026-000104» y «RN-05/RN-06: FA-2026-000102».
- **FR-007** *(RN-12, A-45)*: El sistema MUST aceptar sin validar cantidad o precio cero, negativos o sin valor numérico, y calcularlos con las mismas fórmulas. Cero → importes 0 (IVA 0 % también válido). Negativo → se calcula tal cual (1 × −2.000 € al 21 % → total −2.420,00 €). Sin valor numérico → base, IVA y total sin valor numérico (NaN; el registro lo anota como `null`). Sin líneas → todo 0. Evidencia: `services/calculo.js:26-34`, `:50-88`. Test: `calcularLinea` «RN-12», «A-45»; `calcularFactura` «RN-12».
- **FR-008** *(RN-13, A-29)*: El sistema MUST aplicar como IVA el porcentaje que reciba, sin validarlo contra la lista de tipos (cualquier número, incluidos 0 y negativos), y calcular recargo 0 si el tipo no está en FR-004. Dato: IVA 5 % sobre 100 € → cuota 5,00 € y recargo 0,00 € aunque el cliente tenga la marca. Evidencia: `services/calculo.js:28`, `:22`. Test: `calcularLinea` «RN-13»; rutas «A-29».
- **FR-009** *(RN-51, A-02)*: El sistema MUST redondear con `Math.round(x * 100) / 100` sobre coma flotante binaria, y cualquier reimplementación MUST reproducirlo bit a bit, incluido el efecto de coma flotante en los medios céntimos: 1,005 → 1,00; 2,675 → 2,68; 1,255 → 1,25; 10,075 → 10,07; 0,285 → 0,28; 0,125 → 0,13; −0,125 → −0,12. Evidencia: `redondear2`, `lib/util.js:5-7`. Test: `redondear2` (batería «RN-51»).
- **FR-010** *(RN-52, A-34)*: El sistema MUST mostrar un importe con `toFixed(2)`, punto de millares y coma decimal; `null`, vacío, `undefined` o no numérico → «0,00»; un negativo muy pequeño → «-0,00». Este formato NO coincide siempre con FR-009: 2,675 → «2,67» (el cálculo da 2,68). Evidencia: `formatearImporte`, `lib/util.js:51-58`. Test: `formatearImporte` «RN-52», «A-34».
- **FR-011** *(A-62)*: El sistema MUST devolver `-0` para los negativos entre −0,005 y 0 al redondear, y MUST propagarlo a la base y a las cuotas de la línea (la cabecera suma 0). Evidencia: `lib/util.js:5-7`. Test: «A-62» (`util.test.js` y `calculo.test.js`).
- **FR-012** *(A-63)*: El sistema MUST producir «Infinity,undefined» al mostrar un infinito y «1e+21,undefined» al mostrar 1e21. Evidencia: `lib/util.js:51-58`. Test: «A-63».
- **FR-013** *(límite con la spec 002)*: Cuando la base bruta de la factura NO supera 1.000,00 €, el sistema MUST devolver las líneas con el precio de entrada y `descuentoPct = 0`. Por encima de ese umbral rige la spec 002. Evidencia: `services/calculo.js:53-71`.

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-02 | Redondeo línea a línea con coma flotante (protegida) | PENDIENTE | TC, bit a bit | FR-001, FR-002, FR-005, FR-009 | `redondear2`; `calcularFactura` «A-02» |
| A-29 | IVA libre; recargo 0 fuera de tabla | PENDIENTE | TC | FR-004, FR-008 | `recargoPara` «A-29»; rutas «A-29» |
| A-39 | Se conservan recargos de IVA 18/16/8/7 | PENDIENTE | TC | FR-004 | `recargoPara` «A-39» |
| A-34 | Formato `toFixed` ≠ `redondear2` | ACCIDENTAL | Documentar | FR-010 | `formatearImporte` «A-34» |
| A-45 | Vacío o no numérico → sin valor | BUG A SECAS | TC; corregir en modernización | FR-007 | «A-45» |
| A-62 | `-0` en negativos de medio céntimo | ACCIDENTAL | TC | FR-011 | «A-62» |
| A-63 | «Infinity,undefined» | ACCIDENTAL | TC | FR-012 | «A-63» |
| A-73 | Marca `== 1` laxa (`"1.0"`, `[1]`) | ACCIDENTAL | TC | FR-003 | «A-73» |

TC = especificar tal cual. Las correcciones (A-45) corresponden a la modernización, solo hacia delante y por decisión escrita del negocio.

### Key Entities *(include if feature involves data)*

- **Línea de factura**: cantidad, precio unitario, tipo de IVA y los tres importes que se calculan: base, cuota de IVA y cuota de recargo.
- **Cliente (a efectos de cálculo)**: solo importa su marca de recargo de equivalencia.
- **Factura (a efectos de cálculo)**: base, IVA, recargo y total, sumas de las líneas.
- **Tipo de IVA y recargo asociado**: pares (21, 5,2), (10, 1,4), (4, 0,5), (18, 4), (16, 4), (8, 1), (7, 1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: FA-2026-000104 se reproduce al céntimo en base, IVA, recargo y total; de FA-2026-000102 se reproducen IVA y recargo, y la diferencia de 0,02 € en base y total queda documentada (H-02).
- **SC-002**: En el 100 % de los casos de redondeo documentados (batería «RN-51» y los medios céntimos de la sección Edge Cases) el resultado coincide con el esperado.
- **SC-003**: Las 8 anomalías de esta spec (A-02, A-29, A-34, A-39, A-45, A-62, A-63, A-73) tienen al menos un test que congela su comportamiento actual.
- **SC-004**: Cada uno de los 13 requisitos funcionales se puede comprobar con al menos un test existente, sin escribir código nuevo.
- **SC-005**: Un revisor del negocio puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Descuento por volumen, su tramo y su constancia en la factura: **spec 002**. Aquí solo se fija el límite de FR-013.
- Numeración legal de la factura: **spec 003**.
- Lectura de cantidades y precios tecleados, fecha y vencimiento (A-06, A-44, A-35): **spec 004**.
- Qué cuota genera cada contrato y cómo se prorratea: **specs 006 y 007**.
- Cómo se suma el IVA en los informes y el CSV (A-01, A-61): **spec 008**.
- Cómo se rectifica un importe ya grabado: **spec 005**.

## Assumptions

- **SUPOSICIÓN**: los tipos de IVA 21/10/4 y sus recargos 5,2/1,4/0,5 son los vigentes y 18/16/8/7 son tipos anteriores, según conocimiento general (registro, Q-01). No hay fuente del proyecto que lo confirme.
- **SUPOSICIÓN**: la gestoría exige el redondeo línea a línea porque el Contaplus lo cuadra así (comentario de `services/calculo.js:1-7`, CÓDIGO). No hay testigo NEGOCIO; la pregunta sigue abierta (A-02, P12).
- Los ejemplos con número de factura proceden de `datos/gesfact.db`, que el registro (A-18) señala como posible copia de la semilla de `db.js` y no como histórico de producción. Si la BD real difiere, los valores de SC-001 pueden cambiar; las reglas no.
- Los resultados que dependen de coma flotante son los de Node.js con números de doble precisión; esta spec los trata como parte del contrato (Principio I).
- Dependencia de otras specs: ninguna en este dominio. Las specs 002, 004 y 007 dependen de esta.
