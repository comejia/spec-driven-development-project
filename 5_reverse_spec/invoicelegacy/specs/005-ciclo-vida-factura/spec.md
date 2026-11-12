# Feature Specification: Vida de la factura emitida: cobro, rectificación y consulta

**Feature Branch**: `005-ciclo-vida-factura`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Vida de la factura emitida: cobro, rectificación y consulta. Alcance: estados emitida/cobrada/rectificada, cobro, rectificativa espejo, que las facturas no se borran, qué se imprime al consultarla y qué cuenta como pendiente en el panel. Incluye cómo se corregirían los documentos históricos que no cuadran. RN: RN-41, RN-42, RN-43, RN-44, RN-45. Anomalías: A-20, A-21, A-08, A-16, A-33, A-32, A-49, A-14, A-15. Dueño natural: Gestoría (procedimiento fiscal de rectificar) y Administración (operativa)."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del ciclo de vida de una factura ya emitida en GesFact (cobro, rectificación, consulta e impresión, panel). No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
>
> **Reglas de esta spec.**
> - Cada requisito describe el comportamiento ACTUAL y cita su evidencia (fichero y función, o dato real). Esa evidencia es obligatoria (Constitución, Principio II) y por eso aparecen nombres de fichero; no describen cómo construir nada nuevo.
> - Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, con su ID del registro (`specs/000-reconocimiento/registro-de-anomalias.md`).
> - Cada criterio es verificable contra la suite de `test/` (se cita el test) y se ejecuta con `npm test`.
> - Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha).
> - **Hueco de protección**: el golden master **no cubre** esta spec (solo cubre la emisión y la remesa). Se apoya solo en los tests unitarios y de rutas.

## Actas y estado de aprobación

No existe ninguna entrevista con una persona identificada (`entrevista-negocio.md` no existe). Las decisiones que esta spec cita provienen de:

| Cita | Documento | Persona | Fecha | Valor |
|---|---|---|---|---|
| P3 (A-08) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Sí se rectifica una factura cobrada; una RE nunca pasa a cobrada; la devolución del dinero se registra fuera de GesFact (PD-06) |
| P16 (A-16) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | La RE lleva su propia fecha y se declara en su trimestre |
| P19 (A-32) | `entrevista-negocio-simulada.md` | [CLIENTE SIMULADO] | 2026-11-11 | Datos que el código no genera: **sin respuesta concluyente**; decisión: prohibir editar la BD a mano, todo con RE |
| P21 (A-33) | `entrevista-negocio-simulada.md` | Administración, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | «Pendiente» = solo FA emitidas (3 por 3.032,85 €) |
| P1-ter (A-01) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [CLIENTE SIMULADO] | 2026-11-11 | Rectificar las 6 facturas descuadradas con RE; **pendiente de firma** (PD-01 a PD-05). Se **referencia**, no se especifica aquí |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | A-49: sin respuesta concluyente, hipótesis de copia anonimizada |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). A-08, A-16, A-32, A-33 y A-49 siguen **PENDIENTE** en el registro; A-20 y A-21 son INTENCIONALES (protegidas); A-14 y A-15 son BUG A SECAS. **Esta spec no puede cerrarse** hasta que se decida A-01 (spec 008) y firme una persona identificada (PD-08).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Una factura emitida se cobra y no se borra nunca (Priority: P1)

Una factura emitida puede marcarse como cobrada. Las facturas **no se borran jamás** (requisito legal desde la inspección de 2020): un error se corrige con una rectificativa y una factura nueva. Cobrar solo cambia el estado; no registra fecha ni importe cobrado.

**Why this priority**: el estado «emitida/cobrada» alimenta el panel de pendientes y es lo único que guarda el sistema sobre el cobro. La regla de no borrar está protegida por la Constitución (A-20).

**Independent Test**: marcar como cobradas facturas en todos los estados en una BD temporal; buscar `DELETE` en el código. Tests: `rutas.test.js` «POST /facturas/:id/cobrar»; `semilla.test.js` «A-20».

**Acceptance Scenarios**:

1. **Given** FA-2026-000105 emitida, **When** se pide cobrarla, **Then** pasa a «cobrada» y se redirige a su detalle. Test: «RN-42: una emitida pasa a cobrada».
2. **Given** esa misma factura u otra rectificada o ya cobrada, **When** se pide cobrarla de nuevo, **Then** no cambia nada y se redirige igualmente con éxito (302). Test: «RN-42: cobrar de nuevo, o cobrar una rectificada o ya cobrada».
3. **Given** un identificador de factura inexistente (9999), **When** se pide cobrarla, **Then** también redirige con éxito (302) y no se crea nada. Test: «RN-42: una factura inexistente».
4. **Given** el código del producto, **When** se busca `DELETE` fuera de los comentarios, **Then** no aparece en ningún fichero. Test: «A-20 ningún fichero del producto contiene DELETE».

---

### User Story 2 - Rectificar es hacer el espejo exacto, sin recalcular (Priority: P1)

Para anular una factura entera, el sistema crea una rectificativa en la serie RE con **los mismos importes cambiados de signo**, copia las líneas con la cantidad en negativo y deja la original como «rectificada». No recalcula nada: invierte lo que hay grabado («Puri dixit»: la rectificativa es espejo exacto de la original, comentario del código, A-21). No existe rectificación parcial.

**Why this priority**: es el único mecanismo legal de corrección. Si el espejo no es exacto, la gestoría no puede compensar el IVA declarado.

**Independent Test**: rectificar facturas de la semilla y comparar cabecera y líneas. Tests: `rutas.test.js` «RN-43» (dos), «A-21» (dos).

**Acceptance Scenarios**:

1. **Given** FA-2026-000101 (cobrada, base 133,20 €, IVA 27,97 €, total 161,17 €), **When** se rectifica con el motivo «prueba», **Then** nace una RE con cabecera −133,20 / −27,97 / 0 / −161,17, estado «emitida», serie RE, referencia a FA-2026-000101 y observación «Rectifica FA-2026-000101. prueba». Test: «RN-43: la RE copia la cabecera cambiada de signo».
2. **Given** esa rectificación, **When** se miran las líneas, **Then** cada una lleva el texto «Rectificación: » delante, la cantidad en negativo, el precio unitario positivo y base y cuotas en negativo (por ejemplo, −0,44 × 21,60 con base −9,50 € e IVA −2,00 €). Test: «RN-43: las líneas se copian con la cantidad y los importes en negativo».
3. **Given** la discrepancia cabecera/líneas de FA-2026-000101 (IVA de cabecera 27,97 €, líneas 24,27 €), **When** se rectifica, **Then** la RE conserva la misma discrepancia: cabecera −27,97 €, líneas −24,27 €. Test: «A-21 la RE es el espejo exacto de lo grabado».
4. **Given** FA-2026-000105 con cabecera de 2.287,75 € y líneas que suman 2.335,50 €, **When** se rectifica, **Then** la RE copia las 5 líneas con signo cambiado, sin recalcular (suma −2.335,50 € frente a la cabecera −2.287,75 €). Test: «A-21: la RE de FA-2026-000105».
5. **Given** que la original pasa a «rectificada», **When** se consulta su estado, **Then** vale «rectificada». Test: «A-08 se puede rectificar una factura ya cobrada».

---

### User Story 3 - Qué se puede y qué no se puede rectificar o cobrar (Priority: P1)

El servidor no rectifica una factura ya rectificada ni una rectificativa; sí rectifica una **cobrada**. La pantalla ofrece «Marcar cobrada» y «Rectificar (abono total)» solo a las facturas FA emitidas, pero el servidor acepta más peticiones que la pantalla: por petición directa se puede cobrar una RE y rectificar una cobrada (A-08).

**Why this priority**: marca la diferencia entre lo que se ve y lo que se puede hacer; la modernización no puede asumir que sólo hay un camino.

**Independent Test**: lanzar peticiones directas contra facturas en cada estado y comparar con los botones de la pantalla. Tests: `rutas.test.js` «RN-44», «A-08» (tres), contradicción 09.

**Acceptance Scenarios**:

1. **Given** una factura ya rectificada, **When** se vuelve a rectificar, **Then** 400 «Ya esta rectificada». Test: «RN-44».
2. **Given** una rectificativa (RE), **When** se rectifica, **Then** 400 «No se rectifica una rectificativa». Test: «RN-44».
3. **Given** una factura inexistente, **When** se rectifica, **Then** 404 «Factura no encontrada». Test: «RN-44».
4. **Given** la RE-2026-000001 emitida, **When** se hace una petición directa de cobro, **Then** pasa a «cobrada». Test: «A-08 / contradicción 09 por petición directa se puede cobrar una rectificativa».
5. **Given** la pantalla de detalle, **When** se mira una FA emitida, **Then** ofrece los dos botones; una RE emitida, una FA cobrada y una FA rectificada no ofrecen ninguno. Test: «A-08 / contradicción 09 la pantalla solo ofrece cobrar y rectificar a las FA emitidas».

---

### User Story 4 - La rectificativa lleva la fecha de hoy y sin vencimiento (Priority: P2)

La RE se fecha el **día en que se emite** (no la fecha de la original), sin vencimiento. La observación empieza por «Rectifica <número>. » seguida del motivo; si no se da motivo, acaba en «. » con espacio final. Por eso una RE puede caer en un trimestre distinto al de su original (A-16).

**Why this priority**: afecta a qué trimestre se declara la rectificación (spec 008).

**Independent Test**: rectificar una factura con y sin motivo y comparar fecha, vencimiento y observación. Tests: «A-16 / RN-45» y «RN-45: sin motivo».

**Acceptance Scenarios**:

1. **Given** el reloj en 2026-11-11, **When** se rectifica FA-2026-000101 (fechada en enero), **Then** la RE lleva fecha 2026-11-11 y vencimiento vacío. Test: «A-16 / RN-45».
2. **Given** una rectificación sin motivo de FA-2026-000105, **When** se emite, **Then** la observación es «Rectifica FA-2026-000105. » (con espacio final) y la cabecera −2.287,75 / −468,63 / 0 / −2.756,38. Test: «RN-45: sin motivo».
3. **Given** las dos rectificaciones de prueba, **When** se leen los contadores, **Then** RE vale 3 y FA sigue en 108. Test: «los contadores: RE 3 y FA sin tocar».

---

### User Story 5 - La consulta reimprime con los datos de hoy y el panel cuenta lo pendiente (Priority: P2)

El detalle de una factura es la vista imprimible: datos de la empresa de `config.js`, datos del cliente, líneas y totales. **Los datos del cliente y de la empresa son los de hoy**, no los de cuando se emitió (A-15). El panel de inicio muestra cuántas facturas hay, cuántas «pendientes de cobro» y su importe, con la regla de A-33.

**Why this priority**: lo que se imprime es lo que ve el cliente y la gestoría; el panel es la única vista agregada del cobro.

**Independent Test**: renombrar al cliente y volver a imprimir; contar pendientes en el panel. Tests: `rutas.test.js` «GET /facturas y GET /facturas/:id», «panel de inicio de server.js».

**Acceptance Scenarios**:

1. **Given** FA-2026-000102 y la RE-2026-000001, **When** se consulta su detalle, **Then** se imprime la cabecera de la empresa (Suministros Hidalgo, S.L., B45812390, teléfono «925 511 XXX»), el cliente, las líneas y los totales; la RE sin vencimiento y con «Rectifica a». Tests: «la factura impresa FA-2026-000102» y «la rectificativa impresa RE-2026-000001».
2. **Given** que se renombra al cliente 2 («RENOMBRADO SL», NIF «Z99999999») después de emitir, **When** se vuelve a consultar FA-2026-000102, **Then** sale con el nombre y NIF nuevos. Test: «A-15».
3. **Given** el listado, **When** se filtra por «emitidas», **Then** salen 4 facturas (3 FA y la RE), de más reciente a más antigua: FA-2026-000108, FA-2026-000107, RE-2026-000001 y FA-2026-000105. Sin filtro salen las 9, ordenadas por fecha e id descendentes. Tests: «contradicción 07».
4. **Given** la semilla, **When** se abre el panel, **Then** muestra 9 facturas (histórico), **4** pendientes de cobro (cuenta la RE emitida), **3.032,85 €** de importe pendiente (suma solo las FA emitidas; no resta los −122,23 € de la RE) y 6 clientes activos. Test: «A-33 / contradicción 07 el panel muestra 9 emitidas».
5. **Given** una factura nueva emitida de 100,00 €, **When** se abre el panel, **Then** el importe pendiente pasa a 3.132,85 € y las pendientes a 5. Test: «con una factura nueva emitida de 100,00 €».

---

### User Story 6 - Documentos históricos que el código no reproduce (Priority: P3)

La BD contiene líneas que el código actual **no genera** (café, azúcar, vasos y «Portes»): 7 de las 28 líneas de la semilla no se reproducen con la fórmula de cálculo (A-32), y el teléfono impreso es «925 511 XXX» (A-49). Esta spec los **documenta sin especificar**: no sabemos cuál de las dos versiones es la correcta.

**Why this priority**: sirven de aviso a la modernización sobre el estado real de los datos; la corrección de las 6 facturas descuadradas (A-01) se decide en la spec 008.

**Independent Test**: recalcular las líneas de la semilla y comparar. Tests: `semilla.test.js` «A-32 / H-02», «A-01 / H-01», «A-49».

**Acceptance Scenarios**:

1. **Given** las 28 líneas de la semilla, **When** se recalculan con `calcularLinea`, **Then** exactamente 7 no coinciden con lo grabado. Test: `semilla.test.js` «A-32 / H-02».
2. **Given** las 9 facturas de la semilla, **When** se suman sus líneas, **Then** 6 cabeceras no cuadran y 3 sí. Test: «A-01 / H-01».
3. **Given** la configuración de la empresa, **When** se lee el teléfono, **Then** vale «925 511 XXX». Test: «A-49».

---

### Edge Cases

- **Rectificar una factura sin líneas (A-14)**: la petición **no recibe respuesta**, se crea la RE vacía (cabecera −10 / −2,10 / 0 / −12,10) y la original sigue «emitida». Test: «A-14».
- **Rectificar una factura cobrada**: se permite; la devolución del dinero se registra fuera del sistema. Test: «A-08».
- **Pantalla frente a servidor**: la pantalla ofrece rectificar 3 facturas (las FA emitidas) y el servidor acepta 7 (cobradas más emitidas). Test: contradicción 09.
- **Cobrar sin registrar nada más**: no hay fecha de cobro ni importe cobrado; solo cambia el estado.
- **Estados válidos**: «emitida», «cobrada», «rectificada». La BD no restringe los valores. Test: `semilla.test.js` «estados de la semilla (AD-10)» (4 cobradas FA, 3 emitidas FA, 1 emitida RE, 1 rectificada FA).
- **Factura inexistente en el detalle**: 404 «Factura no encontrada». Test: «factura inexistente → 404».
- **Pérdida de rastro en la reimpresión**: si la empresa cambia de teléfono o dirección, las facturas antiguas se reimprimen con los datos nuevos (A-15).
- **Rectificativa en otro trimestre**: una FA de marzo rectificada en abril deja el IVA original en el T1 y el negativo en el T2 (spec 008).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-41, A-20)*: El sistema MUST NOT borrar facturas ni líneas: no existe ninguna operación de borrado. Los errores se corrigen con rectificativa y factura nueva. Evidencia: ausencia de `DELETE` en el código (`lib/numeracion.js:3-6`, comentario «NO SE BORRAN NUNCA»). Ejemplo: FA-2026-000106 → rectificada, sustituida por FA-2026-000107. Test: `semilla.test.js` «A-20».
- **FR-002** *(RN-42)*: El sistema MUST cambiar el estado a «cobrada» solo si la factura está «emitida»; en cualquier otro caso MUST NOT cambiar nada y MUST redirigir con éxito (302) a su detalle, incluso si el identificador no existe. No registra fecha ni importe, y no mira la serie. Evidencia: `routes/facturas.js:117-122` (`UPDATE … WHERE estado = 'emitida'`). Test: «RN-42» (tres).
- **FR-003** *(RN-43, A-21)*: El sistema MUST crear la rectificativa copiando la cabecera con base, IVA, recargo y total **cambiados de signo**, sin recalcular, con serie RE y número nuevo (spec 003). Evidencia: `routes/facturas.js:141-143`. Test: «RN-43» (dos); «A-21» (dos).
- **FR-004** *(RN-43)*: El sistema MUST copiar cada línea de la original con descripción «Rectificación: » + la original, cantidad, base, IVA y recargo cambiados de signo y el precio unitario sin cambiar. Evidencia: `routes/facturas.js:148-152`. Test: «RN-43: las líneas se copian».
- **FR-005** *(RN-43)*: El sistema MUST rectificar siempre la factura entera (abono total) y NEVER ofrecer rectificación parcial. Evidencia: `routes/facturas.js:123-128` (comentario). Test: «RN-43».
- **FR-006** *(RN-44)*: El sistema MUST responder 404 «Factura no encontrada» si la factura no existe, 400 «Ya esta rectificada» si su estado es «rectificada» y 400 «No se rectifica una rectificativa» si su serie es RE. Una factura **cobrada** SÍ se rectifica. Evidencia: `routes/facturas.js:131-133`. Test: «RN-44»; «A-08 se puede rectificar una factura ya cobrada».
- **FR-007** *(RN-45, A-16)*: El sistema MUST fechar la RE con la fecha de hoy (`util.hoy()`), dejar el vencimiento vacío y poner en observaciones «Rectifica <número original>. » seguido del motivo (cadena vacía si no hay motivo). Evidencia: `routes/facturas.js:141-144`. Test: «A-16 / RN-45»; «RN-45: sin motivo».
- **FR-008** *(RN-45)*: El sistema MUST dejar la original en estado «rectificada» **después** de grabar todas las líneas de la RE y redirigir al detalle de la RE. Evidencia: `routes/facturas.js:152-158`. Test: «RN-43».
- **FR-009** *(A-14)*: Si la original no tiene líneas, el sistema MUST crear la RE (sin líneas) pero NEVER marcar la original como rectificada ni dar respuesta a la petición. Evidencia: `routes/facturas.js:146-158` (el cierre solo se ejecuta cuando se graba una línea). Test: «A-14».
- **FR-010** *(A-14)*: La rectificación MUST ejecutarse sin transacción ni control del error en las líneas. Evidencia: `routes/facturas.js:148-158` (`function () {` sin parámetro de error). *Sin test del fallo a mitad.*
- **FR-011** *(A-08)*: El servidor MUST aceptar el cobro de una RE y la rectificación de una factura cobrada por petición directa, aunque la pantalla no los ofrezca. La pantalla MUST ofrecer «Marcar cobrada» y «Rectificar (abono total)» solo cuando la factura es FA y está emitida. Evidencia: `views/factura_detalle.ejs:47-50`. Test: «A-08 / contradicción 09» (dos).
- **FR-012** *(A-15)*: El detalle MUST componerse con los datos **vivos** del cliente (nombre, NIF, dirección, CP, población, marca de recargo) y de la empresa (`config.EMPRESA`), no con los de la fecha de emisión. Evidencia: `routes/facturas.js:105-114`. Test: «A-15».
- **FR-013** *(A-33)*: El panel MUST contar como «pendientes de cobro» todas las facturas con estado «emitida» (FA y RE), y MUST sumar el importe pendiente solo de las FA emitidas (la RE no resta). Evidencia: `server.js:21-30`. Test: «A-33 / contradicción 07» (dos); «con una factura nueva».
- **FR-014** *(A-49)*: Las facturas MUST imprimir el teléfono de la empresa tal como está en la configuración, incluido el marcador «XXX». Evidencia: `config.js:14`. Test: `semilla.test.js` «A-49».
- **FR-015** *(A-32)*: Las líneas de la BD que el código no reproduce (7 de 28) MUST tratarse como dato, no como regla. Se documentan sin especificar. Test: `semilla.test.js` «A-32 / H-02».

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-20 | Las facturas no se borran (protegida) | INTENCIONAL | TC | FR-001 | `semilla` «A-20» |
| A-21 | Rectificativa espejo exacto (protegida) | INTENCIONAL | TC | FR-003, FR-004 | «A-21» (dos) |
| A-08 | Rectificar una cobrada; cobrar una RE por endpoint | PENDIENTE | TC las dos reglas | FR-006, FR-011 | «A-08» (tres) |
| A-16 | RE fechada hoy, sin vencimiento | PENDIENTE | TC | FR-007 | «A-16 / RN-45» |
| A-33 | Panel: la RE cuenta como pendiente sin sumar importe | PENDIENTE | TC | FR-013 | «A-33» (dos) |
| A-32 | Datos de la BD que el código no genera | PENDIENTE | DSE | FR-015 | `semilla` «A-32 / H-02» |
| A-49 | Teléfono «925 511 XXX» en las facturas | PENDIENTE | TC | FR-014 | `semilla` «A-49» |
| A-14 | Rectificación sin transacción ni control de error | BUG A SECAS | Corregir manteniendo el espejo | FR-009, FR-010 | «A-14» |
| A-15 | Reimpresión con datos vivos | BUG A SECAS | Corregir; no retroactiva | FR-012 | «A-15» |

TC = especificar tal cual. DSE = documentar sin especificar. Las correcciones (A-14, A-15) corresponden a la modernización, solo hacia delante y por decisión escrita del negocio.

**Referencia (no se especifica aquí)**: A-01, la corrección de las 6 facturas descuadradas con RE (P1-ter, pendiente de PD-01 a PD-05). Se especifica en la spec 008 y se ejecutaría con el mecanismo de esta spec.

### Key Entities *(include if feature involves data)*

- **Factura**: número, serie (FA/RE), fecha, vencimiento, cabecera, estado (emitida, cobrada, rectificada) y referencia a la factura que rectifica.
- **Rectificativa (RE)**: espejo de una FA con importes negativos, fecha de emisión y sin vencimiento.
- **Línea**: descripción (con «Rectificación: » en las de una RE), cantidad, precio, tipo de IVA y sus importes.
- **Panel**: cuatro cifras (facturas, pendientes, importe pendiente, clientes activos).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La rectificación de FA-2026-000101 y de FA-2026-000105 reproduce al céntimo las cabeceras y líneas negativas de esta spec.
- **SC-002**: El panel de la semilla muestra 9, 4, 3.032,85 € y 6, y esas cifras cambian como indica la historia 5 al añadir una factura.
- **SC-003**: Las 9 anomalías de esta spec (A-08, A-14, A-15, A-16, A-20, A-21, A-32, A-33, A-49) tienen al menos un test que congela su comportamiento actual.
- **SC-004**: Cada uno de los 15 requisitos funcionales se puede comprobar con al menos un test existente, salvo FR-010 (sin test del fallo a mitad), que se señala expresamente.
- **SC-005**: Un revisor de la gestoría y de Administración puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Origen de la discrepancia cabecera/líneas, fuente del IVA declarado y decisión sobre las 6 facturas: **spec 008**.
- Numeración de la RE: **spec 003**.
- Cálculo de importes: **spec 001**. Descuento y lo que se imprime de él: la regla es de la **spec 002**; aquí solo se documenta que se reimprime con datos vivos.
- Emisión de la factura original: **spec 004**.
- Qué factura se puede cobrar según el cliente (política de bajas): **spec 009**.

## Assumptions

- **SUPOSICIÓN**: el teléfono «925 511 XXX» puede ser una anonimización de la copia analizada y no un dato de producción (hipótesis del Anexo A, sin respuesta concluyente).
- **SUPOSICIÓN**: la devolución del dinero de una factura cobrada y rectificada se registra fuera de GesFact (P3, PD-06); no hay evidencia en el código.
- Los ejemplos con número de factura proceden de `datos/gesfact.db`, que el registro (A-18) señala como posible copia de la semilla de `db.js`. Si la BD real difiere, los datos pueden cambiar; las reglas no.
- «Puri dixit» es un comentario del código (CÓDIGO), no un acta con persona identificada.
- Dependencia de otras specs: usa 001 (importes), 003 (número RE), 004 (alta). La spec 008 depende de ésta para A-01.
