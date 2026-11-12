# Acta de la entrevista de negocio (SIMULADA)

Documento de solo lectura (Constitución, Principios I, III y IV). No se ha modificado
código, datos ni dependencias. Ninguna respuesta de esta acta autoriza un cambio de
comportamiento.

## 0. Datos de la sesión y validez

- **Fecha**: 2026-11-11.
- **Formato**: entrevista **simulada**. El consultor (Kiro) preparó las preguntas a partir de
  `registro-de-anomalias.md`, `contradicciones-indice.md` y `memoria-historica.md`. El
  usuario hizo de cliente en el papel indicado en cada pregunta.
- **Desarrollo**: el usuario respondió a las preguntas P1, P1-bis y P1-ter. Después pidió
  al consultor que respondiera él mismo al resto «con la respuesta más lógica».
- **Validez como testigo NEGOCIO (Principio II)**: **ninguna**. El Principio II exige una
  persona identificada, con nombre y fecha.
  - Las respuestas P1, P1-bis y P1-ter van marcadas **[CLIENTE SIMULADO]**. Les falta el
    nombre de quien responde.
  - Las demás van marcadas **[PROPUESTA DEL CONSULTOR]**. Son recomendaciones o
    **SUPOSICIONES**, no testimonio.
  - **Ninguna clasificación del registro cambia por esta acta.** Todas las entradas
    PENDIENTE siguen PENDIENTE.
- **Uso previsto**: guion y borrador de respuestas para la entrevista real. El negocio puede
  aceptar, corregir o rechazar cada respuesta y firmarla. El fichero se llama
  `entrevista-negocio-simulada.md` para que nadie lo confunda con la
  `entrevista-negocio.md` real que el registro (§0.2) echa en falta.
- **Tipos de pregunta**:
  - **Pregunta de HECHO** (qué pasó, qué se hace hoy). El consultor no puede responderla.
    Se anota una hipótesis y la pregunta queda «sin respuesta concluyente».
  - **Pregunta de DECISIÓN** (qué debe hacer el sistema). El consultor propone una opción
    con su justificación.

## 1. Resumen

| # | Entrada | Dirigida a | Tipo | Respuesta | Origen | Estado |
|---|---|---|---|---|---|---|
| P1 | A-01 | Gestoría | Hecho | B · se declaró en el 303 el IVA del CSV (736,97 €, T1 2026) | Cliente simulado | Respondida, falta el nombre |
| P1-bis | A-01 | Administración | Hecho | B · el cliente de `FA-2026-000101` pagó 157,47 € (suma de líneas) | Cliente simulado | Respondida, falta el nombre |
| P1-ter | A-01 | Gerencia | Decisión | A · rectificar las 6 facturas descuadradas | Cliente simulado | Decisión con pendientes (§3) |
| P2 | A-04 | Administración | Hecho + decisión | Hecho: sin respuesta concluyente. Decisión: una sola vía, la remesa | Consultor | Sin respuesta concluyente |
| P3 | A-08 | Gestoría | Decisión | Sí se puede rectificar una factura cobrada. Una RE no pasa nunca a «cobrada» | Consultor | Propuesta |
| P4 | A-09 | Administración / Gestoría | Hecho + decisión | Hecho: sin respuesta concluyente. Decisión: no admitir FA negativas; los abonos parciales se hacen con RE | Consultor | Propuesta |
| P5 | A-05 | Gerencia | Decisión | La baja del cliente cierra sus contratos; se permite factura manual con aviso | Consultor | Propuesta |
| P6 | A-27 | Gerencia | Decisión | Las cuotas de contrato no llevan descuento por volumen | Consultor | Propuesta |
| P7 | A-07 | Gerencia | Decisión | 5.000,00 € exactos llevan el 2 % (se mantiene el `>`) | Consultor | Propuesta |
| P8 | A-26 | Gerencia | Hecho + decisión | El descuento se aplica a todos los clientes, como hoy | Consultor | Propuesta |
| P9 | A-25 | Gerencia | Decisión | El tramo se decide con la base antes del descuento, como hoy | Consultor | Propuesta |
| P10 | A-23 | Gestoría + Gerencia | Hecho + decisión | 30 días comerciales en las dos vías, solo hacia delante, con confirmación escrita de la gestoría | Consultor | Propuesta |
| P11 | A-28 | Administración | Hecho | Sin respuesta concluyente. `FA-2026-000105` entra en la rectificación de P1-ter | Consultor | Sin respuesta concluyente |
| P12 | A-02 | Gestoría | Hecho | Sin respuesta concluyente. Se mantiene tal cual (regla protegida) | Consultor | Sin respuesta concluyente |
| P13 | A-31 | Gerencia | Decisión | Fechas de alta y baja inclusivas, como hoy | Consultor | Propuesta |
| P14 | A-36 | Administración | Decisión | 0 días significa «al contado» | Consultor | Propuesta |
| P15 | A-10 | Gestoría | Decisión | El año del número debe ser el año de la fecha de expedición impresa | Consultor | Propuesta, debe validarla la gestoría |
| P16 | A-16 | Gestoría | Decisión | La RE lleva su propia fecha y se declara en su trimestre, como hoy | Consultor | Propuesta |
| P17 | A-22 | Administración / Gestoría | Hecho + decisión | Hecho: sin respuesta concluyente. Decisión: validar el dígito de control en las altas nuevas | Consultor | Propuesta |
| P18 | A-29 | Gestoría | Hecho + decisión | Hecho: sin respuesta concluyente. Decisión: solo tipos de una lista cerrada | Consultor | Propuesta |
| P19 | A-32 | Administración / Gerencia | Hecho + decisión | Hecho: sin respuesta concluyente. Decisión: prohibir editar la BD a mano | Consultor | Propuesta |
| P20 | A-18 | Gerencia / Administración | Hecho | Sin respuesta concluyente | Consultor | Bloqueante |
| P21 | A-33, A-39, A-40, A-46, A-48, A-49, A-51, A-56 | Varios | Mixto | Ver §2 | Consultor | Propuestas / sin respuesta concluyente |

## 2. Detalle por pregunta

### P1 · A-01 · IVA declarado del T1 de 2026 · Gestoría · [CLIENTE SIMULADO]
- **Pregunta**: para el T1 de 2026, la pantalla de IVA da 603,66 € y el CSV da 736,97 €.
  ¿Qué cifra se incluyó en el modelo 303?
- **Respuesta**: **B, 736,97 €**, la cifra del CSV, que suma los totales de cabecera.
- **Efecto**: indica que la gestoría usa el CSV, no la pantalla de IVA, para el 303. Esto
  contradice el comentario de `routes/informes.js:13` («la gestoría revisa [el informe de
  IVA] antes del modelo 303»). No se sabe si la gestoría también mira la pantalla.

### P1-bis · A-01 · Importe cobrado de `FA-2026-000101` · Administración · [CLIENTE SIMULADO]
- **Pregunta**: el pie de la factura dice 161,17 € y la suma de líneas da 157,47 €. ¿Qué pagó
  el cliente?
- **Respuesta**: **B, 157,47 €**, la suma de líneas.
- **Efecto**: en esta factura se cobró por líneas y se declaró por cabecera. Eso supone 3,70 €
  más de IVA declarado que cobrado (27,97 € frente a 24,27 €). En todo el T1, la diferencia
  entre las dos fuentes es de 133,31 €. Esta cifra es un cálculo del consultor sobre AD-02, no
  una afirmación del negocio. Solo se conoce el importe cobrado de 1 de las 6 facturas
  descuadradas.

### P1-ter · A-01 · Qué hacer con las 6 facturas descuadradas · Gerencia · [CLIENTE SIMULADO]
- **Pregunta**: ¿se corrigen con rectificativa, se dejan como están, se revisan una a una, o
  la decisión corresponde a otra persona?
- **Respuesta**: **A, corregirlas todas con rectificativa** (`FA-2026-000101`, `-105`, `-106`,
  `-107`, `-108` y `RE-2026-000001`).
- **Efecto**: decisión de gerencia, pendiente de escrito firmado. No se ejecuta en esta fase.
  Abre los pendientes PD-01 a PD-05 (§3).

### P2 · A-04 · Factura del mes en que se da de baja un contrato · Administración · [PROPUESTA DEL CONSULTOR]
- **Pregunta**: contrato de 145 € al mes, baja el 15 de marzo. La pantalla de baja da
  87,73 € y la remesa del 1 de abril da 84,89 €. ¿Cómo se factura ese mes?
- **Hecho**: **sin respuesta concluyente**. SUPOSICIÓN: hoy se dan las dos (opción C). La
  remesa de marzo incluye el contrato porque `fecha_baja >= primerDia`
  (`scripts/remesa_mensual.js:26-29`) y lo prorratea a 15/31. Además, el comentario de
  `routes/contratos.js:28-30` dice que administración emite la factura a mano.
- **Propuesta**: que la factura de ese mes salga por **una sola vía, la remesa**. Va en la
  remesa porque es automática y no depende de que alguien recuerde hacerla. La pantalla de
  baja quedaría solo como informativa. El importe dependerá de la fórmula que se elija en
  P10. Si hay casos ya cobrados dos veces, se rectifican uno a uno, sin regla general.

### P3 · A-08 · Rectificar una factura cobrada y cobrar una RE · Gestoría · [PROPUESTA DEL CONSULTOR]
- **Propuesta**:
  - **Sí se puede rectificar una factura ya cobrada.** La factura rectificativa existe para
    errores y para devoluciones, aunque la original esté cobrada (Reglamento de facturación,
    RD 1619/2012, art. 15; conocimiento general que debe confirmar la gestoría). La
    devolución del dinero se registra fuera de GesFact hasta que se defina cómo.
  - **Una RE no pasa nunca a «cobrada».** Hoy el endpoint lo permite (`routes/facturas.js:117-122`)
    pero la pantalla no.
- **Pendiente**: dónde se registra la devolución (PD-06).

### P4 · A-09 · Líneas y facturas FA negativas · Administración / Gestoría · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. No se sabe si la oficina usa líneas negativas en
  la serie FA para hacer abonos parciales. En los datos no hay ninguna (AD-12).
- **Propuesta**: no admitir facturas FA con total negativo. Los abonos parciales se harían
  con una RE parcial, que hoy no existe (la RE es siempre el espejo total, A-21). Es una
  funcionalidad nueva y queda para modernización. Hasta que exista, se mantiene el
  comportamiento actual.

### P5 · A-05 · Facturar a un cliente dado de baja · Gerencia · [PROPUESTA DEL CONSULTOR]
- **Propuesta**:
  - Dar de baja un cliente obliga a cerrar antes sus contratos vigentes, o los cierra en el
    mismo momento. Así la remesa deja de facturarle (hoy serían 108,90 € al mes para el
    cliente 1).
  - Se sigue permitiendo una factura manual para cobrar un resto, pero con aviso en pantalla.
- **Efecto**: corrección solo hacia delante. No hay bajas en los datos (AD-07).

### P6 · A-27 · Descuento por volumen en las cuotas de la remesa · Gerencia · [PROPUESTA DEL CONSULTOR]
- **Propuesta**: las cuotas de alquiler y mantenimiento **no llevan descuento por volumen**.
  El descuento nació para fidelizar compras de hostelería (`services/calculo.js:38`), no
  para cuotas.
- **Impacto actual**: nulo, porque la cuota máxima es de 145 € (AD-09). Si alguna vez se
  aplicara, tendría que constar en la factura.

### P7 · A-07 · Base de 5.000,00 € exactos · Gerencia · [PROPUESTA DEL CONSULTOR]
- **Propuesta**: **2 %**, manteniendo la comparación estricta `>`. Así es coherente con el
  caso de 1.000,00 € ya resuelto con la gestoría (A-24, `FA-2026-000103`). Cada tramo
  empieza en «más de», no en «desde».
- **Efecto**: sin cambio de comportamiento. Conviene corregir solo el texto del comentario
  «a partir de» en modernización, sin tocar el código (R-24).

### P8 · A-26 · ¿Descuento solo para hostelería? · Gerencia · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente** sobre quién es Paco y si el acuerdo de 2018 está
  escrito.
- **Propuesta**: el descuento se aplica **a todos los clientes**, como hoy. GesFact no guarda
  el sector del cliente, y limitarlo a hostelería exigiría un dato nuevo y una decisión
  comercial que no consta.

### P9 · A-25 · Base para decidir el tramo · Gerencia · [PROPUESTA DEL CONSULTOR]
- **Propuesta**: el tramo se decide con la base **antes del descuento**, como hoy. Es lo
  habitual en descuentos por volumen de pedido y no cambia ningún documento emitido.

### P10 · A-23 · 30 días fijos o días reales · Gestoría + Gerencia · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. No se sabe qué se facturó por el alta del
  contrato 4 en febrero de 2026: 54,45 € por remesa o 50,82 € con 30 días.
- **Propuesta**: unificar las dos vías en **30 días comerciales con tope de 30**. Es la
  fórmula que protege la Constitución y la que, según el comentario, «espera la gestoría»
  (`services/calculo.js:90-93`). Un mes completo cobra la cuota entera.
- **Condiciones**:
  - Antes de unificar, la gestoría debe confirmarlo **por escrito**.
  - Se aplica solo hacia delante, sin rectificar facturas antiguas por esta diferencia.
  - Hasta entonces, cada vía mantiene su fórmula.

### P11 · A-28 · Cómo se imprimió `FA-2026-000105` · Administración · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. SUPOSICIÓN: la vista imprime las líneas desde la
  BD y el pie desde la cabecera (`views/factura_detalle.ejs:24-40`). Si es así, el cliente
  recibió líneas sin descuento con un pie de 2.756,38 €, y las líneas impresas no suman ese
  pie.
- **Propuesta**: se mantiene la regla del código, que reparte el descuento en el precio de
  cada línea (protegida, petición de Puri en 2018). `FA-2026-000105` ya entra en la
  rectificación decidida en P1-ter.

### P12 · A-02 · Redondeo línea a línea · Gestoría · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. Solo la gestoría puede confirmar si el Contaplus
  lo exige y si conserva la lista de diferencias de 2019.
- **Propuesta**: se mantiene tal cual, incluido el efecto de coma flotante
  (`redondear2(1.005) = 1`). Lo exige el Principio I sin necesidad de respuesta.

### P13 · A-31 · Alta o baja en el primer o último día del mes · Gerencia · [PROPUESTA DEL CONSULTOR]
- **Propuesta**: fechas **inclusivas**, como hoy. La fecha de baja se entiende como «último
  día con servicio» y la de alta como «primer día con servicio». Un contrato dado de baja el
  día 1 factura ese día, y uno dado de alta el último día del mes, también.
- **Pendiente**: que la pantalla de baja explique qué significa la fecha (PD-07).

### P14 · A-36 · Plazo de pago de 0 días · Administración · [PROPUESTA DEL CONSULTOR]
- **Propuesta**: 0 días significa **«al contado»**: el vencimiento es la fecha de la
  factura. Hoy da 30 días (`dias_pago || 30`).
- **Efecto**: sin dependientes, porque ningún cliente tiene 0 días (AD-07). La corrección es
  solo hacia delante.

### P15 · A-10 · Año del número de factura · Gestoría · [PROPUESTA DEL CONSULTOR]
- **Contexto comprobado**: la remesa de diciembre lanzada el 1 de enero fecha la factura el
  último día del mes facturado (`scripts/remesa_mensual.js:59`, `fecha = ultimoDia`). El
  número, en cambio, toma el año del reloj (`lib/numeracion.js:15`). Resultado: facturas
  fechadas el 31-12-2026 y numeradas `FA-2027-…`.
- **Propuesta**: el año del número debe coincidir con el año de la **fecha de expedición**
  impresa en la factura. Además, la gestoría debe aclarar si una remesa emitida el 1 de
  enero puede llevar fecha de expedición 31 de diciembre. Si no puede, la factura debe
  llevar la fecha real de expedición y, aparte, el mes del servicio.
- **Efecto**: nunca retroactiva. Las facturas emitidas no se renumeran.

### P16 · A-16 · Fecha de la rectificativa · Gestoría · [PROPUESTA DEL CONSULTOR]
- **Propuesta**: la RE lleva **su propia fecha de expedición y se declara en su
  trimestre**, como hoy. Según la Ley del IVA (art. 89), la rectificación se declara en el
  periodo en que se efectúa. Es conocimiento general y debe confirmarlo la gestoría.
- **Efecto**: sin cambio de comportamiento. El comentario «cuadran solas»
  (`routes/informes.js:21-22`) solo es cierto si original y RE caen en el mismo trimestre.

### P17 · A-22 · NIF · Administración / Gestoría · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. No se sabe si los NIF de los clientes 2 a 6 son
  reales (5 de 6 fallan el dígito de control, AD-08), si Marga sigue revisándolos ni si la
  gestoría o Hacienda han rechazado alguno.
- **Propuesta**: validar el dígito de control en las altas nuevas. Los NIF existentes se
  revisan aparte, sin tocar facturas emitidas.

### P18 · A-29 · Tipos de IVA fuera de 21, 10 y 4 % · Gestoría · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente** sobre si se ha facturado con otro tipo. En los
  datos solo hay 21, 10 y 4 % (AD-11).
- **Propuesta**: aceptar solo tipos de una lista cerrada que mantenga la gestoría, cada uno
  con su recargo. Hoy cualquier tipo fuera de la tabla da recargo 0 sin aviso.

### P19 · A-32 · Ediciones manuales de la BD · Administración / Gerencia · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. No se sabe quién añadió las líneas de café,
  azúcar y vasos a facturas de remesa, quién tecleó los «Portes», ni con qué versión se
  emitieron. SUPOSICIÓN: ediciones manuales en la BD, como la que cuenta
  `routes/facturas.js:81-82`.
- **Propuesta**: prohibir las ediciones directas de la BD sobre facturas emitidas. Toda
  corrección se hace con una rectificativa.

### P20 · A-18 · ¿La BD analizada es la de producción? · Gerencia / Administración · [PROPUESTA DEL CONSULTOR]
- **Hecho**: **sin respuesta concluyente**. El consultor no puede responderla, y es
  **bloqueante**. La evidencia física (AD-16) indica que la BD es la semilla de `db.js`.
- **Propuesta**: localizar el fichero real de la oficina y conseguir una copia de solo
  lectura. Después, repetir AD-01 a AD-15 antes de escribir las specs. Hasta entonces, las
  respuestas P1 y P1-bis y las clasificaciones INTENCIONAL (A-19, A-20, A-21, A-24, A-37) se
  apoyan en datos que pueden no ser los de producción.

### P21 · Bloque de menor impacto · [PROPUESTA DEL CONSULTOR]
| Entrada | Dirigida a | Respuesta propuesta |
|---|---|---|
| A-33 Panel | Administración | «Pendientes de cobro» cuenta solo las FA emitidas: hoy serían 3 por 3.032,85 €. El «total histórico» cuenta solo las FA |
| A-39 Tipos de IVA antiguos | Gestoría | Se conservan (no borrar). No cuestan nada y protegen ejercicios antiguos. Hecho sin respuesta concluyente: si se conserva el Access |
| A-40 CSV y clave | Gestoría | Se mantienen byte a byte, con el orden actual. Hecho sin respuesta concluyente: para qué sirve la clave |
| A-46 Acceso sin login | Gerencia | Hecho sin respuesta concluyente: si se accede desde fuera de la oficina. Propuesta: acceso con usuario si hay cualquier acceso externo o wifi de invitados en la misma red |
| A-48 Correo | Responsable del correo (Manoli) / Administración | Se mantiene desactivado. Hecho sin respuesta concluyente: quién es Manoli y por qué decide. Propuesta: registrar qué facturas se envían y cuándo |
| A-49 Teléfono «925 511 XXX» | Administración | Hecho sin respuesta concluyente. SUPOSICIÓN: el `config.js` de esta copia está anonimizado |
| A-51 Copias de seguridad | Gerencia | Propuesta: copia diaria automática fuera de la oficina y una prueba de restauración. Se mantiene la del viernes mientras tanto |
| A-56 `config.js` | Administración | Se mantiene sin renombrar. Hecho sin respuesta concluyente: cuál de las dos rutas es la real |

## 3. Condiciones, prohibiciones e información nueva

Recogido de las respuestas del cliente simulado, aunque no se preguntara directamente:

- **IN-01** (P1): la gestoría usa el **CSV** para el modelo 303. La pantalla de IVA no es la
  fuente declarada.
- **IN-02** (P1-bis): el importe cobrado al cliente coincide con la **suma de líneas**, al
  menos en `FA-2026-000101`.
- **IN-03** (P1 + P1-bis): de IN-01 e IN-02 se deduce que en el T1 de 2026 se pudo declarar
  más IVA del cobrado. SUPOSICIÓN del consultor, hasta conocer lo cobrado en las otras 5
  facturas.
- No se mencionó ninguna prohibición nueva.

Pendientes que nacen de la decisión P1-ter:

- **PD-01**: escrito firmado por gerencia con nombre y fecha (Constitución, «Governance»).
- **PD-02**: importe correcto de cada factura sustituta. Hay que saber qué pagó el cliente en
  `-105`, `-106`, `-107` y `-108`.
- **PD-03**: tratamiento de `RE-2026-000001` (una rectificativa de una rectificativa) y de
  `FA-2026-000106` (ya rectificada).
- **PD-04**: la gestoría debe valorar si presenta una declaración complementaria del 303 del
  T1 y del T2 de 2026.
- **PD-05**: averiguar por qué divergen cabecera y líneas (enlaza con P19 / A-32).

Otros pendientes:

- **PD-06**: dónde se registra la devolución de dinero al rectificar una factura cobrada (P3).
- **PD-07**: definición escrita de «fecha de baja» (P13).
- **PD-08**: nombre y cargo de quien responde en cada papel (Gestoría, Administración,
  Gerencia), para que P1, P1-bis y P1-ter valgan como testigo NEGOCIO.

## 4. Siguiente paso

1. Llevar esta acta a la entrevista real. En cada pregunta, la persona responsable acepta,
   corrige o rechaza la respuesta y firma con nombre y fecha.
2. Con las respuestas firmadas, crear `entrevista-negocio.md` y actualizar las
   clasificaciones del registro de anomalías. Esta acta no las actualiza.
3. Prioridad: P20 (BD real), P1-ter y PD-01 a PD-05, P2 y P10. Son las de mayor importe y
   las que bloquean las specs.

## 5. Pendiente para próxima ronda

Ordenado por impacto económico dentro de cada bloque.

### 5.1 Preguntas nuevas surgidas en la sesión

| ID | Dirigida a | Pregunta | Entrada |
|---|---|---|---|
| PR-01 | Gestoría + Gerencia | La rectificativa copia exactamente lo grabado (A-21, regla protegida). Si se rectifican las 6 facturas, la RE anularía el pie, que es la cifra declarada, y no las líneas, que es lo cobrado. Para estas 6, ¿la RE debe anular **A.** el pie (lo declarado), **B.** las líneas (lo cobrado), o **C.** lo decide la gestoría? | A-01, A-21, A-61 |
| PR-02 | Gestoría | Los 303 de trimestres anteriores a 2026, ¿también se presentaron con el CSV? Sí / No / No consta. Si la respuesta es sí, la diferencia entre cabecera y líneas puede afectar al histórico desde 2019 | A-61, A-18 |
| PR-03 | Gestoría | ¿Con qué cifra de IVA se presentó el 303 del T2 de 2026: **A.** CSV, **B.** pantalla de IVA, **C.** otra? | A-61 |
| PR-04 | Gestoría + Gerencia | ¿Se regulariza el IVA de 2026 (complementaria o rectificación en un periodo posterior)? Sí / No. ¿Quién lo firma? | A-61 (PD-04) |
| PR-05 | Administración | ¿Qué pagaron los clientes de `-105`, `-106`, `-107` y `-108`: el pie o la suma de líneas? | A-01, A-61 (PD-02) |
| PR-06 | Administración / Gestoría | ¿Alguien usa la pantalla «Informe de IVA»? Sí (quién y para qué) / No | A-01 |
| PR-07 | Todos | Nombre, cargo y fecha de quien responde en cada papel | Todas (PD-08) |

### 5.2 Preguntas de hecho sin respuesta concluyente

| Pregunta | Dirigida a | Qué falta saber | Entrada |
|---|---|---|---|
| P20 | Gerencia / Administración | ¿Es `datos/gesfact.db` la BD de producción? Si no, ¿dónde está la real? (**bloqueante**) | A-18 |
| P2 | Administración | ¿Cómo se factura hoy el mes de baja: a mano, por remesa o por ambas? ¿Se ha cobrado dos veces? | A-04 |
| P4 | Administración | ¿Se emiten facturas FA con líneas negativas para abonos parciales? | A-09 |
| P10 | Administración | ¿Qué se facturó por el alta del contrato 4 en febrero de 2026: 54,45 € o 50,82 €? | A-23 |
| P11 | Administración | ¿Cómo se imprimió y envió `FA-2026-000105`? | A-28 |
| P12 | Gestoría | ¿Exige el Contaplus el redondeo línea a línea? ¿Se conserva la lista de 2019? | A-02 |
| P8 | Gerencia | ¿Quién es Paco y está escrito el acuerdo de descuento de 2018? | A-26 |
| P17 | Administración / Gestoría | ¿Son reales los NIF de los clientes 2 a 6? ¿Ha habido rechazos? | A-22 |
| P18 | Gestoría | ¿Se ha facturado con un IVA distinto de 21, 10 o 4 %? | A-29 |
| P19 | Administración / Gerencia | ¿Quién añadió líneas o tecleó importes a mano en la BD? | A-32 |
| P21 | Varios | Para qué sirve la clave del CSV (A-40); acceso desde fuera (A-46); quién es Manoli (A-48); teléfono real (A-49); ruta real de `config.js` (A-56); si se conserva el Access (A-39) | A-39, A-40, A-46, A-48, A-49, A-56 |

### 5.3 Propuestas del consultor que el negocio debe aceptar, corregir o rechazar

P2 (decisión), P3, P4 (decisión), P5, P6, P7, P8 (decisión), P9, P10 (decisión), P13, P14,
P15, P16, P17 (decisión), P18 (decisión), P19 (decisión), P21 (A-33, A-51). El detalle está
en §2. Cada una se cierra solo con la firma de la persona responsable.

### 5.4 Pendientes que nacen de la decisión P1-ter

PD-01 a PD-08 (§3). PD-02 coincide con PR-05, PD-04 con PR-04 y PD-08 con PR-07.

## 6. Propagación de esta acta (2026-11-11)

- **Registro de anomalías**: 0 PENDIENTES cerradas, porque ninguna respuesta tiene persona
  identificada. A-01 recibe la evidencia provisional y una clasificación propuesta. Se
  añade la entrada nueva A-61. El detalle está en `registro-de-anomalias.md` §6.
- **Registro de riesgos**: se añade R36 y una nota en S4.
- **Memoria histórica**: se añaden H-31 (práctica) y H-32 (decisión).
- **Estado de la lista PENDIENTE**: 29 entradas, no vacía. Es la agenda de la próxima
  conversación con el negocio, empezando por PR-07 y P20. El reconocimiento **no** está
  listo para pasar a specs formales.
- **Ronda 2**: las 29 PENDIENTES y las preguntas PR-01 a PR-07 están convertidas en un
  formulario para responder y firmar, organizado por persona:
  `entrevista-ronda-2-formulario.md`.
