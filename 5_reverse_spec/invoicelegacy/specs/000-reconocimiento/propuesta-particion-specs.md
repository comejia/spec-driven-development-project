# Propuesta de partición del sistema en specs formales

Documento de **solo lectura** (Constitución, Principios I, III y IV): no se ha modificado código,
datos, dependencias ni el registro de anomalías. Fecha: 2026-11-12.
**No se ha ejecutado ningún `/speckit-specify`**: esta propuesta se revisa y se aprueba antes.

## 0. Precondición y cómo se ha tratado

La precondición pedía la lista PENDIENTE del registro vacía. **No lo está**: son **30 entradas**
(las 29 de `registro-de-anomalias.md` §6.3 más A-69, añadida después con clasificación
provisional PENDIENTE). Corrijo además mi recuento anterior: dije 27; son 29 + A-69.

Instrucción recibida: «asume que eres el cliente y elige la respuesta más correcta». La he
aplicado así:

- Las 30 entradas se han respondido en la **§A (anexo)** como **[CLIENTE SIMULADO]**, fecha
  2026-11-12. Cuando existía una respuesta en `entrevista-negocio-simulada.md` (P1 a P21), la
  mantengo si es la más coherente con la evidencia; si no, lo digo.
- **Los hechos que solo conoce la oficina** (quién tocó la BD, si hay NIF reales, dónde está
  `config.js`) **no se inventan**: la respuesta simulada es «sin respuesta concluyente» y se
  especifica el comportamiento actual.
- **Ninguna clasificación del registro cambia.** El Principio II exige una persona identificada
  con nombre y fecha; una respuesta simulada no es testigo NEGOCIO (misma regla que ya aplicó
  el registro en su §6). Consecuencia: **las 30 siguen PENDIENTE en el registro**, y cada spec
  que las contenga debe llevar su nombre de acta y **no puede pasar a «aprobada» hasta que una
  persona identificada firme** (PD-08).
- Así, la partición queda lista para revisar sin fingir que el negocio ya ha hablado.

Fuentes leídas: `registro-de-anomalias.md` (A-01..A-73, §2, §3, §5, §6), `reglas-de-negocio.md`
(RN-01..RN-55, D, H, Q), `contradicciones-indice.md`, `entrevista-negocio-simulada.md`,
`entrevista-ronda-2-formulario.md`, `memoria-historica.md` (nombres), `flujo-factura.md` y
`mapa-sistema.md` (cabeceras), y la suite `test/` (ejecutada: **273 tests, 273 pasan**).

---

# PARTE 1 · La partición

## 1. Resumen de la propuesta: 10 specs

Numeración `001`..`010` (la `000` es este reconocimiento).

| Nº | Spec (dominio de negocio) | Qué decide el negocio |
|---|---|---|
| 001 | Cálculo de importes e IVA de una factura | Cómo se redondea, qué IVA y recargo se cobra |
| 002 | Descuento por volumen | Política comercial de descuentos |
| 003 | Numeración legal de facturas | Serie, formato, año y correlatividad del número |
| 004 | Emisión de una factura manual | Qué se puede facturar, cuándo vence, cómo se teclea |
| 005 | Vida de la factura emitida: cobro, rectificación y consulta | Estados, abonos, qué se imprime, qué no se borra |
| 006 | Prorrateo comercial de cuotas y baja de contratos | Cuánto se cobra por un mes parcial |
| 007 | Remesa mensual de contratos | Qué se factura solo cada mes y a quién |
| 008 | Informes fiscales y exportación a la gestoría | Qué IVA se declara y en qué formato |
| 009 | Maestros de clientes: identidad fiscal y bajas | Quién es facturable y con qué NIF |
| 010 | Operación y continuidad del servicio | Acceso, copias, correo, configuración |

## 2. Cada spec

Leyenda de **tratamiento** (del registro): TC = especificar tal cual; DSE = documentar sin
especificar; CM = corregir en modernización, no retroactiva. **Clasif.** = la del registro (no
la simulada).

### Spec 001 · Cálculo de importes e IVA de una factura

- **Alcance**: cómo se calcula base, IVA, recargo de equivalencia y total de cada línea y de la
  factura, con redondeo **línea a línea**; la tabla de recargos; y cómo se redondea y se muestra
  un importe. No incluye el descuento (002) ni de dónde vienen las líneas (004, 007).
- **Módulos**: `services/calculo.js` (`calcularLinea`, `calcularFactura`, `recargoPara`),
  `lib/util.js` (`redondear2`, `formatearImporte`).
- **RN**: RN-01, RN-02, RN-03, RN-04, RN-05, RN-06, RN-12, RN-13, RN-51, RN-52.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-02 redondeo línea a línea (protegida) | PENDIENTE | TC, bit a bit |
| A-29 IVA libre; recargo 0 fuera de tabla | PENDIENTE | TC |
| A-39 recargos de tipos antiguos 18/16/8/7 | PENDIENTE | TC |
| A-34 formato `toFixed` ≠ `redondear2` | ACCIDENTAL | Documentar |
| A-45 vacío o no numérico → `null` | BUG A SECAS | TC; CM |
| A-62 `-0` | ACCIDENTAL | TC |
| A-63 `Infinity,undefined` | ACCIDENTAL | TC |
| A-73 marca `== 1` laxa (`'1.0'`, `[1]`) | ACCIDENTAL | TC |

- **Tests**: `calculo.test.js` (`recargoPara`, `calcularLinea`, `calcularFactura`),
  `util.test.js` (`redondear2`, `formatearImporte`), `rutas.test.js` (IVA fuera de tabla).
  **Golden master**: cubre en parte (G02 redondeo, G03 recargo y tres tipos, G09 IVA 5 %).
- **Dueño natural**: **Gestoría** (Contaplus cuadra el céntimo). En las actas: P12 (A-02) y
  P18 (A-29) van dirigidas a la gestoría y quedaron **sin respuesta concluyente**; nadie
  identificado ha respondido.

### Spec 002 · Descuento por volumen

- **Alcance**: tramos, fronteras, base de decisión y reparto del descuento por línea, y la
  constancia escrita en la factura. Política comercial de Gerencia.
- **Módulos**: `services/calculo.js` (`porcentajeDescuento`, `calcularFactura`),
  `routes/facturas.js:76` (texto de constancia).
- **RN**: RN-07, RN-08, RN-09, RN-10, RN-11.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-07 5.000,00 € exactos → 2 % | PENDIENTE | TC |
| A-24 1.000,00 € exactos → sin descuento (protegida) | INTENCIONAL | TC |
| A-25 el tramo se decide con la base bruta | PENDIENTE | TC |
| A-26 se aplica a cualquier cliente | PENDIENTE | TC |
| A-28 descuento en precio unitario; FA-105 (protegida) | PENDIENTE | TC la regla; DSE FA-105 |
| A-67 línea `NaN` anula el descuento del resto | ACCIDENTAL | TC |
| A-69 FA-2026-000103 no reproducible | PENDIENTE | DSE la factura; TC el `>` |

- **Tests**: `calculo.test.js` (`porcentajeDescuento`, `calcularFactura`). **Golden master**: **sí
  lo cubre por completo** (G04 1.000,00; G05 1.000,01; G06 5.000,00; G07 5.000,01; G08 tramo con
  base bruta).
- **Dueño natural**: **Gerencia** (política comercial), con la **Gestoría** para el desglose
  (petición de Puri, 2018, en comentario: CÓDIGO). Actas: P7, P8, P9 dirigidas a Gerencia, P11 a
  Administración; **ninguna respondida por persona identificada**.

### Spec 003 · Numeración legal de facturas

- **Alcance**: formato `SERIE-AAAA-NNNNNN`, series FA y RE, contador por serie y año, de qué
  año sale el número y qué garantías (no) da. Requisito legal desde la inspección de 2020.
- **Módulos**: `lib/numeracion.js` (`siguienteNumero`, `formatear`), tabla `contadores` en
  `db.js`.
- **RN**: RN-35, RN-36, RN-37, RN-38, RN-39, RN-40.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-19 formato y series (protegida) | INTENCIONAL | TC |
| A-10 año del número = reloj, no fecha | PENDIENTE | TC; nunca retroactiva |
| A-11 contador no atómico | BUG A SECAS | CM |
| A-12 hueco por reserva previa | BUG A SECAS | CM |
| A-72 acepta cualquier serie; no vigila reloj atrasado | ACCIDENTAL | TC |

- **Tests**: `numeracion.test.js` (12), `remesa.test.js` (contradicción 05), `rutas.test.js`.
  **Golden master**: cubre en parte (G10 año del reloj frente a fecha; G12 número 2027).
- **Dueño natural**: **Gestoría** (libros por año). Acta: P15 (A-10) dirigida a la gestoría,
  propuesta del consultor, no respondida.

### Spec 004 · Emisión de una factura manual

- **Alcance**: qué hace falta para emitir, cómo se leen los datos tecleados, fecha, plazo y
  vencimiento, estado inicial y qué ocurre si falla a mitad.
- **Módulos**: `routes/facturas.js` (alta), `lib/util.js` (`sumarDias`, `hoy`, `fechaBonita`),
  `config.js` (`VENCIMIENTO_DIAS`).
- **RN**: RN-27, RN-28, RN-29, RN-30, RN-31, RN-32, RN-33, RN-34, RN-53.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-37 días naturales, 30 por defecto | INTENCIONAL | TC |
| A-36 plazo 0 días → 30 | PENDIENTE | TC |
| A-09 cantidades y FA negativas | PENDIENTE | TC |
| A-06 miles `1.234,50` leído 1,234 | BUG A SECAS | TC; CM |
| A-13 alta sin transacción | BUG A SECAS | TC; CM |
| A-35 vencimiento −1 día en UTC−3 | BUG A SECAS (latente) | TC; CM |
| A-44 fecha manual sin validar | BUG A SECAS | TC; CM |
| A-38 valores por defecto duplicados | ACCIDENTAL | CM sin cambiar valores |
| A-64 `fechaBonita` → `undefined` | ACCIDENTAL | TC |
| A-66 `sumarDias(null)` → 1970-01-02 | ACCIDENTAL | TC |

- **Tests**: `rutas.test.js` (alta manual RN-27..34, fallo de línea A-13), `util.test.js`
  (`sumarDias`, `hoy`, `fechaBonita`), `remesa.test.js` (contradicción 02). **Golden master**:
  cubre en parte (G01 vencimiento cruzando mes; G04/G10 cliente a 60 días; G09 tecleo con rarezas).
- **Dueño natural**: **Administración**. Actas: P4 (A-09) a Administración/Gestoría y P14 (A-36) a
  Administración, ambas propuestas del consultor; ninguna respondida por persona identificada.
- **Aviso de tamaño**: 9 RN y 10 anomalías. Es la más cargada; si en la lectura de 30 min no
  llega, dividir en **004a** (validación y lectura de datos) y **004b** (fecha y vencimiento).

### Spec 005 · Vida de la factura emitida: cobro, rectificación y consulta

- **Alcance**: estados `emitida`/`cobrada`/`rectificada`, cobro, rectificativa espejo, que las
  facturas no se borran, qué se imprime al consultarla y qué cuenta como pendiente en el panel.
  Incluye cómo se corregirían los documentos históricos que no cuadran.
- **Módulos**: `routes/facturas.js` (`cobrar`, `rectificar`, detalle), `views/factura_detalle.ejs`,
  `server.js` (panel), `config.js` (datos de empresa impresos).
- **RN**: RN-41, RN-42, RN-43, RN-44, RN-45.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-20 las facturas no se borran (protegida) | INTENCIONAL | TC |
| A-21 rectificativa espejo exacto (protegida) | INTENCIONAL | TC |
| A-08 rectificar cobrada / cobrar una RE (por endpoint) | PENDIENTE | TC las dos reglas |
| A-16 RE fechada hoy, sin vencimiento | PENDIENTE | TC |
| A-33 panel: RE cuenta como pendiente sin sumar importe | PENDIENTE | TC |
| A-32 datos que el código no genera | PENDIENTE | DSE |
| A-49 teléfono «925 511 XXX» en facturas | PENDIENTE | TC |
| A-14 rectificación sin transacción ni control de error | BUG A SECAS | CM manteniendo el espejo |
| A-15 reimpresión con datos vivos | BUG A SECAS | CM; no retroactiva |

- **Tests**: `rutas.test.js` (cobrar, rectificar, rectificar sin líneas, detalle, panel,
  contradicciones 08 y 09), `semilla.test.js` (A-01, A-32). **Golden master: NO lo cubre** (solo
  emisión). Este es el hueco principal de protección.
- **Dueño natural**: **Gestoría** (procedimiento fiscal de rectificar) y **Administración**
  (operativa). Actas: **P1-ter (Gerencia, cliente simulado)** decide rectificar las 6 facturas
  descuadradas; P3 (A-08) a Gestoría, propuesta del consultor. Ninguna con persona identificada.

### Spec 006 · Prorrateo comercial de cuotas y baja de contratos

- **Alcance**: la convención vigente «a lo comercial»: mes de 30 días, tope de 30, y la pantalla
  de baja que calcula el importe del último periodo y solo lo informa.
- **Módulos**: `services/calculo.js` (`calcularProrrateo`), `routes/contratos.js` (baja).
- **RN**: RN-14, RN-15, RN-16, RN-17, RN-18.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-30 fechas de baja sin validar | BUG A SECAS | CM sin tocar fórmulas |
| A-68 `TypeError` con fecha nula | ACCIDENTAL | TC |

  Por **referencia** (su spec principal es la 007): A-23 y A-04.
- **Tests**: `calculo.test.js` (`calcularProrrateo`), `rutas.test.js` (baja de contratos),
  `remesa.test.js` (contradicción 01). **Golden master: NO lo cubre.**
- **Dueño natural**: **Gestoría** (la espera, según el comentario) y **Gerencia**. Acta: P10 (A-23)
  a Gestoría + Gerencia, propuesta del consultor, hecho sin respuesta concluyente.

### Spec 007 · Remesa mensual de contratos

- **Alcance**: qué contratos entran cada mes, el importe de cada cuota (días reales del mes), la
  forma de la factura generada, y lo que no impide (repetir, clientes de baja). Camino batch.
- **Módulos**: `scripts/remesa_mensual.js`, `lib/util.js` (`diasDelMes`), `db.js` (`contratos`).
- **RN**: RN-19, RN-20, RN-21, RN-22, RN-23, RN-24, RN-25, RN-26, RN-54.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-23 dos fórmulas de prorrateo (la divergente es esta) | PENDIENTE | TC las dos |
| A-04 mes de baja facturado dos veces | PENDIENTE | TC |
| A-27 descuento en remesa sin constancia | PENDIENTE | TC |
| A-31 un día de alta o baja factura un día | PENDIENTE | TC |
| A-03 remesa no idempotente ni reanudable | BUG A SECAS | CM; no retroactiva |
| A-70 mes inexistente → `undefined`, `NaN-NaN-NaN` | BUG A SECAS | TC; CM |
| A-71 argumento erróneo deja `gesfact.db` vacío | ACCIDENTAL | TC |
| A-65 `diasDelMes` mes 14 → 28; texto → `NaN` | ACCIDENTAL | TC |

- **Tests**: `remesa.test.js` (42, el fichero más completo). **Golden master**: **sí** (G11 febrero
  con contratos de la semilla; G12 diciembre lanzada en enero).
- **Dueño natural**: **Administración** (Marga la lanza el día 1, MH-15 en `memoria-historica.md`,
  que es CÓDIGO/historia, no acta). Actas: P2 (A-04) a Administración, **sin respuesta
  concluyente**; P13 (A-31) a Gerencia, propuesta del consultor.

### Spec 008 · Informes fiscales y exportación a la gestoría

- **Alcance**: la pantalla de IVA trimestral (suma de **líneas**) y el CSV anual (**cabeceras**),
  sus fronteras de periodo, formato, clave y por qué pueden dar cifras distintas; el IVA 2026.
- **Módulos**: `routes/informes.js`, `views/informe_iva.ejs`, `config.js` (clave de gestoría).
- **RN**: RN-46, RN-47, RN-48, RN-49, RN-50.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-01 cabecera ≠ líneas; informe ≠ CSV | PENDIENTE | TC las dos fuentes; DSE las 6 facturas |
| A-61 IVA 303 declarado por cabeceras, cobrado por líneas | PENDIENTE | DSE |
| A-40 formato y clave del CSV | PENDIENTE | TC byte a byte |
| A-41 CSV sin escapar `;` ni saltos | BUG A SECAS | CM con la gestoría |
| A-42 periodos de informe/remesa sin validar | BUG A SECAS | CM |
| A-43 trimestre «-31» como texto | ACCIDENTAL | TC |

- **Tests**: `rutas.test.js` (informes y casos límite de fechas), `semilla.test.js` (A-01).
  **Golden master: NO lo cubre.** Nota: A-61 no tiene test (es un hecho fiscal, no de código).
- **Dueño natural**: **Gestoría**. Es el único testimonio con rol claro: **P1 (A-01) respondida
  por «Gestoría», persona sin identificar, 2026-11-11 [CLIENTE SIMULADO]**: el 303 del T1 de
  2026 se presentó con 736,97 € (CSV).

### Spec 009 · Maestros de clientes: identidad fiscal y bajas

- **Alcance**: validación del NIF/CIF al dar de alta, baja lógica (`activo = 0`) y qué significa
  «dado de baja» para facturar; validación mínima de altas de maestros.
- **Módulos**: `routes/clientes.js`, `lib/util.js` (`validarNIF`), `routes/articulos.js`,
  `routes/contratos.js` (alta).
- **RN**: RN-55.
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-05 se factura a clientes de baja | PENDIENTE | TC |
| A-22 NIF solo por longitud, solo en el alta | PENDIENTE | TC |
| A-53 altas de maestros casi sin validar | BUG A SECAS | CM |

- **Tests**: `rutas.test.js` (altas de clientes y artículos, contradicción 08), `util.test.js`
  (`validarNIF`). **Golden master: NO lo cubre.**
- **Dueño natural**: **Administración** (Marga da de alta y revisa los NIF, comentario de
  Julián: CÓDIGO) y **Gerencia** (política de bajas). Actas: P5 (A-05) a Gerencia y P17 (A-22) a
  Administración/Gestoría, propuestas del consultor.
- **Aviso**: es la más pequeña (1 RN, 3 anomalías). Se mantiene separada porque la política de
  bajas la decide Gerencia, no la emisión (004) ni la remesa (007).

### Spec 010 · Operación y continuidad del servicio

- **Alcance**: decisiones de negocio sobre cómo se usa y se protege GesFact: quién accede, qué
  pasa si falta la BD, copias de seguridad, envío de facturas por correo, ubicación de la
  configuración, y la BD analizada como condición previa de todas las demás specs.
- **Módulos**: `server.js`, `db.js` (recreación con semilla), `services/email.js`, `config.js`.
- **RN**: ninguna (no hay regla de cálculo; son decisiones operativas).
- **Anomalías**:

| A | Clasif. | Trat. |
|---|---|---|
| A-18 la BD analizada es la semilla (transversal) | PENDIENTE | DSE; repetir arqueología |
| A-46 sin autenticación ni CSRF | PENDIENTE | DSE |
| A-48 correo no-op desde 2022 | PENDIENTE | TC |
| A-51 copias manuales semanales en pendrive | PENDIENTE | DSE |
| A-56 `config.js` «NO RENOMBRAR», dos rutas | PENDIENTE | TC |
| A-17 la BD se recrea con la semilla | BUG A SECAS | CM conservando la semilla |

- **Tests**: `semilla.test.js` (esquema, A-17, A-48, config), `rutas.test.js` (panel, A-46).
  **Golden master: NO.** Sin test: A-18, A-51, A-56.
- **Dueño natural**: **Gerencia**; el correo, el **responsable del correo** (Manoli, rol por
  confirmar, MH-18: CÓDIGO/historia). Actas: P20 (A-18) a Gerencia/Administración, **bloqueante,
  sin respuesta concluyente**; P21 resto, propuestas del consultor.

## 3. Lo que queda fuera de las specs, con justificación

Nueve anomalías son **puramente técnicas**, sin comportamiento de negocio que contratar. No se
descartan: siguen en el registro con su tratamiento y entran en el **plan de modernización
técnica**, no en una spec de negocio.

| A | Por qué se excluye |
|---|---|
| A-47 secretos en claro | Defecto de seguridad. La cuenta y la clave no son una regla de negocio |
| A-50 escrituras concurrentes en SQLite | Latente; elección de motor, sin efecto observable |
| A-52 sin integridad referencial | Restricción de esquema; el comportamiento queda en 005 y 009 |
| A-54 errores de BD mostrados al usuario | Presentación de errores técnicos |
| A-55 dependencias con avisos | Mantenimiento de librerías |
| A-57 runtime Node documentado | Entorno de ejecución |
| A-58 versiones con `^` | Gestión de dependencias |
| A-59 sin tests ni linter | Ya mitigada por la suite de caracterización |
| A-60 código y documentación muertos | Deuda técnica |

Condición: si el negocio ve efecto observable en alguna (p. ej. A-54 en la pantalla del usuario),
se reasigna a la spec del dominio que lo sufre.

## 4. Casos frontera

| Concepto | Podría caer en | Recomendación | Criterio aplicado |
|---|---|---|---|
| A-01 cabecera ≠ líneas | 004, 005, 008 | **008** (la corrección de los 6 documentos se referencia en 005) | Lo decide quien elige la fuente declarada (gestoría); aquí se manifiesta |
| A-23 dos fórmulas de prorrateo | 006, 007 | **007** como anomalía; 006 posee la convención de 30 días | Regla de reparto: convención vigente al dominio que la posee, la divergente al camino que la usa |
| A-04 mes de la baja | 006, 007 | **007**, referenciada en 006 | Se manifiesta en el camino que vuelve a facturar |
| A-05 cliente de baja | 004, 007, 009 | **009**, referenciada en 004 y 007 | La política de «baja» la decide Gerencia sobre el maestro; los caminos solo la ignoran |
| A-27, RN-25 y RN-11 (descuento en remesa) | 002, 007 | RN-11 a **002**; RN-25 y A-27 a **007** | La política es de 002; su aplicación en el batch, de 007 |
| A-10 año del número | 003, 007 | **003**; G12 y la remesa de diciembre se citan en 007 | El año legal es una regla de numeración |
| A-09 negativos y abonos parciales | 001, 004, 005 | **004**; RN-12 queda en 001 | Es lo que el alta acepta; el abono parcial futuro es una RE (005) |
| A-28 y A-15 (descuento frente a lo impreso) | 002, 005 | A-28 a **002**, A-15 a **005** | Una es la regla de reparto; otra, qué se reimprime |
| Vencimiento (RN-31/32, RN-23, A-38) | 004, 007 | RN-31/32 y A-38 a **004**; RN-23 a **007** | La regla del plazo es de la emisión; la remesa solo la aplica |
| A-42 periodos sin validar | 007, 008 | **008**, referenciada en 007 | Las dos validaciones comparten criterio y dueño |
| A-32 y A-69 (datos que el código no reproduce) | 002, 005, 008 | A-32 a **005**, A-69 a **002** | A-32 es del histórico de documentos; A-69 sostiene la regla del `>` |
| A-16 trimestre de la RE | 005, 008 | **005**; 008 recuerda que «cuadran solas» solo si caen en el mismo trimestre | La fecha la fija la rectificación |
| A-06 lectura de importes | 004, 006, 009 | **004**; las otras dos rutas se citan | Es el alta de factura donde el daño es económico (las otras tienen la misma función) |
| A-18 BD analizada | todas | **010**, con aviso en cada spec | Condición previa transversal; no se repite |

## 5. Comprobación de los criterios

- **Tamaño (~30 min)**: 001 (10 RN, 8 A), 004 (9 RN, 10 A) y 007 (9 RN, 8 A) son las más cargadas;
  004 lleva su división preparada. 009 es la más ligera. Es una estimación mía: nadie ha
  cronometrado una lectura.
- **Citas cruzadas (> mitad)**: ninguna pareja lo alcanza. Las más acopladas son 006↔007 (007 cita 006
  en 2 de ~8 requisitos, el prorrateo) y 001↔002 (002 cita 001 para el redondeo del precio rebajado).
  Por eso **no** se fusionan.
- **Completitud**: 55 RN y 73 A comprobados con un script temporal (ya borrado). Cada RN en
  exactamente una spec principal; cada A en una spec principal o en la lista de excluidas (9).
  Las 30 entradas PENDIENTE están todas asignadas.

## 6. Tabla resumen

| Spec | Reglas RN | Anomalías A | Dueño | Tests (golden master) |
|---|---|---|---|---|
| 001 Cálculo de importes e IVA | 01-06, 12, 13, 51, 52 | 02, 29, 34, 39, 45, 62, 63, 73 | Gestoría | `calculo`, `util`, `rutas` (parcial: G02, G03, G09) |
| 002 Descuento por volumen | 07-11 | 07, 24, 25, 26, 28, 67, 69 | Gerencia (+ Gestoría) | `calculo` (completo: G04-G08) |
| 003 Numeración legal | 35-40 | 10, 11, 12, 19, 72 | Gestoría | `numeracion`, `remesa` (parcial: G10, G12) |
| 004 Emisión manual | 27-34, 53 | 06, 09, 13, 35, 36, 37, 38, 44, 64, 66 | Administración | `rutas`, `util` (parcial: G01, G04, G09, G10) |
| 005 Vida de la factura emitida | 41-45 | 08, 14, 15, 16, 20, 21, 32, 33, 49 | Gestoría + Administración | `rutas`, `semilla` (**NO**) |
| 006 Prorrateo y baja | 14-18 | 30, 68 (ref. 23, 04) | Gestoría + Gerencia | `calculo`, `rutas` (**NO**) |
| 007 Remesa mensual | 19-26, 54 | 03, 04, 23, 27, 31, 65, 70, 71 | Administración | `remesa` (sí: G11, G12) |
| 008 Informes y gestoría | 46-50 | 01, 40, 41, 42, 43, 61 | Gestoría | `rutas`, `semilla` (**NO**) |
| 009 Maestros de clientes | 55 | 05, 22, 53 | Administración + Gerencia | `rutas`, `util` (**NO**) |
| 010 Operación y continuidad | — | 17, 18, 46, 48, 51, 56 | Gerencia | `semilla`, `rutas` (**NO**) |
| Excluidas (§3) | — | 47, 50, 52, 54, 55, 57, 58, 59, 60 | — | — |

Totales: RN 55/55; A 64 en specs + 9 excluidas = 73/73.

**Orden de lanzamiento recomendado**: 001, 002, 003 (las protegidas por la Constitución y con
golden master), 004, 007, 006, 005, 008, 009, 010. **005 y 008 dependen de A-01** (decisión de las
6 facturas, PD-01 a PD-05): se lanzan al final y sin cerrar su sección de A-01.

**Huecos de protección que conviene cerrar antes de invertir**: el golden master solo cubre emisión
y remesa. Las specs 005, 006, 008, 009 y 010 se apoyan solo en los tests unitarios y de rutas. Sin
test alguno: A-18, A-50, A-51, A-55, A-56, A-59, A-60, A-61.

---

# PARTE 2 · Descripciones listas para `/speckit-specify`

Cada bloque es autónomo: se pega tal cual. Todos comparten cuatro reglas, repetidas en cada uno
para que sea autosuficiente. Las citas de acta usan el formato
*(documento, pregunta, persona, fecha)*. Donde la persona es «sin identificar», la spec **no puede
aprobarse** hasta que alguien con nombre firme (PD-08).

## Descripción 001 · Cálculo de importes e IVA de una factura

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo de importes e IVA de
una factura en GesFact. No es una feature nueva: es la especificación formal de lo que el sistema
YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real de la BD).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID del registro (specs/000-reconocimiento/registro-de-anomalias.md).
- Los criterios de aceptación deben ser verificables contra la suite de test/ (npm test), citando
  el test cuando exista.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas: persona «sin identificar», y la spec no se aprueba hasta que firme
  una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-01: base de línea = cantidad × precio, a 2 decimales. Ej.: 0,44 × 21,60 = 9,504 → 9,50
  (FA-2026-000101, «Vaso caña 20cl»). services/calculo.js:27.
- RN-02: IVA por línea = base de línea × tipo / 100, redondeado por línea, nunca sobre el total.
  Ej.: base 578,00 al 21 % = 121,38 (FA-2026-000103). Tres líneas de 0,12 al 21 %: 0,09 por línea
  frente a 0,08 si se calculara sobre el total.
- RN-03: recargo de equivalencia solo si el cliente tiene la marca == 1 (igualdad laxa).
  Ej.: FA-2026-000102 (cliente 2): base 74,00 al 21 % → IVA 15,54 y recargo 3,85; total 145,89.
- RN-04: recargos 21→5,2 · 10→1,4 · 4→0,5 · (18 y 16→4 · 8 y 7→1) · cualquier otro tipo→0.
  Ej.: base 113,60 al 4 % con marca → 0,57 (FA-2026-000104).
- RN-05: totales = suma de importes de línea ya redondeados; orden: base de línea, IVA y recargo
  sobre esa base, acumulación redondeada. Ej.: IVA de FA-2026-000102 = 15,54 + 6,07 + 2,27 + 0,40
  = 24,28; recargo 3,85 + 1,50 + 0,56 + 0,10 = 6,01.
- RN-06: total = base + IVA + recargo. Ej.: 152,30 + 6,09 + 0,76 = 159,15 (FA-2026-000104, idéntica a la
  cabecera grabada). Con las líneas de FA-2026-000102 el código da base 115,62 y total 145,91, y la BD
  guarda 115,60 y 145,89 (H-02); IVA y recargo sí coinciden.
- RN-12: cero, vacío, negativo y no numérico no se validan. Ej.: 1 × −2.000 al 21 % → total
  −2.420,00; un valor no numérico deja base, IVA y total en null.
- RN-13: el tipo de IVA no se valida. Ej.: 5 % sobre 100 → cuota 5,00 y recargo 0.
- RN-51: redondear2(x) = Math.round(x*100)/100 en coma flotante, bit a bit. Ej.: 1,005 → 1,00;
  2,675 → 2,68; 0,01 × 14,50 → 0,14; −0,125 → −0,12.
- RN-52: formatearImporte usa toFixed(2), punto de millares y coma decimal; null o no numérico →
  «0,00». Ej.: 1234,5 → «1.234,50»; 2,675 → «2,67» (no coincide con redondear2); −0,001 → «-0,00».

ANOMALÍAS Y TRATAMIENTO ACORDADO (se especifican tal cual)
- A-02 PENDIENTE: redondeo línea a línea protegido por la Constitución (Principio I). Especificar
  tal cual, incluido el efecto de coma flotante. Acta: entrevista-negocio-simulada.md, P12,
  consultor, 2026-11-11: se mantiene (sin respuesta concluyente de la gestoría).
- A-29 PENDIENTE: IVA libre y recargo 0 fuera de tabla. Especificar tal cual. P18 (consultor,
  2026-11-11) propone lista cerrada de tipos solo hacia delante.
- A-39 PENDIENTE: recargos de tipos antiguos se conservan («no borrar»). P21, 2026-11-11.
- A-34 ACCIDENTAL: formato ≠ redondeo; documentar. A-45 BUG A SECAS: importes null; especificar
  tal cual. A-62 (−0), A-63 («Infinity,undefined») y A-73 (marca '1.0' o [1]) ACCIDENTAL: tal cual.

TESTS QUE LO RESPALDAN
test/calculo.test.js (recargoPara, calcularLinea, calcularFactura), test/util.test.js (redondear2,
formatearImporte), test/rutas.test.js (IVA fuera de tabla). Golden master: G02, G03 y G09.

FUERA DE ALCANCE
Descuento por volumen (spec 002). Numeración (003). De dónde vienen las líneas, lectura de lo
tecleado y vencimiento (004). Cuotas de contrato (006 y 007). Informes (008).
```

## Descripción 002 · Descuento por volumen

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del descuento por volumen de
GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para
que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID del registro.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test
  cuando exista.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-07: 2 % si la base es > 1.000,00 €, 5 % si es > 5.000,00 €; límites estrictos.
  Ej.: base 1.000,00 exactos → sin descuento, total 1.210,00 (db.js:138). 1.000,01 → 2 %, precio
  980,01, total 1.185,81. 5.000,00 → 2 % (precio 4.900,00). 5.000,01 → 5 % (precio 4.750,01).
  Origen: «acordado con Paco en 2018» (services/calculo.js:38).
- RN-08: el tramo se decide con la suma de bases ANTES del descuento. Ej.: una línea de 1.020,41
  → 2 % → precio 1.000,00 → base final 1.000,00 con descuentoPct = 2.
- RN-09: el descuento se aplica al PRECIO UNITARIO de cada línea (precio × (100 − %) / 100,
  redondeado) y se recalcula la línea. Petición de Puri, 2018 (comentario). Ej.: 1 × 1.000,50 y
  3 × 0,25 al 2 %: precios 980,49 y 0,25 (el descuento se pierde por redondeo); base 981,24 frente
  a 981,23 si se descontara sobre el total.
- RN-10: no distingue cliente, sector ni artículo. Ej.: 1 × 1.500 € → precio 1.470,00.
- RN-11: en el alta manual se añade a las observaciones « Descuento volumen N% aplicado» (con
  espacio inicial). Ej.: FA-2026-000105: «Descuento volumen 2% aplicado».

ANOMALÍAS Y TRATAMIENTO
- A-24 INTENCIONAL (protegida): 1.000,00 € exactos no descuentan. Tal cual.
- A-07 PENDIENTE: 5.000,00 € exactos llevan el 2 %. Tal cual. Acta: P7, consultor, 2026-11-11:
  2 %, se mantiene el >; el comentario «a partir de» (calculo.js:37) es el que está mal.
- A-25 PENDIENTE: tramo con base bruta. Tal cual (P9, 2026-11-11).
- A-26 PENDIENTE: se aplica a cualquier cliente; el comentario habla de hostelería. Tal cual
  (P8, 2026-11-11; quién es Paco queda sin respuesta concluyente).
- A-28 PENDIENTE (protegida): descuento en precio unitario; FA-2026-000105 no lo refleja en lo
  que se imprimió. Especificar la regla; documentar sin especificar la factura (P11).
- A-67 ACCIDENTAL: una línea no numérica anula el descuento del resto. Tal cual.
- A-69 PENDIENTE: FA-2026-000103 no es reproducible con el código actual. Documentar sin
  especificar la factura; especificar tal cual la regla del >.

TESTS QUE LO RESPALDAN
test/calculo.test.js (porcentajeDescuento, calcularFactura). El golden master LO CUBRE: G04
(1.000,00), G05 (1.000,01), G06 (5.000,00), G07 (5.000,01) y G08 (base bruta).

FUERA DE ALCANCE
Redondeo, IVA y recargo (spec 001). El descuento en las cuotas de la remesa, RN-25 y A-27
(spec 007). La reimpresión de lo emitido (spec 005).
```

## Descripción 003 · Numeración legal de facturas

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la numeración de facturas de
GesFact. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para
que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-35: formato SERIE-AAAA-NNNNNN, secuencia con 6 cifras; pasa a 7 si supera 999.999.
  Ej.: contador FA/2026 = 108 → último FA-2026-000108; el siguiente, FA-2026-000109.
- RN-36: un contador por (serie, año); el primero es el 1. Ej.: contadores FA|2026|108 y
  RE|2026|1; primer número de 2027: FA-2027-000001. Requisito legal desde la inspección de 2020.
- RN-37: el año del número es el del RELOJ del sistema, no el de la fecha de la factura. Ej.:
  remesa de 2026-12 lanzada el 1-ene-2027: fecha 2026-12-31 y número FA-2027-000001.
- RN-38: el número se reserva antes de grabar; un fallo deja un hueco.
- RN-39: sin garantía de unicidad con grabaciones simultáneas (incidente del 2-ene-2021).
- RN-40: dos series, FA (facturas) y RE (rectificativas), cada una con contador.

ANOMALÍAS Y TRATAMIENTO
- A-19 INTENCIONAL (protegida): formato y series. Tal cual.
- A-10 PENDIENTE: año del número = reloj. Tal cual; NUNCA retroactiva (no se renumera). Acta:
  P15, consultor, 2026-11-11: el año del número debe ser el de la fecha de expedición; debe
  validarlo la gestoría. Hasta firma, se especifica el comportamiento actual.
- A-11 BUG A SECAS: contador no atómico. A-12 BUG A SECAS: huecos. Corregir en modernización, no
  retroactiva. A-72 ACCIDENTAL: acepta cualquier serie; tal cual.

TESTS QUE LO RESPALDAN
test/numeracion.test.js (formatear RN-35; siguienteNumero RN-36..RN-40), test/remesa.test.js
(contradicción 05), test/rutas.test.js. Golden master: G10 y G12 (cubre el año del reloj).

FUERA DE ALCANCE
Fecha y vencimiento de la factura (spec 004). Qué factura se rectifica y con qué número (005).
Remesa de diciembre como proceso (007). Informe por año de la fecha (008).
```

## Descripción 004 · Emisión de una factura manual

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la emisión manual de facturas
de GesFact (POST /facturas/nueva). No es una feature nueva: es la especificación formal de lo que
el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-27: hace falta cliente existente (no se mira activo) y al menos una línea; si no, error 400
  y no se consume número.
- RN-28: una fila sin descripción se descarta aunque lleve importe. Ej.: descripción vacía,
  cantidad 2, precio 50 € → no entra.
- RN-29: la PRIMERA coma se cambia por punto. Ej.: '12,5' → 12,5; '1.234,50' → 1,234.
- RN-30: fecha = la tecleada o la de hoy, sin validar.
- RN-31: plazo = días de pago del cliente, o 30 si está vacío o es 0. Ej.: FA-2026-000103
  (60 días), 2026-02-20 → vence 2026-04-21; FA-2026-000101 (sin plazo), 2026-01-31 → 2026-03-02.
- RN-32: días naturales, sin ajuste a festivo ni a fin de mes. Ej.: 2026-12-31 + 30 = 2027-01-30.
  Se verifica con TZ=Europe/Madrid.
- RN-33: estado inicial «emitida», serie FA.
- RN-34: cabecera y líneas se graban sin transacción, en paralelo.
- RN-53: fechas como texto AAAA-MM-DD; hoy() es la fecha local del servidor. Ej.:
  fechaBonita('2026-05-06') → «06/05/2026».

ANOMALÍAS Y TRATAMIENTO
- A-37 INTENCIONAL: días naturales, 30 por defecto. Tal cual.
- A-36 PENDIENTE: plazo 0 → 30 días. Tal cual. P14, consultor, 2026-11-11: 0 = «al contado»
  solo hacia delante (ningún cliente tiene 0).
- A-09 PENDIENTE: se aceptan negativos y FA con total negativo. Tal cual. P4, consultor,
  2026-11-11: no admitir FA negativas en modernización; los abonos parciales requerirán una RE
  parcial (funcionalidad nueva).
- A-06 BUG A SECAS: miles leídos ÷1000; corregir manteniendo '28.9' y '12,5'. Sin casos reales.
- A-13 BUG A SECAS: sin transacción. A-35 BUG A SECAS latente: vencimiento −1 día en UTC−3
  (0/8 coinciden con Buenos Aires, 8/8 con Madrid). A-44 BUG A SECAS: fecha sin validar.
- A-38 ACCIDENTAL: valores por defecto duplicados (30 y 21). A-64 y A-66 ACCIDENTAL: tal cual.

TESTS QUE LO RESPALDAN
test/rutas.test.js (POST /facturas/nueva RN-27..34; fallo de una línea A-13), test/util.test.js
(sumarDias, hoy, fechaBonita), test/remesa.test.js (contradicción 02). Golden master: G01
(vencimiento cruzando mes), G04 y G10 (cliente a 60 días), G09 (tecleo con rarezas).

FUERA DE ALCANCE
Importes, IVA, recargo (spec 001). Descuento y su texto (002). Número (003). Cobro y rectificación
(005). Vencimiento de la remesa, RN-23 (007). Política de clientes de baja, A-05 (009).
```

## Descripción 005 · Vida de la factura emitida: cobro, rectificación y consulta

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del ciclo de vida de una factura
ya emitida en GesFact (cobro, rectificación, consulta e impresión, panel). No es una feature
nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la
modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-41: las facturas no se borran nunca; los errores se corrigen con rectificativa y factura
  nueva. Ej.: FA-2026-000106 → rectificada, sustituida por FA-2026-000107.
- RN-42: cobrar solo cambia el estado si es «emitida»; no registra fecha ni importe; redirige con
  éxito aunque no cambie nada; no mira la serie.
- RN-43: la rectificativa es el espejo exacto, sin recalcular. Ej.: FA-2026-000106 (base 101,61 ·
  IVA 20,62 · total 122,23) → RE-2026-000001 con −101,61 · −20,62 · −122,23; líneas con
  cantidades −1 y −0,97 y precio positivo. «Puri dixit» (comentario). No hay rectificación parcial.
- RN-44: no se rectifica una RE ni una ya rectificada; sí una cobrada. La pantalla ofrece 3
  rectificables y el endpoint acepta 7.
- RN-45: la RE se fecha hoy, sin vencimiento, observación «Rectifica <número>. <motivo>». Ej.:
  RE-2026-000001, fecha 2026-05-06, vencimiento vacío. Si la original no tiene líneas, no se marca
  ni se responde.
- Estados válidos: emitida, cobrada, rectificada (sin restricción en BD). Panel: pendiente de
  cobro cuenta FA emitidas (3 por 3.032,85 €); cuenta la RE emitida pero no suma su importe.

ANOMALÍAS Y TRATAMIENTO
- A-20 INTENCIONAL y A-21 INTENCIONAL (protegidas): no borrar; espejo exacto. Tal cual.
- A-08 PENDIENTE: rectificar una cobrada y cobrar una RE por petición directa. Tal cual las dos
  reglas (pantalla y endpoint). Acta: P3, consultor, 2026-11-11: sí se rectifica una cobrada; una
  RE nunca pasa a cobrada; la devolución del dinero se registra fuera de GesFact (PD-06).
- A-16 PENDIENTE: RE fechada hoy; puede caer en otro trimestre. Tal cual (P16, 2026-11-11).
- A-33 PENDIENTE: panel. Tal cual (P21, 2026-11-11).
- A-32 PENDIENTE: la BD contiene datos que el código no genera (líneas de café, azúcar, vasos y
  «Portes»; 7 de 28 líneas no se reproducen). Documentar SIN especificar.
- A-49 PENDIENTE: teléfono «925 511 XXX» impreso. Tal cual; puede ser anonimización de la copia.
- A-14 BUG A SECAS: rectificación sin transacción ni control de error. A-15 BUG A SECAS:
  reimpresión con datos vivos de cliente y empresa. Corregir hacia delante.
- Corrección de las 6 facturas descuadradas (A-01): P1-ter, Gerencia, [CLIENTE SIMULADO],
  2026-11-11: rectificarlas con RE; pendiente de firma (PD-01..PD-05). Se referencia, no se
  especifica aquí.

TESTS QUE LO RESPALDAN
test/rutas.test.js (cobrar RN-42/A-08; rectificar RN-43..45; factura sin líneas A-14; detalle
A-15/A-33; contradicciones 08 y 09; panel), test/semilla.test.js (A-01, A-32). El golden master
NO LO CUBRE (solo emisión).

FUERA DE ALCANCE
Origen de la discrepancia cabecera/líneas y fuente del IVA declarado (spec 008). Numeración de la
RE (003). Cálculo de importes (001).
```

## Descripción 006 · Prorrateo comercial de cuotas y baja de contratos

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del prorrateo comercial de
cuotas y de la pantalla de baja de contratos de GesFact. No es una feature nueva: es la
especificación formal de lo que el sistema YA hace, para que sirva de contrato en la
modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-14: prorrateo «a lo comercial»: cuota / 30 × días de servicio (final − inicial + 1),
  redondeado. Protegido por la Constitución. Ej. cuota 90: del 1 al 16 → 48,00; del 15 al 15 →
  3,00; del 1 al 15 → 45,00.
- RN-15: tope de 30 días. Ej.: 90 del 1 al 31 → 90,00; 100 del 2 al 31 → 100,00; 100 del 1 al 30
  → 100,00.
- RN-16: fecha final anterior → 0,00; solo mira el día del mes. Ej.: del 10 al 5 → 0,00;
  2026-03-15 a 2026-04-20 → 6 días.
- RN-17: todo febrero cobra 28/30. Ej.: 90 del 1 al 28 → 84,00; 100 → 93,33.
- RN-18: solo se usa al dar de baja un contrato (del día 1 al día de la baja) y solo informa; la
  factura se emite a mano. Ej.: contrato 2 (145 €), baja 15-mar-2026 → 72,50.

ANOMALÍAS Y TRATAMIENTO
- A-30 BUG A SECAS: fechas de baja sin validar. Corregir sin tocar fórmulas.
- A-68 ACCIDENTAL: TypeError con fecha nula; NaN con texto. Tal cual.
- Por referencia, especificadas en la spec 007: A-23 (el prorrateo de la remesa usa días reales;
  acta P10, consultor, 2026-11-11: unificar a 30 días solo hacia delante, con confirmación escrita
  de la gestoría) y A-04 (el mes de la baja se puede facturar dos veces).

TESTS QUE LO RESPALDAN
test/calculo.test.js (calcularProrrateo RN-14..18, A-23, A-30), test/rutas.test.js (POST
/contratos/:id/baja), test/remesa.test.js (contradicción 01). El golden master NO LO CUBRE.

FUERA DE ALCANCE
La fórmula de días reales, qué contratos entran y la doble facturación (spec 007). Alta de
contratos (009). Cálculo de IVA de la cuota (001).
```

## Descripción 007 · Remesa mensual de contratos

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la remesa mensual de
contratos de GesFact (scripts/remesa_mensual.js). No es una feature nueva: es la especificación
formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-19: entran los contratos con fecha_alta <= último día del mes y (fecha_baja vacía o >= día
  1), ambos límites inclusivos. Ej.: remesa 2026-02: entran contratos 1, 2 y 4; no el 3 (baja
  2025-09-15). Remesa 2025-09: el 3 entra.
- RN-20: importe = cuota / DÍAS REALES del mes × días de servicio. Ej.: contrato 4 (90 €, alta
  2026-02-15), febrero: 14/28 → 45,00 (con 30 días serían 42,00); 90 € con alta el 16-jul: 46,45
  (con 30 días, 48,00); contrato 3 (60 €, baja 2025-09-15): 30,00.
- RN-21: alta el día 1 → mes completo; alta el último día → 1 día; baja el último día → mes
  completo; baja el día 1 → 1 día. Ej.: 60 € baja 28-feb → 60,00; baja 27-feb → 57,86.
- RN-22: una factura por contrato, una línea de cantidad 1, IVA del contrato; sufijo « (N dias)»
  si hay prorrateo o « (mes AAAA)». Ej.: FA-2026-000108, 1 × 90,00 al 21 %.
- RN-23: fecha = último día del mes; vencimiento = fecha + días de pago o 30 (literal propio);
  observación «Remesa <mes> <año>». Ej.: mayo, cliente sin plazo: 2026-05-31 → 2026-06-30.
- RN-24: no impide facturar dos veces ni a clientes de baja; un error hace process.exit(1) sin
  deshacer lo emitido. Ej.: FA-2026-000106 («cuota duplicada»), rectificada con RE-2026-000001.
- RN-25: la cuota > 1.000 € recibe descuento y el recargo del cliente, sin constancia. Ej.: 1.500
  → 1.470,00, total 1.778,70 (sin caso real: cuota máxima 145 €).
- RN-26: la baja a mitad de mes tiene dos importes. Ej.: 90 €, del 16 al 31 de julio: 48,00
  (pantalla de baja) frente a 46,45 (remesa).
- RN-54: días del mes del calendario (2024-02 → 29; 2026-02 → 28; 1900-02 → 28); el mes 13 y el
  00 dan 31.

ANOMALÍAS Y TRATAMIENTO
- A-23 PENDIENTE: dos fórmulas de prorrateo; esta spec especifica la de días reales y referencia
  la convención de 30 días (spec 006). Tal cual las dos. Contrato 4: +3,00 € de base (+3,63 € con
  IVA). P10 (consultor, 2026-11-11): unificar a 30 días solo hacia delante.
- A-04 PENDIENTE: el mes de la baja puede facturarse dos veces. Tal cual. P2 (consultor,
  2026-11-11): una sola vía, la remesa (hecho sin respuesta concluyente).
- A-27 PENDIENTE: descuento sin constancia. Tal cual. P6 (consultor, 2026-11-11): las cuotas no
  llevan descuento por volumen.
- A-31 PENDIENTE: un día de alta o baja factura un día. Tal cual. P13 (consultor, 2026-11-11):
  fechas inclusivas.
- A-03 BUG A SECAS: sin idempotencia (segunda remesa duplicaría 393,25 €). Corregir hacia delante.
- A-70 BUG A SECAS: mes inexistente → «undefined» y NaN-NaN-NaN. A-71 ACCIDENTAL: argumento erróneo
  deja un gesfact.db vacío. A-65 ACCIDENTAL: diasDelMes con mes 14 o texto. Tal cual.
- Referencia: A-10 (remesa de diciembre lanzada en enero: fecha 2026-12-31 y número FA-2027-…).

TESTS QUE LO RESPALDAN
test/remesa.test.js (qué contratos entran RN-19; fronteras RN-20/21; meses de 29/30/31 días; forma
RN-22/23; descuento RN-25/A-27; anomalías; contradicciones 01, 02 y 05). Golden master: G11
(febrero con la semilla) y G12 (diciembre lanzada en enero).

FUERA DE ALCANCE
Convención de 30 días y pantalla de baja (spec 006). Cálculo del importe de línea (001). Número
(003). Política de clientes de baja (009).
```

## Descripción 008 · Informes fiscales y exportación a la gestoría

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del informe de IVA trimestral y
de la exportación CSV a la gestoría de GesFact (routes/informes.js). No es una feature nueva: es
la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la
modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-46: IVA trimestral = suma de LÍNEAS por tipo, de mayor a menor; las RE restan solas; sin
  redondear. Ej. T1 2026: 21 %: base 2.533,30, cuota 532,00; 10 %: 392,20 / 39,22; 4 %: 811,10 /
  32,44; totales base 3.736,60, IVA 603,66, recargo 6,77.
- RN-47: el trimestre se define por la FECHA de la factura; límites inclusivos hasta «-31»,
  comparados como texto; entran todos los estados. Ej.: 2026-06-30 entra en el T2.
- RN-48: sin año, el actual; sin trimestre, el 1; trimestre 5 da error. trimestre=0 usa el 1.
- RN-49: CSV: todas las facturas del año de la fecha, ordenadas por número (texto); primera línea
  «CLAVE;<clave>»; cabeceras NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO; separador ;,
  coma decimal, punto de millares, fecha DD/MM/AAAA, CRLF; importes de CABECERA. «Acordado con
  Puri en 2019». Ej.: FA-2026-000102;06/02/2026;Ferretería El Tornillo;<NIF>;115,60;24,28;6,01;145,89;cobrada.
  No se reproduce el valor de la clave.
- RN-50: pantalla (líneas) y CSV (cabeceras) pueden diferir. Ej. T1 2026: líneas IVA 603,66; CSV
  IVA 736,97 y base 3.688,85. Año 2026: 783,78 frente a 647,98 (135,80 €).

ANOMALÍAS Y TRATAMIENTO
- A-01 PENDIENTE: en 6 de 9 facturas la cabecera no suma sus líneas (FA-2026-000101, -105, -106,
  -107, -108 y RE-2026-000001). Especificar las dos fuentes tal cual; documentar SIN especificar
  los 6 documentos. Actas, todas [CLIENTE SIMULADO] y sin persona identificada, 2026-11-11:
  P1 (Gestoría): el 303 del T1 de 2026 se presentó con 736,97 € (CSV); P1-bis (Administración):
  el cliente de FA-2026-000101 pagó 157,47 € (líneas); P1-ter (Gerencia): rectificar las 6.
- A-61 PENDIENTE: IVA declarado con cabeceras y cobrado por líneas (diferencia T1: 133,31 €).
  Documentar sin especificar. Regularización pendiente de PD-04.
- A-40 PENDIENTE: formato y clave del CSV, byte a byte («no cambiar»). P21, 2026-11-11.
- A-41 BUG A SECAS: CSV sin escapar ; ni saltos de línea. A-42 BUG A SECAS: periodos sin validar.
  A-43 ACCIDENTAL: «-31» como texto. Corregir con la gestoría.

TESTS QUE LO RESPALDAN
test/rutas.test.js (GET /informes/iva y /informes/export-gestoria RN-46..50; casos límite A-41,
A-43), test/semilla.test.js (A-01). El golden master NO LO CUBRE. A-61 no tiene test.

FUERA DE ALCANCE
Cálculo de importes (001). Fecha y número de la factura (003, 004). Cómo corregir los 6 documentos
con RE (spec 005). Remesa (007).
```

## Descripción 009 · Maestros de clientes: identidad fiscal y bajas

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del alta y la baja de clientes
y de la validación del NIF en GesFact. No es una feature nueva: es la especificación formal de lo
que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (reglas con sus valores)
- RN-55: un NIF es válido si tiene 9 caracteres tras quitar espacios y guiones; no se mira la
  letra ni el tipo; se guarda tal cual; solo se valida si se informa, y solo al dar de alta. Ej.:
  B12345678 y ABCDEFGHI válidos; B-1234567 inválido (8). Decisión transitoria de Julián, nov 2017,
  «los da de alta Marga y los mira ella» (comentario: CÓDIGO).
- Baja lógica: activo = 0 en clientes y artículos; oculta del desplegable de la pantalla de
  factura, pero el alta manual y la remesa no lo comprueban, y la baja no cierra contratos.
  Ej.: el cliente 1 de baja con su contrato vigente seguiría recibiendo 108,90 € al mes.
- Datos: 6 clientes, todos activos; 5 de 6 NIF no superan el dígito de control (AD-08).

ANOMALÍAS Y TRATAMIENTO
- A-05 PENDIENTE: se factura a clientes de baja. Tal cual. P5 (consultor, 2026-11-11): la baja
  cierra los contratos y se permite factura manual con aviso, solo hacia delante.
- A-22 PENDIENTE: NIF solo por longitud. Tal cual. P17 (consultor, 2026-11-11): validar el dígito
  de control en altas nuevas; los NIF existentes se revisan aparte (hecho sin respuesta
  concluyente).
- A-53 BUG A SECAS: altas de maestros casi sin validar. Corregir.

TESTS QUE LO RESPALDAN
test/rutas.test.js (POST /clientes/nuevo y /articulos/nuevo RN-55, A-22, A-53; contradicciones 08
y 09), test/util.test.js (validarNIF). El golden master NO LO CUBRE.

FUERA DE ALCANCE
Emisión manual (spec 004) y remesa (007), que ignoran activo y se citan allí. Alta de contratos y
baja de contratos (006). Contenido fiscal impreso (005).
```

## Descripción 010 · Operación y continuidad del servicio

```text
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la operación de GesFact
(acceso, arranque y base de datos, copias de seguridad, correo y configuración) en lo que implica
decisiones de negocio. No es una feature nueva: es la especificación formal de lo que el sistema
YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función,
  o dato real).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, referenciadas
  por su ID.
- Los criterios de aceptación deben ser verificables contra la suite de test/, citando el test
  cuando exista (varios no tienen: se marca «sin test»).
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las actas
  disponibles son simuladas; la spec no se aprueba hasta que firme una persona con nombre.

ALCANCE (valores)
- Servidor en el puerto 3000, escuchando en todas las interfaces, sin autenticación ni CSRF (red
  interna).
- Si datos/gesfact.db falta, o se arranca desde otra carpeta, se recrea con la semilla de db.js.
- Correo: services/email.js es un no-op desde 2022 (MH-18: lo decidió Manoli, rol por confirmar).
- Copia de seguridad: manual, semanal (viernes), en un pendrive.
- config.js se copia a mano al servidor y lleva «NO RENOMBRAR»; hay dos rutas de copia.
- Condición previa transversal: la BD analizada contiene 9 facturas de enero a mayo de 2026 y
  coincide con la semilla de db.js (AD-16), mientras el negocio la declaró de producción (S4).

ANOMALÍAS Y TRATAMIENTO
- A-18 PENDIENTE: BD analizada = semilla. Documentar; repetir la arqueología con una copia real
  antes de aprobar las demás specs. P20 (consultor, 2026-11-11): bloqueante. Se mantiene la
  declaración S4 («es producción») como hipótesis de trabajo.
- A-46 PENDIENTE: sin autenticación. Documentar. P21: usuario si hay cualquier acceso externo.
- A-48 PENDIENTE: correo desactivado. Tal cual. P21: se mantiene desactivado y se registran los
  envíos.
- A-51 PENDIENTE: copias manuales. Documentar. P21: copia diaria automática fuera de la oficina y
  una prueba de restauración; mientras tanto, la del viernes.
- A-56 PENDIENTE: config.js sin renombrar. Tal cual (cuál de las dos rutas es la real: sin
  respuesta concluyente).
- A-17 BUG A SECAS: recreación con la semilla. Corregir conservando la semilla en instalaciones
  nuevas.

TESTS QUE LO RESPALDAN
test/semilla.test.js (esquema, A-17, services/email.js A-48, config.js), test/rutas.test.js
(panel, A-46). El golden master NO LO CUBRE. Sin test: A-18, A-51 y A-56.

FUERA DE ALCANCE
Secretos en claro, concurrencia SQLite, integridad referencial, errores al usuario, dependencias,
runtime, tests y código muerto (A-47, A-50, A-52, A-54, A-55, A-57..A-60): plan técnico, no spec
de negocio. Toda regla de facturación (specs 001 a 009).
```

---

# ANEXO A · Resolución simulada de las 30 entradas PENDIENTE

Respuestas **[CLIENTE SIMULADO]**, 2026-11-12, a petición del usuario. **No son testimonio
NEGOCIO** y no cambian el registro. «D» = decisión; «H» = hecho. En los hechos no se inventa nada.

| A | Tipo | Respuesta simulada (la más correcta con la evidencia) | Spec |
|---|---|---|---|
| A-01 | D | Fuente declarada = CSV (P1). Rectificar las 6 (P1-ter). La RE anula el **pie** (lo declarado), porque A-21 manda el espejo; la factura sustituta se emite con lo realmente cobrado (líneas) | 008, 005 |
| A-02 | H | Sin respuesta concluyente: solo la gestoría sabe si el Contaplus lo exige. Se mantiene (Principio I) | 001 |
| A-04 | D | Una sola vía, la remesa (P2). H: sin respuesta concluyente | 007 |
| A-05 | D | La baja cierra contratos; factura manual permitida con aviso (P5) | 009 |
| A-07 | D | 2 %, se mantiene `>` (P7) | 002 |
| A-08 | D | Sí se rectifica una cobrada; una RE no se cobra nunca; la devolución, fuera de GesFact (P3, PD-06) | 005 |
| A-09 | D | No admitir FA negativas; abonos parciales con RE parcial, futura funcionalidad (P4) | 004 |
| A-10 | D | El año del número = año de la fecha de expedición (P15); la gestoría debe validar si una remesa del 1 de enero puede llevar fecha 31 de diciembre. Nunca retroactiva | 003 |
| A-16 | D | La RE lleva su fecha y se declara en su trimestre (P16) | 005 |
| A-18 | H | Se mantiene la declaración S4 (es producción), pero **bloqueante**: obtener copia real y repetir AD-01..AD-15 antes de aprobar las specs (P20) | 010 |
| A-22 | D | Validar el dígito de control en altas nuevas; revisar los existentes aparte (P17). H sin respuesta | 009 |
| A-23 | D | 30 días comerciales en las dos vías, solo hacia delante, con confirmación escrita de la gestoría (P10). Hasta entonces, cada vía mantiene su fórmula | 007, 006 |
| A-25 | D | Base antes del descuento (P9) | 002 |
| A-26 | D | A todos los clientes, como hoy (P8). Quién es Paco: sin respuesta | 002 |
| A-27 | D | Las cuotas no llevan descuento (P6); si lo llevaran, constaría en la factura | 007 |
| A-28 | D | Se mantiene el reparto en precio unitario (P11) | 002 |
| A-29 | D | Lista cerrada de tipos mantenida por la gestoría (P18). H sin respuesta | 001 |
| A-31 | D | Fechas inclusivas (P13); definir por escrito «fecha de baja» (PD-07) | 007 |
| A-32 | H | Sin respuesta concluyente. Decisión: prohibir editar la BD a mano; todo con RE (P19) | 005 |
| A-33 | D | «Pendiente» = solo FA emitidas (3 por 3.032,85 €) (P21) | 005 |
| A-36 | D | 0 días = al contado, solo hacia delante (P14) | 004 |
| A-39 | D | Se conservan los recargos antiguos (P21) | 001 |
| A-40 | D | Se mantiene byte a byte (P21) | 008 |
| A-46 | D | Con usuario si hay cualquier acceso externo (P21). H sin respuesta | 010 |
| A-48 | D | Se mantiene desactivado y se registran los envíos (P21) | 010 |
| A-49 | H | Sin respuesta concluyente; hipótesis: copia anonimizada | 005 |
| A-51 | D | Copia diaria automática fuera de la oficina y prueba de restauración (P21) | 010 |
| A-56 | H | Se mantiene sin renombrar; la ruta real, sin respuesta | 010 |
| A-61 | D | Regularizar el IVA: sí; la gestoría decide si es complementaria y quién firma (PR-04, PD-04) | 008 |
| A-69 | H | Se mantiene la regla `>`; FA-2026-000103 se documenta sin especificar | 002 |

**Qué sigue faltando de verdad** (no se puede simular): nombre, cargo y fecha de quien responde en
cada papel (PD-08); los hechos de la tabla marcados «H»; el escrito firmado de las 6 rectificativas
(PD-01..PD-05); y la copia real de la BD (A-18). Hasta entonces, el registro conserva las 30
entradas en PENDIENTE y las specs 005 y 008 no se pueden cerrar.
