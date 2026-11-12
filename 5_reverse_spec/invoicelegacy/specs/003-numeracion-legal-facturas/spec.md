# Feature Specification: Numeración legal de facturas

**Feature Branch**: `003-numeracion-legal-facturas`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada, ver «Actas y estado de aprobación»)

**Input**: User description: "Numeración legal de facturas. Alcance: formato SERIE-AAAA-NNNNNN, series FA y RE, contador por serie y año, de qué año sale el número y qué garantías (no) da. Requisito legal desde la inspección de 2020. RN: RN-35, RN-36, RN-37, RN-38, RN-39, RN-40. Anomalías: A-19, A-10, A-11, A-12, A-72. Dueño natural: Gestoría."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la numeración de facturas de GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
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
| P15 (A-10) | `entrevista-negocio-simulada.md` | Gestoría, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | El año del número debería ser el de la fecha de expedición; debe validarlo la gestoría. Hasta que firme, se especifica el comportamiento actual |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica P15: el año del número será el de la fecha de expedición; la gestoría debe validar si una remesa lanzada el 1 de enero puede llevar fecha 31 de diciembre. **Nunca retroactiva** |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). La anomalía A-10 sigue **PENDIENTE** en el registro. A-19 es INTENCIONAL (protegida por la Constitución); A-11 y A-12 son BUG A SECAS; A-72 es ACCIDENTAL. Mientras no firme la gestoría (PD-08), esta spec describe el comportamiento actual sin darlo por confirmado por el negocio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cada factura recibe un número con formato legal y correlativo (Priority: P1)

Todo número de factura tiene la forma `SERIE-AAAA-NNNNNN`: la serie, el año y una secuencia de 6 cifras. Hay un contador propio para cada serie y año, que empieza en 1. Es un requisito legal desde la inspección de 2020 (comentario de `lib/numeracion.js`: CÓDIGO).

**Why this priority**: la numeración correlativa es una obligación legal protegida por la Constitución (A-19). Un número mal formado o repetido se ve en la inspección.

**Independent Test**: pedir números sobre la semilla y comprobar formato y correlación. Tests: `formatear` y `siguienteNumero` en `test/numeracion.test.js`.

**Acceptance Scenarios**:

1. **Given** el contador de la serie FA del año 2026 en 108, **When** se pide el siguiente número, **Then** el resultado es FA-2026-000109 y el siguiente FA-2026-000110. Test: «RN-35/RN-36: sobre la semilla (FA 108, RE 1)».
2. **Given** los contadores FA/2026 = 108 y RE/2026 = 1, **When** se piden dos números de FA y uno de RE, **Then** salen FA-2026-000109, FA-2026-000110 y RE-2026-000002, con contadores 110 y 2. Test: la misma.
3. **Given** el formato, **When** se numera a 999.999 y a 1.000.000, **Then** la secuencia crece a 7 cifras sin truncarse. Test: «frontera de los 6 dígitos».
4. **Given** una secuencia en cero, texto numérico, decimal, negativa, nula o vacía, **When** se formatea, **Then** se compone igualmente, sin validar. Test: «cero, texto numérico, decimales, negativos, nulos y vacíos».

---

### User Story 2 - El año nuevo abre un contador nuevo desde 1 (Priority: P1)

Cada año tiene su contador. El primer día en que el reloj marca un año nuevo, el sistema crea el contador de ese año a cero y reparte el 1. El contador del año anterior no se toca.

**Why this priority**: los libros de la gestoría son por año. El primer número de 2027 debe ser FA-2027-000001.

**Independent Test**: numerar con el reloj en 2027 y comprobar que el contador de 2026 sigue igual. Test: `siguienteNumero` «RN-36: año nuevo».

**Acceptance Scenarios**:

1. **Given** el reloj en 2027-03-01 y los contadores de 2026, **When** se numeran dos FA y una RE, **Then** salen FA-2027-000001, FA-2027-000002 y RE-2027-000001, y los contadores de 2026 siguen en 108 y 1. Test: «RN-36: año nuevo».
2. **Given** el reloj a 2026-12-31 23:59:59, **When** se numera, **Then** el número es de 2026; a 2027-01-01 00:00:00 es FA-2027-000001. Test: «frontera de año del reloj».
3. **Given** las 23:30 UTC del 31 de diciembre con el servidor en Europa/Madrid, **When** se numera, **Then** son las 00:30 del 1 de enero y el número es de 2027. Test: «frontera de año con la hora local».

---

### User Story 3 - El año del número es el del reloj, no el de la fecha de la factura (Priority: P1)

El número se compone con el año del **reloj del servidor** en el momento de reservarlo, aunque la factura tenga otra fecha. Una factura fechada el 31 de diciembre de 2025 y grabada en 2026 recibe un número de 2026. Una remesa de diciembre lanzada el 1 de enero recibe fecha 31 de diciembre y número del año nuevo (A-10).

**Why this priority**: es la anomalía más delicada de esta spec: puede dejar una factura de 2026 numerada en 2027, y la gestoría la declara por la fecha. La modernización no debe renumerar nada ya emitido.

**Independent Test**: grabar una factura con fecha de otro año y lanzar la remesa de diciembre en enero. Tests: `numeracion.test.js` «A-10»; `remesa.test.js` «A-10 / contradicción 05»; golden G10 y G12.

**Acceptance Scenarios**:

1. **Given** el reloj en 2025 y los contadores de 2026 en 108, **When** se numeran dos FA, **Then** salen FA-2025-000001 y FA-2025-000002 y el contador de 2026 no se toca. Test: «A-10 / RN-37 el año del número es el del reloj».
2. **Given** una factura manual fechada el 2025-12-31 grabada con el reloj en 2026-11-11, **When** se graba, **Then** el número es FA-2026-000118 y la fecha sigue siendo 2025-12-31. Golden G10.
3. **Given** la remesa de 2026-12 lanzada el 2027-01-01, **When** se ejecuta, **Then** las tres facturas llevan fecha 2026-12-31 y números FA-2027-000001 a FA-2027-000003 (108,90 €, 175,45 € y 108,90 €), y el contador de FA/2026 sigue en 108. Test: `remesa.test.js` «A-10 / contradicción 05»; golden G12 (con la semilla de 4 contratos del caso).
4. **Given** esa misma remesa, **When** se consultan los informes, **Then** las facturas FA-2027-… entran en el CSV de 2026 (por su fecha) y en el T4 de 2026, y el CSV de 2027 sale vacío. Test: `remesa.test.js` «contradicción 05». *(El comportamiento de los informes se especifica en la spec 008.)*

---

### User Story 4 - El número se reserva antes de grabar y no está protegido frente a concurrencia (Priority: P2)

El sistema consume el número antes de grabar la factura. Si la grabación falla, ese número queda perdido y aparece un **hueco** en la serie (A-12). Además, si dos personas graban a la vez el sistema no garantiza que los números sean distintos: el 2 de enero de 2021 salieron dos facturas con el mismo número (A-11).

**Why this priority**: los huecos y los duplicados son un riesgo legal. La spec los documenta tal cual; no se corrigen aquí.

**Independent Test**: pedir números sin grabar facturas y comprobar que se consumen; comprobar que la BD no obliga a números únicos. Tests: `numeracion.test.js` «A-12»; `semilla.test.js` «A-11».

**Acceptance Scenarios**:

1. **Given** el contador en 108, **When** se piden dos números y no se graba ninguna factura, **Then** salen FA-2026-000109 y FA-2026-000110 y el contador queda en 110. Test: «A-12 / RN-38».
2. **Given** la tabla de facturas, **When** se graba una factura con un número repetido, **Then** la BD lo acepta (no hay restricción de unicidad). Test: `semilla.test.js` «A-11 facturas.numero no tiene restricción de unicidad».
3. **Given** dos grabaciones simultáneas, **When** leen el mismo contador, **Then** pueden obtener el mismo número. *Sin test: la carrera real no es reproducible de forma determinista; el hecho se apoya en el comentario del código y en la nota del registro (RN-39).*

---

### User Story 5 - Hay dos series, pero el sistema no las vigila (Priority: P3)

Las facturas normales llevan la serie FA y las rectificativas la serie RE, cada una con su contador. El código **no comprueba** la serie: cualquier texto abre su propio contador (A-72).

**Why this priority**: es un efecto accidental sin caso real, pero la modernización necesita saber que la lista de series no está en el código.

**Independent Test**: numerar con series inventadas. Test: `numeracion.test.js` «A-72».

**Acceptance Scenarios**:

1. **Given** las series «FA» y «RE», **When** se numera alternándolas, **Then** salen FA-2026-000109, RE-2026-000002, FA-2026-000110 y RE-2026-000003, con contadores independientes. Test: «A-19 formato SERIE-AAAA-NNNNNN y contador propio por serie».
2. **Given** las series «XX», «fa» y la serie vacía, **When** se numera, **Then** salen XX-2026-000001, XX-2026-000002, fa-2026-000001 y -2026-000001, cada una con su contador (y «fa» es distinta de «FA»). Test: «A-72».
3. **Given** la firma de la función, **When** se mira cómo se numera, **Then** solo recibe la serie y no la fecha de la factura. Test: «A-19: el número no depende de la fecha de la factura».

---

### Edge Cases

- **Número más allá de 999.999**: pasa a 7 cifras sin truncar; ningún dato real se acerca. Test: «frontera de los 6 dígitos».
- **Reloj atrasado**: si el reloj marca un año anterior a los contadores existentes, se abre (o reutiliza) el contador de ese año anterior sin avisar (A-72). Test: «A-10 / RN-37» (reloj en 2025).
- **Cada petición consume un número**: pedir sin grabar deja hueco (A-12). Una factura rechazada por falta de líneas **no** consume número porque se valida antes (spec 004, RN-27).
- **Fallo al grabar la factura tras reservar el número**: el hueco no se rellena.
- **Hora local**: el año se obtiene con la zona horaria del servidor; las 23:30 UTC del 31 de diciembre ya son del año nuevo en Madrid. Test: «frontera de año con la hora local».
- **Tabla de contadores**: la semilla trae FA/2026 en 108 y RE/2026 en 1 (`db.js:176-177`). Las facturas de la BD llegan hasta FA-2026-000108.

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(RN-35, A-19)*: El sistema MUST componer el número de factura como `SERIE-AAAA-NNNNNN`: la serie, un guion, el año de 4 cifras, un guion y la secuencia rellena con ceros hasta 6 cifras. Evidencia: `formatear`, `lib/numeracion.js:38-42`. Dato real: contador FA/2026 = 108 → último FA-2026-000108, siguiente FA-2026-000109. Test: `formatear` «RN-35»; `siguienteNumero` «A-19».
- **FR-002** *(RN-35)*: El sistema MUST seguir creciendo a 7 cifras cuando la secuencia supere 999.999, sin truncar. Evidencia: `lib/numeracion.js:38-42`. Test: «frontera de los 6 dígitos».
- **FR-003** *(RN-35)*: El sistema MUST formatear sin validar la secuencia: cero, texto numérico, decimal, negativa, nula o vacía se componen igual. Evidencia: `lib/numeracion.js:38-42`. Test: «cero, texto numérico, decimales, negativos, nulos y vacíos».
- **FR-004** *(RN-36)*: El sistema MUST llevar un contador por cada pareja (serie, año) y MUST empezar cada contador nuevo en 1. Cuando no existe el contador del año del reloj, MUST crearlo a cero y repartir el 1, sin tocar los contadores de otros años. Evidencia: `siguienteNumero`, `lib/numeracion.js:14-28`; tabla `contadores`, `db.js:76-80`. Dato: contadores FA|2026|108 y RE|2026|1; primer número de 2027: FA-2027-000001. Test: «RN-36: año nuevo».
- **FR-005** *(RN-37, A-10)*: El sistema MUST tomar el año del número del reloj del sistema en el momento de reservarlo (`new Date().getFullYear()`, hora local del servidor), y NEVER de la fecha de la factura. Evidencia: `lib/numeracion.js:15`; la función recibe solo la serie. Dato: remesa de 2026-12 lanzada el 1-ene-2027 → fecha 2026-12-31 y número FA-2027-000001. Test: «A-10 / RN-37»; «frontera de año del reloj»; «A-19: el número no depende de la fecha»; golden G10 y G12.
- **FR-006** *(RN-38, A-12)*: El sistema MUST incrementar el contador y devolver el número **antes** de que se grabe la factura. Una petición que no se acompañe de grabación deja un hueco que no se reutiliza. Evidencia: `reservar`, `lib/numeracion.js:30-36`; `routes/facturas.js:71` (la llamada precede al INSERT). Test: «A-12 / RN-38».
- **FR-007** *(RN-39, A-11)*: El sistema MUST NOT garantizar la unicidad del número ante grabaciones simultáneas: lee el contador y lo actualiza en dos operaciones separadas, sin transacción ni restricción de unicidad en la BD. Evidencia: `lib/numeracion.js:9-12` (comentario del incidente del 2-ene-2021), `db.js` (tabla `facturas`). Test: `semilla.test.js` «A-11» (parte determinista). *Sin test de la carrera real.*
- **FR-008** *(RN-40, A-72)*: El sistema MUST aceptar cualquier texto como serie y abrir su contador, sin lista de series válidas. Las series de negocio son FA (facturas) y RE (rectificativas). Evidencia: `lib/numeracion.js:14-28`. Test: «A-72».
- **FR-009** *(RN-40, A-19)*: El sistema MUST numerar de forma independiente las series FA y RE, cada una con su secuencia por año. Test: «A-19 formato SERIE-AAAA-NNNNNN y contador propio por serie».
- **FR-010** *(A-10)*: Una remesa de diciembre lanzada en enero MUST dejar las facturas con fecha de diciembre y número del año nuevo, de modo que entren en el CSV y en el T4 del año anterior. Evidencia: `scripts/remesa_mensual.js`; `routes/informes.js`. Test: `remesa.test.js` «A-10 / contradicción 05» (dos); golden G12.
- **FR-011** *(A-10, A-11, A-12)*: Cualquier corrección de A-10, A-11 o A-12 en la modernización MUST ser solo hacia delante: las facturas ya emitidas NEVER se renumeran (Constitución, Principio I; RN-41, spec 005).

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-19 | Formato `SERIE-AAAA-NNNNNN`, series FA y RE (protegida) | INTENCIONAL | TC | FR-001, FR-009 | «A-19» (dos) |
| A-10 | Año del número = reloj, no fecha de la factura | PENDIENTE | TC; nunca retroactiva | FR-005, FR-010 | «A-10»; golden G10, G12 |
| A-11 | Contador no atómico; número no único en BD | BUG A SECAS | Corregir en modernización | FR-007 | `semilla.test.js` «A-11» |
| A-12 | Hueco por reserva previa | BUG A SECAS | Corregir en modernización | FR-006 | «A-12» |
| A-72 | Acepta cualquier serie; no vigila reloj atrasado | ACCIDENTAL | TC | FR-008 | «A-72» |

TC = especificar tal cual. Las correcciones (A-11, A-12) corresponden a la modernización, solo hacia delante y por decisión escrita del negocio.

### Key Entities *(include if feature involves data)*

- **Número de factura**: texto `SERIE-AAAA-NNNNNN`; es el identificador legal visible.
- **Contador**: una fila por (serie, año) con el último número repartido.
- **Serie**: FA (factura) o RE (rectificativa).
- **Reloj del sistema**: fuente del año del número (no la fecha de la factura).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los casos de la sección de escenarios el número, la secuencia y los contadores coinciden con los de esta spec.
- **SC-002**: Los casos G10 y G12 del golden master (año del reloj frente a la fecha y remesa de diciembre lanzada en enero) pasan (`npm test`).
- **SC-003**: Las 5 anomalías de esta spec (A-10, A-11, A-12, A-19, A-72) tienen al menos un test que congela su comportamiento actual; la carrera real de A-11 queda anotada como no reproducible.
- **SC-004**: Cada uno de los 11 requisitos funcionales se puede comprobar con al menos un test existente o una nota explícita de «sin test», sin escribir código nuevo.
- **SC-005**: Un revisor de la gestoría puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Fecha de la factura, vencimiento y estado inicial: **spec 004**.
- Qué factura se rectifica y con qué número (RE): **spec 005**.
- La remesa de diciembre como proceso (qué contratos entran): **spec 007**.
- Cómo se reparte la factura por año en los informes: **spec 008**.
- El borrado: las facturas no se borran nunca (A-20): **spec 005**.

## Assumptions

- **SUPOSICIÓN**: la gestoría lleva sus libros por año de la **fecha** de la factura; la propuesta de A-10 se apoya en esa idea y debe validarla (P15, sin respuesta concluyente).
- **SUPOSICIÓN**: el requisito legal «correlativa y sin huecos dentro de cada serie y año» procede del comentario de `lib/numeracion.js` (CÓDIGO) y de la inspección de 2020 citada en él; no hay acta con persona identificada.
- El incidente del 2 de enero de 2021 (dos facturas con el mismo número) procede de un comentario del código; Julián escribe «no ha vuelto a pasar (creo)».
- Los ejemplos con número de factura proceden de `datos/gesfact.db`, que el registro (A-18) señala como posible copia de la semilla de `db.js`. Si la BD real difiere, los contadores pueden cambiar; las reglas no.
- Los tests de numeración fijan el reloj y usan una BD temporal; `datos/gesfact.db` no se abre.
- Dependencia de otras specs: las specs 004, 005 y 007 usan la numeración de esta spec.
