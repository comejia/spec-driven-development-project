# Feature Specification: Maestros de clientes: identidad fiscal y bajas

**Feature Branch**: `009-maestros-clientes-nif`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Maestros de clientes: identidad fiscal y bajas. Alcance: validación del NIF/CIF al dar de alta, baja lógica (activo = 0) y qué significa «dado de baja» para facturar; validación mínima de altas de maestros. RN: RN-55. Anomalías: A-05, A-22, A-53. Dueño natural: Administración y Gerencia (política de bajas)."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del alta y la baja de clientes y de la validación del NIF en GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
>
> **Reglas de esta spec.**
> - Cada requisito describe el comportamiento ACTUAL y cita su evidencia (fichero y función, o dato real). Esa evidencia es obligatoria (Constitución, Principio II) y por eso aparecen nombres de fichero; no describen cómo construir nada nuevo.
> - Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, con su ID del registro (`specs/000-reconocimiento/registro-de-anomalias.md`).
> - Cada criterio es verificable contra la suite de `test/` (se cita el test) y se ejecuta con `npm test`.
> - Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha).
> - Los NIF de los clientes **no se reproducen**; los ejemplos de NIF son valores de prueba de los tests.
> - **Hueco de protección**: el golden master **no cubre** esta spec. Se apoya solo en `rutas.test.js`, `util.test.js` y `remesa.test.js`.
> - Es la spec más pequeña (1 RN y 3 anomalías). Se mantiene separada porque la política de bajas la decide Gerencia, no la emisión (004) ni la remesa (007).

## Actas y estado de aprobación

No existe ninguna entrevista con una persona identificada (`entrevista-negocio.md` no existe). Las decisiones que esta spec cita provienen de:

| Cita | Documento | Persona | Fecha | Valor |
|---|---|---|---|---|
| P5 (A-05) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | La baja de un cliente cierra sus contratos; se permite factura manual con aviso; solo hacia delante |
| P17 (A-22) | `entrevista-negocio-simulada.md` | Administración / Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Validar el dígito de control en las altas nuevas; los NIF existentes se revisan aparte. El hecho (si los NIF actuales son reales) queda **sin respuesta concluyente** |
| Comentario de `lib/util.js` | Código | Julián (nov. 2017) | 2017-11 | «Falta comprobar la letra, de momento con la longitud vale porque los da de alta Marga y los mira ella». CÓDIGO, **no es acta** |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica P5 y P17 |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). A-05 y A-22 siguen **PENDIENTE** en el registro; A-53 es BUG A SECAS. Mientras no firmen Gerencia y Administración (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un NIF vale si tiene nueve caracteres (Priority: P1)

Al dar de alta un cliente con NIF, el sistema lo acepta si tiene **9 caracteres** una vez quitados espacios, tabuladores, saltos y guiones. No mira la letra de control ni el tipo de documento. Solo se valida si se informa, y solo al dar de alta. Es una decisión transitoria de Julián de noviembre de 2017.

**Why this priority**: es la única comprobación de identidad fiscal del cliente; la gestoría recibe el NIF en el CSV (spec 008).

**Independent Test**: validar una batería de NIF. Tests: `util.test.js` «validarNIF (RN-55, A-22)».

**Acceptance Scenarios**:

1. **Given** los NIF `B12345678`, `ABCDEFGHI` y `123456789`, **When** se validan, **Then** los tres son válidos; `B-1234567` (8 caracteres tras quitar el guion) y la cadena vacía no. Test: «RN-55: ejemplos del documento».
2. **Given** una longitud de 8, 9 o 10 caracteres, **When** se validan, **Then** solo el de 9 es válido. Test: «frontera de longitud».
3. **Given** espacios, guiones o tabuladores (`B 1234 5678`, `B-1234-5678`, `12345678-9`, un tabulador y un salto de línea alrededor), **When** se validan, **Then** no cuentan y los de 9 caracteres reales son válidos; solo guiones o solo espacios no lo son. Test: «los espacios, guiones y tabuladores no cuentan».
4. **Given** valores vacíos (nulo, indefinido, 0, espacios), **When** se validan, **Then** son inválidos. Test: «vacíos y valores inexistentes».
5. **Given** un número en vez de texto, **When** se valida, **Then** se convierte a texto: 9 dígitos valen, 8 o 10 no. Test: «números».
6. **Given** valores sin sentido fiscal (`ABCDEFGHI`, `b12345678`, `ÁÉÍÓÚÑÜÇÀ`, `000000000`), **When** se validan, **Then** son válidos: solo cuenta la longitud (A-22). Test: «A-22 solo se cuenta la longitud».

---

### User Story 2 - Dar de alta un cliente exige nombre y, si hay NIF, que parezca válido (Priority: P1)

El alta de un cliente exige el **nombre**; el NIF es opcional. Si se informa y no tiene 9 caracteres, el sistema rechaza el alta y vuelve a la lista con el aviso «El NIF no parece valido». El resto de campos (dirección, CP, población, correo, recargo de equivalencia, días de pago) se graban tal cual. La validación «fuerte» la hace Marga mirándolo (comentario del código).

**Why this priority**: es el punto de entrada de los datos fiscales de los que dependen las facturas y el recargo de equivalencia.

**Independent Test**: dar de alta clientes en una BD temporal. Test: `rutas.test.js` «A-22 un NIF de 9 caracteres cualquiera se acepta».

**Acceptance Scenarios**:

1. **Given** un alta sin nombre, **When** se envía, **Then** se redirige a `/clientes?aviso=Falta el nombre` y no se crea nada. Test: «A-22 … el nombre es obligatorio».
2. **Given** un alta con NIF `B-1234567`, **When** se envía, **Then** se redirige a `/clientes?aviso=El NIF no parece valido`. Test: la misma.
3. **Given** un alta con NIF `ABCDEFGHI`, recargo de equivalencia marcado y días de pago 45, **When** se envía, **Then** se crea el cliente 7 con NIF `ABCDEFGHI`, recargo 1, 45 días de pago y activo. Test: la misma.
4. **Given** un alta con solo el nombre, **When** se envía, **Then** se crea el cliente 8 con NIF nulo, recargo 0, días de pago nulos y activo. Test: la misma.
5. **Given** que la validación solo se aplica al alta, **When** se cambia el NIF de un cliente existente, **Then** no hay pantalla ni ruta de edición (no existe `UPDATE` de NIF en el código). *Sin test específico: se deduce de las rutas de `routes/clientes.js`.*

---

### User Story 3 - Dar de baja a un cliente es lógico y no cierra nada más (Priority: P1)

La baja de un cliente marca `activo = 0`. No borra el cliente, no cierra sus contratos ni toca sus facturas. El cliente deja de aparecer en el desplegable de la pantalla de nueva factura y no cuenta como cliente activo en el panel. Lo mismo ocurre con los artículos (baja lógica).

**Why this priority**: los clientes con facturas emitidas no se pueden borrar (requisito legal, spec 005); la baja es la única forma de «retirar» a un cliente.

**Independent Test**: dar de baja al cliente 1 en una BD temporal y comprobar contratos y facturas. Tests: `rutas.test.js` «la baja de un cliente es lógica».

**Acceptance Scenarios**:

1. **Given** el cliente 1 (con 1 contrato vigente y 2 facturas), **When** se da de baja, **Then** `activo` pasa a 0, su contrato sigue vigente (sin fecha de baja) y sus 2 facturas siguen intactas. Test: «la baja de un cliente es lógica».
2. **Given** el desplegable de la pantalla de nueva factura, **When** se da de baja al cliente 1, **Then** deja de ofrecerse. Test: «A-05 / contradicción 08 el desplegable».
3. **Given** el panel de inicio, **When** se dan de baja los clientes 1 y 2, **Then** «Clientes activos» pasa de 6 a 4 (spec 005). Test: «A-33 las pendientes cuentan la RE».
4. **Given** un artículo, **When** se da de baja, **Then** `activo = 0` y deja de ofrecerse en la pantalla de nueva factura. *Evidencia: `routes/articulos.js:26-31`; sin test específico.*

---

### User Story 4 - A un cliente de baja se le sigue facturando por los dos caminos (Priority: P1)

«Dado de baja» solo oculta al cliente del desplegable. El servidor **no comprueba** `activo` ni al emitir una factura manual ni en la remesa mensual: una petición directa factura a un cliente de baja, y la remesa lo sigue incluyendo mientras su contrato esté vigente (A-05). Con el cliente 1 de baja y su contrato vigente seguiría recibiendo 108,90 € al mes.

**Why this priority**: es el riesgo económico de esta spec: facturar a quien ya no es cliente. La política (cerrar contratos al dar de baja) la decide Gerencia.

**Independent Test**: dar de baja y facturar por los dos caminos. Tests: «A-05 / contradicción 08» (rutas y remesa).

**Acceptance Scenarios**:

1. **Given** el cliente 1 dado de baja, **When** se envía por petición directa el alta de una factura para ese cliente, **Then** la factura se emite (302). Test: `rutas.test.js` «A-05 / contradicción 08 el desplegable de nueva factura … el servidor acepta uno de baja»; «A-05 / contradicción 08 se puede facturar a un cliente dado de baja».
2. **Given** el cliente 1 dado de baja y un contrato de 90 €, **When** se lanza la remesa de julio, **Then** se emite una factura de 108,90 € a ese cliente. Test: `remesa.test.js` «A-05 / contradicción 08 se factura a un cliente dado de baja».
3. **Given** que la baja no cierra contratos, **When** se consulta el contrato, **Then** sigue sin fecha de baja. Test: «la baja de un cliente es lógica».

---

### User Story 5 - Las altas de artículos y contratos casi no se validan (Priority: P3)

El alta de artículos y de contratos solo comprueba lo que obliga la base de datos: un nombre de artículo vacío, una cuota vacía o un concepto vacío dan un error 500 con el mensaje de la BD. En cambio, un contrato para un cliente inexistente se acepta (A-52, sin integridad referencial). Esta spec lo **documenta tal cual**.

**Why this priority**: la modernización necesita saber qué validación existe hoy (A-53, BUG A SECAS) para decidir cuál añadir.

**Independent Test**: dar de alta artículos y contratos incompletos. Tests: `rutas.test.js` «A-53».

**Acceptance Scenarios**:

1. **Given** un artículo con precio «9,5», IVA vacío y unidad vacía, **When** se da de alta, **Then** se crea con precio 9,5, IVA 21 (`config.IVA_DEFECTO`) y unidad «ud». Test: «A-22 un NIF de 9 caracteres cualquiera» (parte de artículos).
2. **Given** un artículo sin nombre, **When** se da de alta, **Then** responde 500 «Error BD: SQLITE_CONSTRAINT: NOT NULL constraint failed: articulos.nombre». Test: la misma.
3. **Given** un contrato con cuota vacía o sin concepto, **When** se da de alta, **Then** responde 500 con el error de la BD (`contratos.cuota`, `contratos.concepto`). Test: «A-53 cuota vacía o falta de concepto».
4. **Given** un contrato para un cliente inexistente (99), **When** se da de alta, **Then** se acepta (302). Test: «A-53 … un cliente inexistente SÍ se acepta (A-52)».
5. **Given** la cuota «1.210,00», **When** se da de alta un contrato, **Then** se graba como 1,21, con IVA 21 y alta de hoy por defecto (A-06, spec 004). Test: «A-06 la cuota «1.210,00» de un contrato nuevo se graba como 1,21».

---

### Edge Cases

- **NIF con minúsculas, acentos o ceros**: `b12345678`, `ÁÉÍÓÚÑÜÇÀ`, `000000000` valen. Test: «A-22 solo se cuenta la longitud».
- **NIF reales de la BD**: 5 de los 6 clientes de la semilla no superan el dígito de control (AD-08, registro); es compatible con datos anonimizados. Si los NIF reales son otros, no se sabe (hecho sin respuesta concluyente).
- **Cliente sin NIF**: se acepta y sale vacío en el CSV (spec 008).
- **Días de pago**: se leen como entero (`parseInt`) y quedan nulos si no se informan. El comportamiento con un texto no numérico no está probado.
- **Recargo de equivalencia**: la casilla marcada vale 1, sin marcar 0; el cálculo lo usa con `== 1` (spec 001).
- **Baja de un cliente inexistente**: la sentencia no encuentra fila y se redirige igualmente. Sin test específico.
- **Reactivar a un cliente de baja**: no existe ninguna ruta; solo se podría modificar la BD a mano, y la decisión simulada P19 (A-32) prohíbe editar la BD a mano.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-55, A-22)*: El sistema MUST considerar válido un NIF si, tras quitar espacios, tabuladores, saltos de línea y guiones, tiene exactamente 9 caracteres, sin comprobar la letra, el tipo ni los caracteres. Un valor vacío (nulo, indefinido, 0 o solo separadores) MUST ser inválido; un número se convierte a texto. Evidencia: `validarNIF`, `lib/util.js:44-48` (comentario de Julián, nov. 2017). Test: `validarNIF` (seis).
- **FR-002** *(RN-55)*: El alta de un cliente MUST exigir el nombre y, solo si se informa el NIF, que sea válido según FR-001. Evidencia: `routes/clientes.js:15-20`. Test: «A-22 … el nombre es obligatorio».
- **FR-003** *(RN-55)*: El sistema MUST rechazar el alta sin nombre con `/clientes?aviso=Falta el nombre` y el alta con NIF no válido con `/clientes?aviso=El NIF no parece valido`, sin crear nada. Evidencia: `routes/clientes.js:17-19`. Test: la misma.
- **FR-004** *(RN-55)*: El sistema MUST grabar el cliente con los valores tecleados: NIF, dirección, CP, población y correo nulos si están vacíos; recargo 1 si la casilla está marcada y 0 si no; días de pago como entero o nulo; `activo` por defecto 1. Evidencia: `routes/clientes.js:21-25`. Test: la misma (clientes 7 y 8).
- **FR-005** *(RN-55)*: La validación del NIF MUST aplicarse solo en el alta; no existe ninguna ruta para modificar un cliente. Evidencia: `routes/clientes.js` (rutas `GET /`, `POST /nuevo`, `POST /:id/baja`). *Sin test específico.*
- **FR-006** *(A-05)*: La baja de un cliente MUST marcar `activo = 0` y NEVER borrarlo, cerrar sus contratos ni tocar sus facturas. Evidencia: `routes/clientes.js:32-37`. Test: «la baja de un cliente es lógica».
- **FR-007** *(A-05)*: La pantalla de nueva factura MUST ofrecer solo clientes y artículos con `activo = 1`. Evidencia: `routes/facturas.js:32-40`. Test: «A-05 / contradicción 08 el desplegable de nueva factura».
- **FR-008** *(A-05)*: El alta manual de factura (spec 004) y la remesa (spec 007) MUST NOT comprobar `activo`: un cliente de baja se factura por petición directa y por la remesa mientras su contrato esté vigente. Evidencia: `routes/facturas.js:44-47`, `scripts/remesa_mensual.js:26-29`. Test: «A-05 / contradicción 08» (tres).
- **FR-009** *(A-53)*: El alta de artículos MUST leer el precio con la regla de la coma (spec 004), usar `config.IVA_DEFECTO` (21) y la unidad «ud» si no se informan, y MUST fallar con 500 y el mensaje de la BD si falta el nombre. Evidencia: `routes/articulos.js:15-24`. Test: «A-22 … artículo».
- **FR-010** *(A-53)*: El alta de contratos MUST fallar con 500 y el mensaje de la BD si faltan cuota o concepto, y MUST aceptar un cliente inexistente. Evidencia: `routes/contratos.js:16-26`. Test: «A-53».
- **FR-011** *(A-06, referencia)*: Los importes de contratos y artículos MUST leerse con la misma regla de la coma que el alta de factura (primera coma → punto), de modo que «1.210,00» se graba como 1,21. Test: «A-06 la cuota «1.210,00» de un contrato nuevo se graba como 1,21».

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-05 | Se factura a clientes de baja | PENDIENTE | TC | FR-006 a FR-008 | «A-05» (tres) |
| A-22 | NIF solo por longitud, solo en el alta | PENDIENTE | TC | FR-001, FR-002, FR-005 | `validarNIF` «A-22»; rutas «A-22» |
| A-53 | Altas de maestros casi sin validar | BUG A SECAS | Corregir en modernización | FR-009, FR-010 | «A-53» |

TC = especificar tal cual. Las correcciones (A-53) corresponden a la modernización, solo hacia delante y por decisión escrita del negocio. Las propuestas P5 (cerrar contratos al dar de baja; factura manual con aviso) y P17 (validar el dígito de control en altas nuevas) son [PROPUESTA DEL CONSULTOR] y no forman parte del comportamiento actual.

### Key Entities *(include if feature involves data)*

- **Cliente**: nombre, NIF (opcional), dirección, CP, población, correo, marca de recargo de equivalencia, días de pago y `activo` (1 o 0).
- **Artículo**: referencia, nombre, precio, tipo de IVA, unidad y `activo`.
- **Contrato (alta)**: cliente, concepto, cuota, tipo de IVA y fecha de alta (spec 006 y 007).
- **Baja lógica**: `activo = 0`; oculta de las pantallas pero no impide facturar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los casos de la batería de NIF (aceptados, rechazados y atípicos de la historia 1) el resultado coincide con el de esta spec.
- **SC-002**: Las 3 anomalías de esta spec (A-05, A-22, A-53) tienen al menos un test que congela su comportamiento actual.
- **SC-003**: Los dos caminos de facturación a un cliente de baja (manual y remesa) están cubiertos por un test cada uno.
- **SC-004**: Cada uno de los 11 requisitos funcionales se puede comprobar con al menos un test existente, salvo FR-005 (sin test específico), que se señala expresamente.
- **SC-005**: Un revisor de Gerencia y Administración puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Emisión manual (fecha, vencimiento, líneas): **spec 004**. Remesa mensual: **spec 007**. Ambas ignoran `activo` y se citan aquí.
- Baja y prorrateo de contratos: **spec 006**.
- Contenido fiscal impreso en la factura: **spec 005**.
- Cómo se ve el NIF en el CSV de la gestoría: **spec 008**.
- Sin autenticación de quien da de alta o baja (A-46): **spec 010**.

## Assumptions

- **SUPOSICIÓN**: «Marga» da de alta y revisa los NIF (comentario de Julián, 2017). No hay acta que confirme que sigue haciéndolo (P17).
- **SUPOSICIÓN**: 5 de los 6 NIF no superan el dígito de control porque la copia analizada está anonimizada; el hecho queda **sin respuesta concluyente**.
- Los ejemplos con clientes proceden de la semilla de `db.js` y de los tests; `datos/gesfact.db` puede ser una copia de esa semilla (A-18). Los NIF no se reproducen.
- Dependencia de otras specs: ninguna para las reglas propias. Las specs 004, 005, 007 y 008 dependen de ésta.
