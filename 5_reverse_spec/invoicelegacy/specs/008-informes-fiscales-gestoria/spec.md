# Feature Specification: Informes fiscales y exportación a la gestoría

**Feature Branch**: `008-informes-fiscales-gestoria`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»; la sección de A-01 **no puede cerrarse** hasta que se decidan PD-01 a PD-05)

**Input**: User description: "Informes fiscales y exportación a la gestoría (routes/informes.js). Alcance: la pantalla de IVA trimestral (suma de líneas) y el CSV anual (cabeceras), sus fronteras de periodo, formato, clave y por qué pueden dar cifras distintas; el IVA 2026. RN: RN-46, RN-47, RN-48, RN-49, RN-50. Anomalías: A-01, A-61, A-40, A-41, A-42, A-43. Dueño natural: Gestoría."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del informe de IVA trimestral y de la exportación CSV a la gestoría de GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
>
> **Reglas de esta spec.**
> - Cada requisito describe el comportamiento ACTUAL y cita su evidencia (fichero y función, o dato real). Esa evidencia es obligatoria (Constitución, Principio II) y por eso aparecen nombres de fichero; no describen cómo construir nada nuevo.
> - Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, con su ID del registro (`specs/000-reconocimiento/registro-de-anomalias.md`).
> - Cada criterio es verificable contra la suite de `test/` (se cita el test) y se ejecuta con `npm test`.
> - Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha).
> - **No se reproducen** la clave del CSV ni los NIF de los clientes; se citan por su nombre de campo.
> - **Hueco de protección**: el golden master **no cubre** esta spec. Se apoya solo en `rutas.test.js` y `semilla.test.js`.

## Actas y estado de aprobación

No existe ninguna entrevista con una persona identificada (`entrevista-negocio.md` no existe). Las decisiones que esta spec cita provienen de:

| Cita | Documento | Persona | Fecha | Valor |
|---|---|---|---|---|
| P1 (A-01) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [CLIENTE SIMULADO] | 2026-11-11 | El modelo 303 del T1 de 2026 se presentó con **736,97 €**, la cifra del CSV (cabeceras) |
| P1-bis (A-01) | `entrevista-negocio-simulada.md` | Administración, **sin identificar**, [CLIENTE SIMULADO] | 2026-11-11 | El cliente de FA-2026-000101 pagó **157,47 €** (la suma de las líneas) |
| P1-ter (A-01) | `entrevista-negocio-simulada.md` | Gerencia, **sin identificar**, [CLIENTE SIMULADO] | 2026-11-11 | Rectificar las 6 facturas descuadradas con RE; **pendiente de firma** (PD-01 a PD-05). Se referencia, no se especifica aquí |
| P21 (A-40) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | El formato y la clave del CSV se mantienen byte a byte |
| Comentario de `routes/informes.js` | Código | «Puri» (gestoría) | 2019 | «Formato acordado con Puri en 2019». CÓDIGO, no acta |
| PR-04 / PD-04 (A-61) | `registro-riesgos.md` / `entrevista-negocio-simulada.md` | [CLIENTE SIMULADO] | 2026-11-12 | Regularizar el IVA: sí; la gestoría decide si es complementaria y quién firma |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). A-01, A-61 y A-40 siguen **PENDIENTE** en el registro; A-41 y A-42 son BUG A SECAS; A-43 es ACCIDENTAL. P1 es el único testimonio con rol claro (Gestoría), pero sin persona identificada. **Esta spec no puede aprobarse** hasta que firme una persona con nombre (PD-08) y se resuelvan PD-01 a PD-05.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La gestoría ve el IVA del trimestre, desglosado por tipo (Priority: P1)

La pantalla de IVA (`/informes/iva`) suma, para un año y un trimestre, las **líneas** de las facturas por tipo de IVA (de mayor a menor), con base, cuota y recargo, y una fila TOTAL. Las rectificativas restan solas porque sus líneas van en negativo. Los importes no se redondean al sumar.

**Why this priority**: es el resumen con el que la gestoría prepara el modelo 303. Una suma mal hecha cambia lo que se declara.

**Independent Test**: pedir el T1 y el T2 de 2026 sobre la semilla. Tests: `rutas.test.js` «RN-46», «RN-47».

**Acceptance Scenarios**:

1. **Given** la semilla, **When** se pide el T1 de 2026, **Then** salen: 21 %: base 2.533,30, cuota 532,00, recargo 6,01; 10 %: 392,20 / 39,22 / 0,00; 4 %: 811,10 / 32,44 / 0,76; TOTAL 3.736,60 / 603,66 / 6,77. Test: «RN-46: IVA del T1 de 2026 por LÍNEAS».
2. **Given** la semilla, **When** se pide el T2 de 2026, **Then** salen: 21 %: 194,15 / 40,77 / 0,00; 10 %: 35,51 / 3,55 / 0,00; TOTAL 229,66 / 44,32 / 0,00. La original FA-2026-000106 (abril, estado «rectificada») y su RE-2026-000001 (mayo) caen ambas en el T2, por eso se compensan; si cayeran en trimestres distintos, no (A-16, spec 005). Test: «RN-47: el T2 incluye las facturas de abril, mayo y la rectificativa».
3. **Given** un año sin facturas (2025), **When** se pide, **Then** la tabla lleva solo la fila TOTAL a 0,00. Test: «año sin facturas».

---

### User Story 2 - El trimestre se define por la fecha de la factura (Priority: P1)

Un trimestre agrupa las facturas cuya **fecha** cae entre el día 1 del primer mes y el «día 31» del último mes. Entran todos los estados (emitida, cobrada, rectificada). La comparación es de texto, por lo que el «31» de abril, junio o septiembre se admite (A-43).

**Why this priority**: decide en qué declaración cae cada factura, incluidas las de la remesa de diciembre lanzada en enero (spec 003, A-10).

**Independent Test**: insertar facturas con fechas de frontera en una BD temporal. Test: «A-43».

**Acceptance Scenarios**:

1. **Given** facturas fechadas 2026-03-31, 04-01, 03-32, 06-30, 06-31, 07-01, 12-31, 2025-12-31 y 2027-01-01 (1 € de base cada una), **When** se piden los cuatro trimestres de 2026, **Then** las bases del tipo 7 % son T1 = 1,00 (03-31); T2 = 3,00 (04-01, 06-30 y 06-31); T3 = 1,00 (07-01); T4 = 1,00 (12-31). La fecha 03-32 no entra en ninguno y las de 2025 y 2027 tampoco. Test: «A-43 el T1 llega hasta «2026-03-31» comparando texto».
2. **Given** la remesa de 2026-12 lanzada el 1-ene-2027, **When** se pide el T4 de 2026, **Then** las tres facturas FA-2027-… (fecha 2026-12-31) entran en el T4 de 2026 y el T1 de 2027 sale a 0,00. Test: `remesa.test.js` «contradicción 05» (cita de la spec 003).
3. **Given** que la fecha de la factura manda, **When** se emite una factura con fecha de otro año, **Then** va al informe de su fecha, no al del número (spec 003).

---

### User Story 3 - Parámetros ausentes, ilegibles o fuera de rango (Priority: P2)

Sin año se usa el del reloj; sin trimestre (o con 0 o texto) se usa el 1. Un trimestre 5 provoca un error 500 con la traza en la respuesta (A-42, A-54).

**Why this priority**: es la forma en que Administración abre el informe «sin tocar nada»; un valor atípico muestra una traza al usuario.

**Independent Test**: pedir el informe con parámetros atípicos. Tests: «RN-48», «A-42 / A-54».

**Acceptance Scenarios**:

1. **Given** el reloj en 2026, **When** se piden `/informes/iva` sin parámetros, con `trimestre=0` o con `trimestre=abc`, **Then** salen las mismas cifras que el T1 de 2026. Test: «RN-48».
2. **Given** `trimestre=5`, **When** se pide, **Then** responde 500 con un `TypeError` y la ruta del fichero en la respuesta. Test: «A-42 / A-54 trimestre=5 → 500».

---

### User Story 4 - El CSV anual para la gestoría tiene un formato fijo y secreto (Priority: P1)

La exportación (`/informes/export-gestoria?anyo=2026`) genera un CSV con **todas** las facturas del año de su fecha (cualquier estado), ordenadas por número como texto. Va con separador `;`, coma decimal, punto de millares, fecha `DD/MM/AAAA` y saltos CRLF. La **primera línea** es `CLAVE;<clave>` y la segunda las cabeceras. Los importes son los de la **cabecera** de cada factura. Formato «acordado con Puri en 2019»; hay que mantenerlo byte a byte.

**Why this priority**: es lo que importa el Contaplus; un cambio de formato rompe la importación (A-40).

**Independent Test**: pedir el CSV de 2026 y compararlo línea a línea. Tests: «RN-49» (dos), «A-40».

**Acceptance Scenarios**:

1. **Given** el CSV de 2026, **When** se descarga, **Then** la respuesta es `text/csv; charset=utf-8`, con `Content-Disposition: attachment; filename="facturas_2026.csv"`. Test: «RN-49: cabeceras de respuesta del CSV».
2. **Given** la semilla, **When** se descarga, **Then** la línea 1 es `CLAVE;<clave de config>`, la 2 `NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO` y siguen las 10 facturas en orden de número; por ejemplo `FA-2026-000102;06/02/2026;Ferretería El Tornillo;<NIF>;115,60;24,28;6,01;145,89;cobrada` y `RE-2026-000001;06/05/2026;Bar Nuevo Siglo;<NIF>;-101,61;-20,62;0,00;-122,23;emitida`. Test: «A-40 / RN-49 formato exacto del CSV».
3. **Given** que no se da el año, **When** se descarga, **Then** se usa el año del reloj; un año sin facturas lleva solo las dos líneas de cabecera. Test: «RN-49: sin año se usa el actual».
4. **Given** las facturas de 2026, **When** se ordenan, **Then** el orden es por número de texto: FA-… antes que RE-…. Test: «A-40».

---

### User Story 5 - La pantalla y el CSV pueden dar cifras distintas (Priority: P1)

La pantalla suma **líneas**; el CSV, **cabeceras**. En la semilla, 6 de las 9 facturas tienen la cabecera distinta de la suma de sus líneas (A-01). Por eso el IVA del T1 de 2026 sale 603,66 € en la pantalla y 736,97 € en el CSV; la base, 3.736,60 frente a 3.688,85; en el año completo, 783,78 € frente a 647,98 € (135,80 €).

**Why this priority**: es el hallazgo con mayor impacto fiscal del reconocimiento. El 303 del T1 se presentó con el importe del CSV (P1), pero el cliente pagó el de las líneas (P1-bis, A-61).

**Independent Test**: calcular el IVA del T1 por las dos vías. Tests: `rutas.test.js` «A-01 / RN-50»; `semilla.test.js` «A-01 / H-01».

**Acceptance Scenarios**:

1. **Given** el T1 de 2026, **When** se suma el IVA de las cabeceras del CSV, **Then** vale 736,97 € y la base 3.688,85 €, mientras la pantalla da 603,66 € de IVA. Test: «A-01 / RN-50».
2. **Given** las 9 facturas de la semilla, **When** se suman sus líneas, **Then** 6 cabeceras no cuadran: FA-2026-000101, -105, -106, -107, -108 y RE-2026-000001; y 3 sí (-102, -103, -104). Test: `semilla.test.js` «A-01 / H-01».
3. **Given** FA-2026-000101, **When** se comparan, **Then** la cabecera dice 27,97 € de IVA y 161,17 € de total, y las líneas 24,27 € y 157,47 €. Test: la misma.
4. **Given** FA-2026-000105, **When** se comparan, **Then** la cabecera dice 468,63 € de IVA y las líneas 339,02 €. Test: la misma.

---

### User Story 6 - El CSV no protege los separadores del texto (Priority: P3)

Un `;` o un salto de línea en el nombre de un cliente desplaza las columnas del CSV: el campo no se entrecomilla ni se escapa (A-41).

**Why this priority**: sin caso real, pero un nombre con `;` rompe la importación de la gestoría.

**Independent Test**: renombrar un cliente con `;` y salto de línea. Test: «A-41».

**Acceptance Scenarios**:

1. **Given** el cliente 6 renombrado a `Bar; "Nuevo"` + salto de línea + `Siglo`, **When** se descarga el CSV, **Then** la fila de FA-2026-000106 sale como `FA-2026-000106;30/04/2026;Bar; "Nuevo"\nSiglo;<NIF>;101,61;…` y se parte en **10 campos** en lugar de 9. Test: «A-41 un «;» o un salto de línea en el nombre».

---

### Edge Cases

- **Estado de la factura**: entran todos los estados (también «rectificada» y las RE). Test: «RN-47».
- **Mezcla de trimestres**: original y rectificativa solo se compensan si caen en el mismo trimestre; con fechas distintas (A-16, spec 005) la RE resta en otro trimestre.
- **Tipos de IVA ausentes**: un trimestre solo muestra los tipos que tienen líneas (el test de A-43 lo comprueba con el tipo 7 %).
- **Importes del CSV**: se escriben con `formatearImporte` (spec 001), no con `redondear2`.
- **Cliente sin NIF**: el campo sale vacío en el CSV (`f.nif || ''`).
- **Clave del CSV**: está en `config.js` en claro (A-47, fuera de las specs de negocio) y se copia a mano a la oficina; no se reproduce aquí.
- **Informe de IVA 2026 y recargo**: la columna de recargo suma el recargo de equivalencia de las líneas (6,77 € en el T1).
- **Año ilegible o 0**: se sustituye por el del reloj (`parseInt(...) || año actual`). Sin test específico.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-46)*: El sistema MUST calcular el informe de IVA sumando las **líneas** de las facturas del periodo agrupadas por tipo de IVA, ordenadas de mayor a menor, con la suma de base, de cuota de IVA y de recargo de cada tipo, sin redondear, más una fila TOTAL. Evidencia: `routes/informes.js:21-29`. Dato real: T1 2026 → totales 3.736,60 / 603,66 / 6,77. Test: «RN-46».
- **FR-002** *(RN-46)*: Las rectificativas MUST restar solas del informe porque sus líneas van en negativo; el sistema MUST NOT excluir ningún estado. Evidencia: `routes/informes.js:21-25` (comentario «las rectificativas entran con signo negativo y cuadran solas»). Test: «RN-47».
- **FR-003** *(RN-47, A-43)*: El sistema MUST seleccionar las facturas del trimestre por su **fecha**, con `fecha >= año-mes inicial-01` y `fecha <= año-mes final-31`, comparadas como texto. Evidencia: `routes/informes.js:17-19, 25`. Test: «A-43».
- **FR-004** *(RN-48)*: El sistema MUST tomar el año del reloj si falta o no se lee, y el trimestre 1 si falta, vale 0 o no se lee. Un trimestre fuera de 1 a 4 MUST provocar un error 500 con la traza visible (A-42, A-54). Evidencia: `routes/informes.js:15-18`. Test: «RN-48»; «A-42 / A-54».
- **FR-005** *(RN-49)*: El sistema MUST generar el CSV con todas las facturas cuya fecha empiece por el año pedido (`fecha LIKE 'AAAA-%'`), ordenadas por número como texto. Evidencia: `routes/informes.js:35-38`. Test: «A-40 / RN-49».
- **FR-006** *(RN-49, A-40)*: El CSV MUST llevar como primera línea `CLAVE;<config.CLAVE_EXPORT_GESTORIA>`, como segunda las cabeceras `NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO`, separador `;`, importes con `formatearImporte` (coma decimal, punto de millares), fecha `DD/MM/AAAA`, NIF vacío si no hay, saltos `\r\n` y sin salto final. Evidencia: `routes/informes.js:40-49`. Test: «A-40 / RN-49» y «RN-49: sin año». Formato «acordado con Puri en 2019».
- **FR-007** *(RN-49)*: El CSV MUST usar los importes de la **cabecera** de cada factura (base, IVA, recargo, total) y el estado tal cual. Evidencia: `routes/informes.js:36-37, 43-45`. Test: «A-40 / RN-49».
- **FR-008** *(RN-49)*: La respuesta MUST ser `text/csv; charset=utf-8` con `Content-Disposition: attachment; filename="facturas_<año>.csv"`. Evidencia: `routes/informes.js:47-48`. Test: «RN-49: cabeceras de respuesta del CSV».
- **FR-009** *(RN-50, A-01)*: Pantalla y CSV MUST seguir calculándose con fuentes distintas (líneas y cabeceras) y pueden dar cifras diferentes. T1 2026: IVA 603,66 (pantalla) frente a 736,97 (CSV); base 3.736,60 frente a 3.688,85. Año 2026: IVA 647,98 (líneas) frente a 783,78 (cabeceras), 135,80 € de diferencia. Evidencia: `routes/informes.js:23-25` y `:36`. Test: «A-01 / RN-50»; `semilla.test.js` «A-01 / H-01».
- **FR-010** *(A-01)*: Las 6 facturas con cabecera distinta de sus líneas (FA-2026-000101, -105, -106, -107, -108 y RE-2026-000001) MUST documentarse **sin especificar**: no se declara cuál de las dos fuentes es la correcta. Test: «A-01 / H-01».
- **FR-011** *(A-61)*: Que el IVA del 303 del T1 se declarase con las cabeceras (736,97 €) y se cobrase por las líneas (diferencia de 133,31 €) MUST documentarse sin especificar. *Sin test: es un hecho fiscal, no de código.* Regularización pendiente de PD-04.
- **FR-012** *(A-41)*: El CSV MUST NOT entrecomillar ni escapar los campos de texto: un `;` o un salto de línea en el nombre del cliente desplaza las columnas. Evidencia: `routes/informes.js:43-45` (`join(';')`). Test: «A-41».
- **FR-013** *(A-42)*: El sistema MUST NOT validar año ni trimestre (ni el mes de la remesa, spec 007): un valor imposible se acepta, falla (trimestre 5) o genera fechas imposibles. Test: «A-42 / A-54»; `remesa.test.js` «A-42 / A-70».

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-01 | Cabecera ≠ líneas; informe ≠ CSV | PENDIENTE | TC las dos fuentes; DSE las 6 facturas | FR-009, FR-010 | «A-01 / RN-50»; `semilla` «A-01» |
| A-61 | IVA 303 declarado por cabeceras, cobrado por líneas | PENDIENTE | DSE | FR-011 | Sin test |
| A-40 | Formato y clave del CSV | PENDIENTE | TC byte a byte | FR-005 a FR-008 | «A-40 / RN-49» |
| A-41 | CSV sin escapar `;` ni saltos | BUG A SECAS | Corregir con la gestoría | FR-012 | «A-41» |
| A-42 | Periodos de informe y remesa sin validar | BUG A SECAS | Corregir | FR-004, FR-013 | «A-42 / A-54» |
| A-43 | Trimestre «-31» como texto | ACCIDENTAL | TC | FR-003 | «A-43» |

TC = especificar tal cual. DSE = documentar sin especificar. Las correcciones (A-41, A-42) corresponden a la modernización, solo hacia delante y de acuerdo con la gestoría.

**Referencia (no se especifica aquí)**: la corrección de las 6 facturas con RE (P1-ter) usa el mecanismo de la spec 005. A-54 (la traza de error visible) es técnica y queda fuera de las specs de negocio (se reasigna aquí si el negocio ve efecto).

### Key Entities *(include if feature involves data)*

- **Informe de IVA**: filas por tipo de IVA con base, cuota y recargo, y fila TOTAL, para un año y trimestre.
- **Exportación a la gestoría**: fichero CSV anual con clave, cabeceras y una fila por factura.
- **Fuente de importes**: líneas (pantalla) frente a cabecera (CSV).
- **Trimestre**: cuatro tramos de tres meses definidos por la fecha de la factura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El T1 y el T2 de 2026 se reproducen al céntimo con `npm test` (603,66 € y 44,32 € de IVA).
- **SC-002**: El CSV de 2026 coincide byte a byte con el esperado por el test «A-40 / RN-49» (clave aparte).
- **SC-003**: La diferencia entre pantalla y CSV en el T1 (133,31 €) se reproduce con los tests; la del año (135,80 €) se verificó con una consulta sobre la BD temporal y no tiene test.
- **SC-004**: Las 6 anomalías de esta spec (A-01, A-40, A-41, A-42, A-43, A-61) están cubiertas por un test o por una nota expresa de «sin test» (A-61).
- **SC-005**: Un revisor de la gestoría puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Cálculo de importes e IVA de una factura: **spec 001**.
- Fecha y número de la factura: **specs 003 y 004**.
- Cómo se corrigen los 6 documentos con rectificativa: **spec 005**.
- Remesa y su validación de meses: **spec 007**.
- Secretos en claro (clave de la gestoría) y trazas de error: plan técnico (A-47, A-54).

## Assumptions

- **SUPOSICIÓN**: el modelo 303 del T1 de 2026 se presentó con 736,97 € (P1, [CLIENTE SIMULADO]); no hay documento que lo acredite.
- **SUPOSICIÓN**: el cliente de FA-2026-000101 pagó 157,47 € (P1-bis, [CLIENTE SIMULADO]).
- El IVA anual por líneas (647,98 €) se ha verificado ejecutando la consulta sobre una BD temporal de la semilla; no hay test que lo fije.
- Los ejemplos con número de factura proceden de la semilla de `db.js`; `datos/gesfact.db` puede ser una copia de esa semilla (A-18).
- La corrección de A-01 queda **sin cerrar** hasta que se resuelvan PD-01 a PD-05 y firme una persona identificada.
- Dependencia de otras specs: usa 001 (formato de importes), 003 (año del número) y 005 (rectificación). La spec 005 depende de ésta para A-01.
