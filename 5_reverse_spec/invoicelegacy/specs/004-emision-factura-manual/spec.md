# Feature Specification: Emisión de una factura manual

**Feature Branch**: `004-emision-factura-manual`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Emisión de una factura manual (POST /facturas/nueva). Alcance: qué hace falta para emitir, cómo se leen los datos tecleados, fecha, plazo y vencimiento, estado inicial y qué ocurre si falla a mitad. RN: RN-27, RN-28, RN-29, RN-30, RN-31, RN-32, RN-33, RN-34, RN-53. Anomalías: A-37, A-36, A-09, A-06, A-13, A-35, A-44, A-38, A-64, A-66. Dueño natural: Administración."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la emisión manual de facturas de GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
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
| P4 (A-09) | `entrevista-negocio-simulada.md` | Administración / Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | No admitir facturas FA con total negativo en la modernización; los abonos parciales requerirán una rectificativa parcial (funcionalidad nueva) |
| P14 (A-36) | `entrevista-negocio-simulada.md` | Administración, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Plazo 0 = «al contado», solo hacia delante (ningún cliente tiene 0) |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica P4 y P14 |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). Las anomalías A-09 y A-36 siguen **PENDIENTE** en el registro; A-37 es INTENCIONAL; A-06, A-13, A-35 y A-44 son BUG A SECAS; A-38, A-64 y A-66 son ACCIDENTALES. Mientras no firme Administración (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Una factura sale con su fecha, su vencimiento y su estado «emitida» (Priority: P1)

Administración elige un cliente, teclea una o más líneas y emite la factura. El sistema la graba con la fecha tecleada (o la de hoy si se deja vacía), la numera con la serie FA, la marca como «emitida» y calcula el vencimiento sumando los días de pago del cliente (30 si no los tiene).

**Why this priority**: es el camino por el que sale la mayoría de las facturas y el que fija el vencimiento que la gestoría y el cobro usan.

**Independent Test**: emitir facturas de referencia en una BD temporal y comprobar fecha, vencimiento, estado y serie. Tests: `rutas.test.js` «RN-30/RN-31» y «RN-33»; `util.test.js` `sumarDias`; golden G01, G04 y G10.

**Acceptance Scenarios**:

1. **Given** un cliente sin plazo y una línea de 3 × 21,60 € al 21 %, **When** se emite con fecha 2026-01-31, **Then** el vencimiento es 2026-03-02 (30 días naturales, cruzando fin de mes) y el estado es «emitida». Golden G01; test: `sumarDias` «BD semilla: vencimientos de FA-2026-000101 (+30)».
2. **Given** un cliente a 60 días, **When** se emite con fecha 2026-02-20, **Then** el vencimiento es 2026-04-21 (FA-2026-000103). Test: `sumarDias` «BD semilla … FA-2026-000103 (+60)»; golden G04.
3. **Given** que no se teclea fecha, **When** se emite con el reloj en 2026-11-11, **Then** la fecha es 2026-11-11 y el vencimiento 2026-12-11 (cliente sin plazo); con un cliente de 60 días y fecha 2026-01-31, el vencimiento es 2026-04-01. Test: «RN-30/RN-31: sin fecha se usa hoy».
4. **Given** una factura recién emitida, **When** se consulta, **Then** estado «emitida», serie FA y sin factura rectificada. Test: «RN-33: toda factura nace emitida, en serie FA, sin rectifica_a».
5. **Given** una factura fechada en 2025-12-31 emitida en 2026, **When** se graba, **Then** conserva la fecha 2025-12-31, vence el 2026-01-30 y su número es de 2026 (el año lo fija el reloj; spec 003). Test: «A-10 / RN-37 una factura con fecha de 2025 grabada en 2026»; golden G10.

---

### User Story 2 - Sin cliente o sin líneas no se emite nada (Priority: P1)

El sistema exige un cliente existente y al menos una línea con descripción. Si falta, responde con error 400 y no consume número de factura. Una fila del formulario sin descripción se descarta aunque lleve importe.

**Why this priority**: evita facturas vacías y huecos en la numeración legal.

**Independent Test**: enviar altas sin líneas y con clientes inexistentes. Tests: `rutas.test.js` «RN-27» (dos), «RN-28/RN-29».

**Acceptance Scenarios**:

1. **Given** un formulario sin ninguna línea con descripción, **When** se envía, **Then** la respuesta es 400 «La factura no tiene lineas» y no se consume número. Test: «RN-27: sin ninguna línea con descripción».
2. **Given** un cliente inexistente o ilegible, **When** se envía, **Then** la respuesta es 400 «Cliente no valido». Test: «RN-27: cliente inexistente o ilegible».
3. **Given** una fila sin descripción pero con cantidad 2 y precio 50 €, **When** se envía junto a una fila con descripción, **Then** la fila sin descripción no entra. Test: «RN-28/RN-29»; golden G09.
4. **Given** un cliente dado de baja (`activo = 0`), **When** se envía el alta, **Then** se emite igualmente: el servidor no comprueba el estado del cliente (la política es de la spec 009). Test: «A-05 / contradicción 08 se puede facturar a un cliente dado de baja».

---

### User Story 3 - Los importes tecleados con coma se leen con una regla simple (Priority: P1)

Cantidades y precios se leen sustituyendo la **primera** coma por un punto. «12,5» vale 12,5, pero «1.234,50» vale 1,234: el punto de millares se interpreta como decimal y el importe cae mil veces (A-06). Esta spec lo documenta tal cual.

**Why this priority**: es la anomalía con mayor daño económico potencial (BUG A SECAS), aunque no hay casos reales. Lo que se teclea es lo que se factura.

**Independent Test**: emitir facturas con comas y puntos y comparar las líneas grabadas. Tests: `rutas.test.js` «RN-28/RN-29» y «A-06 / RN-29»; golden G09.

**Acceptance Scenarios**:

1. **Given** una línea de cantidad 1 y precio «1,234» y otra de cantidad «0,5» y precio «12,34», **When** se emite, **Then** las líneas valen 1 × 1,234 y 0,5 × 12,34. Test: «RN-28/RN-29».
2. **Given** un precio tecleado «1.234,50», **When** se emite, **Then** el precio grabado es 1,234 y la base de esa línea es 1,23 €. Test: «A-06 / RN-29 «1.234,50» se lee como 1,234»; golden G09.
3. **Given** que el cliente ha tecleado «28.9» (punto decimal), **When** se emite, **Then** se lee 28,9. *(Conserva el comportamiento esperado; sin test específico.)*

---

### User Story 4 - Si algo falla a mitad, la factura puede quedar incompleta (Priority: P2)

La cabecera y las líneas se graban **sin transacción** y las líneas en paralelo. Si falla la grabación de una línea, la cabecera ya está grabada, faltan líneas y la respuesta es un error 500 (A-13). Si falla la cabecera, el número ya se había reservado y queda un hueco (A-12, spec 003).

**Why this priority**: es una pérdida de integridad en una factura legal. El comentario del código admite que «ya se apañó a mano en la BD».

**Independent Test**: provocar un fallo en una línea en una BD temporal. Tests: `rutas.test.js` «A-13» y «A-45 / A-12».

**Acceptance Scenarios**:

1. **Given** una factura de tres líneas cuya segunda línea falla, **When** se emite, **Then** la respuesta es 500 «Error al grabar lineas: …», la cabecera queda grabada con base 60,00 €, IVA 12,60 € y total 72,60 €, pero solo se graban las líneas 1 y 3. Test: «A-13».
2. **Given** esa misma situación, **When** se emite la factura siguiente, **Then** sale correctamente con el número siguiente. Test: «A-13» (última aserción).
3. **Given** un precio o IVA vacío, **When** se emite, **Then** la respuesta es 500 («NOT NULL constraint failed: facturas.base» o «facturas.iva») y el número queda consumido. Test: «A-45 / A-12 precio o IVA vacío».

---

### User Story 5 - Valores atípicos se aceptan sin validar (Priority: P3)

El alta acepta fechas ilegibles, cantidades negativas y facturas con total negativo, plazos cero o negativos, y rarezas de formato. Esta spec los **documenta tal cual**; no autoriza a corregirlos.

**Why this priority**: la modernización necesita saber qué hace hoy el sistema ante entradas anómalas para decidir qué conservar (A-09, A-36, A-44, A-64, A-66).

**Independent Test**: ejecutar las entradas anómalas y comprobar el resultado exacto. Tests: `rutas.test.js` «A-44», «A-09»; `util.test.js` «A-64», «A-66».

**Acceptance Scenarios**:

1. **Given** una fecha tecleada «abc», **When** se emite, **Then** se graba tal cual y el vencimiento es «NaN-NaN-NaN». Test: «A-44 / RN-30».
2. **Given** una cantidad negativa, **When** se emite, **Then** sale una factura FA con total −2.420,00 € (sin descuento). Test: «A-09 cantidad negativa → factura FA con total -2.420,00». Golden G09 (cantidad −2 con IVA 5 % y recargo).
3. **Given** un cliente con plazo 0, **When** se calcula el vencimiento, **Then** se usan 30 días; con −5 días el vencimiento es anterior a la fecha. *Test solo en el camino de la remesa (`remesa.test.js` «A-36»), que usa la misma expresión; el alta manual no tiene un test propio.*
4. **Given** una fecha nula en `sumarDias`, **When** se calcula, **Then** parte del 1 de enero de 1970 y devuelve 1970-01-02 con 1 día; una fecha inexistente (2026-02-30) se desborda a 2026-03-02. Test: «A-66».
5. **Given** una fecha que no tiene la forma AAAA-MM-DD, **When** se formatea para pantalla, **Then** el texto contiene «undefined» («abc» → `undefined/undefined/abc`). Test: «A-64».

---

### Edge Cases

- **Fecha vacía**: se sustituye por la de hoy en formato AAAA-MM-DD (hora local del servidor); a las 23:30 UTC del 31 de diciembre en Madrid ya es 1 de enero. Test: `hoy` «usa la hora LOCAL».
- **Vencimiento en zona horaria con desfase negativo**: con `TZ=America/Argentina/Buenos_Aires` el vencimiento sale **un día antes** (2026-03-01 en lugar de 2026-03-02, A-35). En producción (Europa/Madrid) no ocurre: 0 de 8 vencimientos de la BD coinciden con Buenos Aires y 8 de 8 con Madrid. Test: «A-35 en una zona horaria con desfase negativo (UTC-3)».
- **Fin de mes y festivos**: el vencimiento no se ajusta (2026-12-31 + 30 = 2027-01-30). Test: `sumarDias` «RN-32»; «A-37».
- **Fecha con hora**: `fechaBonita('2026-05-06T10:00')` devuelve `06T10:00/05/2026`. Test: «RN-53: una fecha con hora no se trata».
- **Una sola línea enviada como texto** (no como lista) se factura igualmente. Test: «una sola línea enviada como texto».
- **Sin observaciones**: se graban como cadena vacía, no como nulo. Test: «sin el campo obs».
- **El contador FA final** tras las altas de prueba es 123 y el de RE no se mueve (con huecos). Test: «el contador FA final es 123».
- **Envío por correo**: el alta llama al servicio de correo al terminar, pero está desactivado desde 2022 (spec 010).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-27)*: El sistema MUST rechazar con 400 «Cliente no valido» un alta cuyo cliente no exista o no se pueda leer, y con 400 «La factura no tiene lineas» un alta sin ninguna línea con descripción; en ambos casos MUST NOT consumir número. No comprueba que el cliente esté activo. Evidencia: `routes/facturas.js:46-47`, `:64`. Test: «RN-27» (dos); «A-05 / contradicción 08».
- **FR-002** *(RN-28)*: El sistema MUST descartar la fila del formulario cuya descripción esté vacía aunque lleve cantidad o precio. Evidencia: `routes/facturas.js:56`. Test: «RN-28/RN-29»; golden G09.
- **FR-003** *(RN-29, A-06)*: El sistema MUST leer cantidad y precio sustituyendo la **primera** coma por un punto y aplicando una lectura decimal. «12,34» → 12,34; «1.234,50» → 1,234. Evidencia: `routes/facturas.js:59-60`. Test: «RN-28/RN-29»; «A-06». Dato: factura FA-2026-000109 de las pruebas, base 7,40 €, total 8,28 €.
- **FR-004** *(RN-29)*: El sistema MUST leer el tipo de IVA como entero. Evidencia: `routes/facturas.js:61`.
- **FR-005** *(RN-30, A-44)*: El sistema MUST usar la fecha tecleada tal cual o, si está vacía, la de hoy (`AAAA-MM-DD` local), sin validar el formato ni el calendario. Evidencia: `routes/facturas.js:44`, `hoy`, `lib/util.js:10-15`. Test: «RN-30/RN-31»; «A-44»; `hoy` (tres).
- **FR-006** *(RN-31, A-36)*: El sistema MUST calcular el plazo como los días de pago del cliente, o 30 (`config.VENCIMIENTO_DIAS`) si están vacíos o valen 0. Un plazo negativo se aplica tal cual. Evidencia: `routes/facturas.js:68`; `config.js:40`. Ejemplos: FA-2026-000103 (60 días), 2026-02-20 → vence 2026-04-21; FA-2026-000101 (sin plazo), 2026-01-31 → 2026-03-02. Test: `sumarDias` «BD semilla»; «RN-30/RN-31». Para plazo 0 y −5: `remesa.test.js` «A-36» (misma expresión).
- **FR-007** *(RN-32, A-37, A-35)*: El sistema MUST calcular el vencimiento como fecha + N días **naturales** (sin ajuste a fin de mes, festivo o día hábil), con aritmética en milisegundos sobre la zona horaria del servidor. Evidencia: `sumarDias`, `lib/util.js:20-27`. Ejemplos: 2026-12-31 + 30 = 2027-01-30; 2024-02-29 + 365 = 2025-02-28. Se verifica con `TZ=Europe/Madrid`. Test: `sumarDias` «RN-32», «A-37», «A-35».
- **FR-008** *(RN-33)*: El sistema MUST grabar la factura con estado «emitida» y serie FA, sin factura rectificada. Evidencia: `routes/facturas.js:74-76`. Test: «RN-33».
- **FR-009** *(RN-34, A-13)*: El sistema MUST grabar la cabecera y, a continuación, las líneas **una a una y en paralelo, sin transacción**. Si falla alguna línea, la cabecera y las líneas ya grabadas se quedan y la respuesta es 500 «Error al grabar lineas: …». Evidencia: `routes/facturas.js:74-100`. Test: «A-13».
- **FR-010** *(RN-34, A-12)*: Si falla la grabación de la cabecera, el sistema MUST responder 500 «Error al grabar: …» y el número ya reservado MUST quedar sin usar. Evidencia: `routes/facturas.js:71-77`. Test: «A-45 / A-12».
- **FR-011** *(A-09)*: El sistema MUST aceptar cantidades y precios negativos y emitir una factura FA con total negativo. Evidencia: sin validación en `routes/facturas.js:55-62`. Test: «A-09».
- **FR-012** *(RN-53, A-64)*: El sistema MUST mostrar una fecha `AAAA-MM-DD` como `DD/MM/AAAA`; vacío, nulo, indefinido o cero → cadena vacía; sin esa forma → texto con «undefined». Evidencia: `fechaBonita`, `lib/util.js:29-33`. Test: `fechaBonita` (cuatro).
- **FR-013** *(A-66)*: `sumarDias` MUST tratar una fecha nula como 1970-01-01 y desbordar una fecha inexistente al mes siguiente. Evidencia: `lib/util.js:20-27`. Test: «A-66».
- **FR-014** *(A-38)*: El plazo por defecto (30 días) y el IVA por defecto (21 %) están escritos en más de un sitio, y esta spec los fija tal cual (los dos valores MUST seguir siendo 30 y 21). El alta manual lee `config.VENCIMIENTO_DIAS`; la remesa usa un literal propio `30`; el alta de artículos lee `config.IVA_DEFECTO` y el de contratos un literal `21`. Evidencia: `routes/facturas.js:68`, `scripts/remesa_mensual.js:60`, `routes/articulos.js:16`, `routes/contratos.js:20`. Test: `remesa.test.js` «A-38» (dos); `rutas.test.js` «A-22, A-38».
- **FR-015** *(RN-53)*: La fecha de «hoy» MUST ser la local del servidor (no UTC). Test: `hoy` «usa la hora LOCAL».

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-37 | Días naturales, 30 por defecto | INTENCIONAL | TC | FR-007 | «A-37» |
| A-36 | Plazo 0 → 30 días | PENDIENTE | TC | FR-006 | `remesa.test.js` «A-36» |
| A-09 | Cantidades y FA negativas | PENDIENTE | TC | FR-011 | «A-09» |
| A-06 | Miles `1.234,50` leído 1,234 | BUG A SECAS | TC; corregir en modernización | FR-003 | «A-06» |
| A-13 | Alta sin transacción | BUG A SECAS | TC; corregir en modernización | FR-009 | «A-13» |
| A-35 | Vencimiento −1 día en UTC−3 (latente) | BUG A SECAS | TC; corregir en modernización | FR-007 | «A-35» (dos) |
| A-44 | Fecha manual sin validar | BUG A SECAS | TC; corregir en modernización | FR-005 | «A-44» |
| A-38 | Valores por defecto duplicados | ACCIDENTAL | Corregir sin cambiar los valores | FR-014 | `remesa.test.js` «A-38» |
| A-64 | `fechaBonita` → «undefined» | ACCIDENTAL | TC | FR-012 | «A-64» |
| A-66 | `sumarDias(null)` → 1970-01-02 | ACCIDENTAL | TC | FR-013 | «A-66» |

TC = especificar tal cual. Las correcciones corresponden a la modernización, solo hacia delante y por decisión escrita del negocio. Al corregir A-06 se debe mantener la lectura correcta de «28.9» y «12,5».

### Key Entities *(include if feature involves data)*

- **Factura (alta manual)**: número, serie FA, cliente, fecha, vencimiento, base, IVA, recargo, total, estado «emitida» y observaciones.
- **Línea**: descripción, cantidad, precio (ya descontado, spec 002), tipo de IVA y sus importes.
- **Cliente (a efectos de plazo)**: días de pago (o vacío) y marca de recargo.
- **Plazo por defecto**: 30 días (`config.VENCIMIENTO_DIAS`), duplicado en la remesa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los 10 casos del golden master del camino manual (G01 a G10) pasan y los vencimientos de G01, G04 y G10 coinciden con los de esta spec.
- **SC-002**: Las 10 anomalías de esta spec (A-06, A-09, A-13, A-35, A-36, A-37, A-38, A-44, A-64, A-66) tienen al menos un test que congela su comportamiento actual; A-36 lo tiene en el camino de la remesa, y se anota expresamente.
- **SC-003**: Los vencimientos de ejemplo (2026-01-31 → 2026-03-02; 2026-02-20 + 60 → 2026-04-21; 2026-12-31 → 2027-01-30) se obtienen en el 100 % de los casos con `TZ=Europe/Madrid`.
- **SC-004**: Cada uno de los 15 requisitos funcionales se puede comprobar con al menos un test existente, sin escribir código nuevo (salvo FR-004, que se verifica por lectura del código).
- **SC-005**: Un revisor de Administración puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar). Si no llega, la spec se divide en 004a (validación y lectura de datos) y 004b (fecha y vencimiento).

## Fuera de alcance

- Cálculo de importes, IVA y recargo: **spec 001**. Descuento y su leyenda: **spec 002**.
- Formato y año del número: **spec 003**.
- Cobro, rectificación e impresión de lo emitido: **spec 005**.
- Vencimiento de la remesa (RN-23): **spec 007**.
- Política de clientes de baja (A-05): **spec 009**. Lectura de importes en contratos y artículos (A-06 en otras rutas): se cita aquí, se especifica en 006 y 009.
- Correo de la factura: **spec 010**.

## Assumptions

- **SUPOSICIÓN**: el desfase horario de A-35 solo afecta a equipos con TZ distinta de Europa/Madrid; el servidor de producción está en Madrid (8 de 8 vencimientos de la BD coinciden). No hay acta que lo confirme (hecho que solo conoce la oficina).
- **SUPOSICIÓN**: ningún cliente real tiene plazo 0 (P14); no hay dato que lo confirme más allá de la BD analizada.
- Los ejemplos con número de factura proceden de `datos/gesfact.db` y de la BD temporal de los tests. El registro (A-18) señala que la BD analizada puede ser una copia de la semilla de `db.js`.
- El tipo de IVA se lee con `parseInt`; un valor decimal («10,5») se trunca. No hay test de ese caso.
- Dependencia de otras specs: usa 001 (importes), 002 (descuento), 003 (número). Las specs 005 y 007 dependen de ésta.
