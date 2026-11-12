# Reglas de negocio de GesFact (lógica central, criticidad ALTA)

Extracción de las reglas de negocio que implementan los módulos centrales. Documento de
**solo lectura**: no se ha modificado código, datos ni dependencias (Constitución,
Principios I, III y IV). Todo está en español de España (Principio V).

## 0. Alcance, método y convenciones

### 0.1 Qué se ha analizado y por qué

Partiendo de `specs/000-reconocimiento/mapa-sistema.md` (secciones 2 y 4, columna
«Alta»), se han tomado los módulos que **deciden qué se cobra, qué se permite, qué se
calcula, cuándo y cuánto**, junto con las utilidades de las que dependen:

| Módulo (criticidad ALTA) | Por qué entra | Ficheros leídos íntegros |
|---|---|---|
| `services/calculo.js` | Importes, IVA, recargo, descuento, prorrateo | sí |
| `lib/numeracion.js` | Número legal de factura | sí |
| `lib/util.js` | Utilidades de las que dependen todos: `redondear2`, `sumarDias`, `diasDelMes`, `hoy`, `formatearImporte`, `fechaBonita`, `validarNIF` | sí |
| `routes/facturas.js` | Alta, cobro y rectificación: vencimiento, estados, qué se permite | sí |
| `routes/informes.js` | IVA trimestral y CSV de la gestoría | sí |
| `scripts/remesa_mensual.js` | Facturación automática de cuotas | sí |

Constantes que influyen en reglas, leídas de `config.js:20-41` (`VENCIMIENTO_DIAS`,
`CLAVE_EXPORT_GESTORIA`) y de `db.js` (esquema y comentarios de datos).

**Fuera de este documento** (criticidad media/baja en el mapa; se citan solo cuando
intervienen en una regla): `server.js` (panel), `routes/clientes.js`, `routes/contratos.js`,
`routes/articulos.js`, `services/email.js`, vistas y `public/`. Pregunta Q-20.

### 0.2 Evidencia (Principio II)

- **Código**: `fichero:líneas`, sobre el estado actual del repositorio.
- **BD**: consultas `sqlite3 -readonly` a `datos/gesfact.db` (6 clientes, 4 contratos, 9
  facturas, 28 líneas, contadores `FA/2026 = 108`, `RE/2026 = 1`). El registro de riesgos
  (`registro-riesgos.md`, R1) anota que el negocio confirmó esta BD como **producción**
  («usuario, 2026-11-11»); no tengo otro testimonio ni lo he podido verificar por mí
  mismo. Por eso los ejemplos «reales» usan esos valores.
- **Entorno**: salida de ejecutar las funciones **puras** (`calculo.js`, `util.js`) con
  `node` en esta máquina, **sin tocar la BD** (`numeracion.js`, la remesa y las rutas no se
  han ejecutado porque escriben). Los resultados que dependen de la zona horaria se
  indican con su `TZ`. Esta máquina está en UTC−3 (`date`: `-03`).
- **Testimonio**: solo los que figuran como comentario en el código (Puri, Paco, Julián,
  Roberto). Ninguno es nuevo; no hay fecha completa en la mayoría.
- **SUPOSICIÓN**: lo no verificable. Cada una remite a una pregunta (Q-xx, sección 7).

### 0.3 Clasificación provisional

- **INTENCIONAL**: hay una señal de decisión deliberada (comentario, nombre del caso,
  coherencia interna, testimonio).
- **ACCIDENTAL**: efecto colateral de cómo está escrito el código; nadie lo parece haber
  decidido.
- **DUDOSA**: no se puede decidir desde el código; hay pregunta asociada.

Es **provisional**: la confirma el negocio. Ninguna clasificación autoriza cambiar nada
(Principio I): una regla ACCIDENTAL sigue siendo el comportamiento de referencia.

---

## 1. Resumen

| ID | Regla (resumen) | Clasif. |
|---|---|---|
| RN-01 | Base de línea = cantidad × precio, redondeada a 2 decimales | INTENCIONAL |
| RN-02 | IVA se calcula y redondea **por línea** sobre la base de línea | INTENCIONAL |
| RN-03 | Recargo de equivalencia solo si el cliente tiene la marca `== 1` | INTENCIONAL |
| RN-04 | Tabla de recargos: 21→5,2 · 10→1,4 · 4→0,5 · (18,16→4 · 8,7→1) · resto→0 | INTENCIONAL (tabla) / ACCIDENTAL (resto→0) |
| RN-05 | Totales de factura = suma de importes de línea ya redondeados | INTENCIONAL |
| RN-06 | Total = base + IVA + recargo | INTENCIONAL |
| RN-07 | Descuento por volumen: 2 % si base > 1.000, 5 % si base > 5.000 (estricto) | INTENCIONAL |
| RN-08 | El tramo se decide con la suma de bases **antes** del descuento | DUDOSA |
| RN-09 | El descuento se aplica al **precio unitario** de cada línea, redondeado | INTENCIONAL |
| RN-10 | El descuento no distingue cliente, sector ni artículo | DUDOSA |
| RN-11 | La constancia del descuento («Descuento volumen N %») solo se escribe en el alta manual | ACCIDENTAL |
| RN-12 | Cero, vacío, negativo y no numérico no se validan en el cálculo | ACCIDENTAL |
| RN-13 | El tipo de IVA no se valida: se aplica el % que llegue | ACCIDENTAL |
| RN-14 | Prorrateo «a lo comercial»: cuota / 30 × días de servicio | INTENCIONAL |
| RN-15 | Tope de 30 días: un mes de 31 nunca cobra más de la cuota | INTENCIONAL |
| RN-16 | Días negativos o cero → importe 0; ignora mes y año | ACCIDENTAL |
| RN-17 | Con 30 días fijos, un servicio de **todo** febrero cobra 28/30 | DUDOSA |
| RN-18 | El prorrateo de calculo.js solo se usa al dar de baja y solo informa | INTENCIONAL |
| RN-19 | Qué contratos entra en la remesa (fronteras inclusivas) | DUDOSA |
| RN-20 | La remesa prorratea por **días reales** del mes | DUDOSA |
| RN-21 | Fronteras de alta y baja dentro del mes en la remesa | ACCIDENTAL |
| RN-22 | Una factura, una línea, cantidad 1, IVA del contrato por contrato | INTENCIONAL |
| RN-23 | Fecha = último día del mes; vencimiento = fecha + días de pago | INTENCIONAL |
| RN-24 | La remesa no impide facturar dos veces ni a clientes de baja | ACCIDENTAL |
| RN-25 | Descuento y recargo también se aplican en la remesa | ACCIDENTAL |
| RN-26 | Cuota de contrato distinta según la vía (30 días vs días reales) | DUDOSA |
| RN-27 | Para facturar hace falta cliente existente y al menos una línea con descripción | INTENCIONAL |
| RN-28 | Una fila sin descripción se descarta aunque lleve importe | INTENCIONAL |
| RN-29 | Números tecleados: la coma decimal se sustituye una sola vez | ACCIDENTAL |
| RN-30 | Fecha de factura: la tecleada o la de hoy, sin validar | ACCIDENTAL |
| RN-31 | Plazo de pago: el del cliente o 30 días | INTENCIONAL |
| RN-32 | Vencimiento en días naturales, sin ajustar a festivo ni a fin de mes | DUDOSA |
| RN-33 | Toda factura nueva nace «emitida» en serie FA | INTENCIONAL |
| RN-34 | Cabecera y líneas se graban sin transacción | ACCIDENTAL |
| RN-35 | Formato `SERIE-AAAA-NNNNNN` | INTENCIONAL |
| RN-36 | Contador por serie y año; el primero es el 1 | INTENCIONAL |
| RN-37 | El año del número es el del reloj del sistema, no el de la factura | ACCIDENTAL |
| RN-38 | El número se reserva antes de grabar: puede haber huecos | ACCIDENTAL |
| RN-39 | Sin garantía de unicidad con grabaciones simultáneas | ACCIDENTAL |
| RN-40 | Dos series: FA (facturas) y RE (rectificativas) | INTENCIONAL |
| RN-41 | Las facturas no se borran nunca | INTENCIONAL |
| RN-42 | Cobro: solo pasa de «emitida» a «cobrada» | INTENCIONAL / ACCIDENTAL |
| RN-43 | Rectificación total, espejo exacto, sin recalcular | INTENCIONAL |
| RN-44 | Quién se puede rectificar (no RE, no ya rectificada; sí cobrada) | INTENCIONAL / DUDOSA |
| RN-45 | Datos de la rectificativa: fecha de hoy, sin vencimiento | ACCIDENTAL |
| RN-46 | IVA trimestral: suma de **líneas** agrupadas por tipo | INTENCIONAL |
| RN-47 | Fronteras del trimestre y estados incluidos | ACCIDENTAL |
| RN-48 | Parámetros por defecto del informe y trimestre inválido | ACCIDENTAL |
| RN-49 | CSV de gestoría: formato, clave y contenido | INTENCIONAL |
| RN-50 | IVA de la pantalla (líneas) y del CSV (cabeceras) pueden diferir | DUDOSA |
| RN-51 | Redondeo a 2 decimales: `Math.round(x*100)/100` | INTENCIONAL |
| RN-52 | Formato de importes: `toFixed`, que **no** redondea igual que RN-51 | ACCIDENTAL |
| RN-53 | Fechas como texto `AAAA-MM-DD`; «hoy» es la fecha local del servidor | INTENCIONAL / ACCIDENTAL |
| RN-54 | Días del mes (bisiestos incluidos; mes inválido no se detecta) | INTENCIONAL / ACCIDENTAL |
| RN-55 | NIF válido = 9 caracteres tras quitar espacios y guiones | INTENCIONAL (provisional) |

---

## 2. Cálculo de importes (`services/calculo.js`, `lib/util.js`)

### RN-01 · La base de una línea se redondea al céntimo
- **Enunciado**: el importe sin IVA de cada línea es cantidad × precio unitario,
  redondeado a 2 decimales.
- **Ejemplo (BD, `FA-2026-000101`, línea «Vaso caña 20cl»)**: 0,44 cajas × 21,60 € =
  9,504 → **9,50 €**; coincide con la BD (`lineas.base = 9.5`).
- **Evidencia**: `calcularLinea`, `services/calculo.js:27`; redondeo en `lib/util.js:5-7`.
- **Clasificación: INTENCIONAL.** Aviso expreso de Julián (mayo 2019) en
  `services/calculo.js:1-7` y `:25` («TODO redondeado por línea»); la Constitución lo
  declara sagrado.

### RN-02 · El IVA se calcula y redondea por línea
- **Enunciado**: la cuota de IVA de cada línea es base de línea × tipo / 100, redondeada a
  2 decimales. Nunca se calcula sobre el total de la factura.
- **Ejemplo (BD, `FA-2026-000103`)**: base 578,00 € al 21 % = **121,38 €** (BD:
  `cuota_iva = 121.38`).
- **Ejemplo que muestra la diferencia con calcular sobre el total (Entorno)**: tres
  líneas de 0,12 € al 21 %: cada cuota 0,0252 → 0,03 €; suma de líneas **0,09 €**. Sobre la
  base total (0,36 €) sería 0,0756 → **0,08 €**. Este tipo de diferencia de un céntimo es
  exactamente lo que la gestoría cuadra.
- **Evidencia**: `services/calculo.js:28`; aviso en `:1-7`.
- **Clasificación: INTENCIONAL.** Mismas señales que RN-01 (devolución de un trimestre
  entero en mayo de 2019, testimonio de Julián en el comentario).

### RN-03 · El recargo de equivalencia solo se cobra a clientes marcados
- **Enunciado**: si el cliente tiene la marca de recargo de equivalencia, cada línea
  añade una cuota de recargo; si no, el recargo es 0. La marca se evalúa con igualdad
  **laxa** a 1 (`== 1`): valen `1`, `'1'` y `true`; otros valores (p. ej. `2`) no.
- **Ejemplo (BD, `FA-2026-000102`, cliente 2 «Ferretería El Tornillo», marca = 1)**:
  base 74,00 € al 21 %: IVA 15,54 € y recargo 74 × 5,2 % = 3,848 → **3,85 €**. Total de
  la factura 145,89 €.
- **Ejemplo (Entorno)**: base 100 € al 21 %, marca `2` → recargo 0.
- **Evidencia**: `services/calculo.js:49` (marca), `:30-32` (cuota de recargo redondeada
  por línea). En la remesa se pasa solo la marca del cliente
  (`scripts/remesa_mensual.js:55`).
- **Clasificación: INTENCIONAL.** El comportamiento está respaldado por datos reales
  (clientes 2 y 4 con marca = 1 y sus facturas con recargo). La laxitud de `==` no tiene
  señal de ser deliberada; es solo un detalle (la columna es `INTEGER`, `db.js:27`).

### RN-04 · Porcentajes de recargo por tipo de IVA y tipos antiguos
- **Enunciado**: recargo del 5,2 % para IVA 21 %; 1,4 % para 10 %; 0,5 % para 4 %.
  Tipos antiguos conservados: 4 % para IVA 18 % y 16 %; 1 % para IVA 8 % y 7 %. **Cualquier
  otro tipo** (incluido 0) lleva recargo **0 %**, sin aviso.
- **Ejemplo (BD, `FA-2026-000104`, cliente 4, marca = 1, IVA 4 %)**: base 113,60 € →
  recargo 113,60 × 0,5 % = 0,568 → **0,57 €**; (Entorno) IVA 10 %, base 23,90 € →
  recargo 0,3346 → **0,33 €**; IVA 5 % con marca → recargo 0.
- **Evidencia**: `recargoPara`, `services/calculo.js:12-23` (tabla), comentario de tipos
  antiguos `:16-17` («no borrar por si hay que reabrir ejercicios viejos del Access»).
- **Clasificación**: tabla vigente **INTENCIONAL** (coincide con los tipos que ofrece la
  interfaz y con la BD, `db.js:36`); tipos antiguos **INTENCIONAL** (comentario expreso);
  «cualquier otro → 0» **ACCIDENTAL** (es el `return 0` final, `:22`, no una decisión).
- **Época de la tabla**: SUPOSICIÓN (conocimiento general, no del proyecto) de que 16/7 %
  y 18/8 % son tipos españoles previos a 2012 y que 21/10/4 % con 5,2/1,4/0,5 % son los
  vigentes. Q-01.

### RN-05 · Los totales de la factura son la suma de líneas ya redondeadas
- **Enunciado**: base, IVA y recargo de la factura se obtienen sumando, línea a línea,
  los importes **ya redondeados** de cada línea; tras cada suma se vuelve a redondear a 2
  decimales. El **orden** es: (1) redondear base de línea, (2) redondear IVA y recargo
  de línea sobre esa base ya redondeada, (3) acumular redondeando.
- **Ejemplo (BD, `FA-2026-000102`)**: IVA = 15,54 + 6,07 + 2,27 + 0,40 = **24,28 €**
  (cabecera `iva = 24.28` ✓.); recargo = 3,85 + 1,50 + 0,56 + 0,10 = **6,01 €** ✓.
- **Evidencia**: `services/calculo.js:81-83` (acumulación), `:26-34`.
- **Clasificación: INTENCIONAL.** Es el modelo «línea a línea» del aviso de
  `services/calculo.js:1-7`.

### RN-06 · Total = base + IVA + recargo
- **Enunciado**: el total es la suma de los tres acumulados, redondeada.
- **Ejemplo (BD, `FA-2026-000102`)**: 115,60 + 24,28 + 6,01 = **145,89 €** ✓.
- **Evidencia**: `services/calculo.js:86`.
- **Clasificación: INTENCIONAL.**

### RN-07 · Descuento por volumen: tramos y fronteras exactas
- **Enunciado**: si la base de la factura es **mayor que 1.000 €** (y no mayor que 5.000
  €), descuento del **2 %**; si es **mayor que 5.000 €**, del **5 %**; en otro caso, 0 %.
  Los límites son **estrictos**: 1.000,00 € exactos **no** descuentan; 5.000,00 € exactos
  llevan 2 % (no 5 %).
- **Ejemplos**:
  - BD, `FA-2026-000103` (cliente 5): base 1.000,00 € → sin descuento, total **1.210,00 €**
    ✓ (el comentario de `db.js:138` lo anota expresamente).
  - Entorno: línea única de 1.000,01 € → 2 % → precio 980,01 € → total **1.185,81 €**.
  - Entorno: 5.000,00 € → 2 % (precio 4.900,00 €); 5.000,01 € → 5 % (precio 4.750,01 €).
- **Evidencia**: `porcentajeDescuento`, `services/calculo.js:39-43`; comentario `:36-38`;
  caso de la gestoría `db.js:138`.
- **Clasificación: INTENCIONAL** para el `>` en 1.000 (el caso «comentado con la gestoría»
  de `db.js:138`); **DUDOSA** para el `>` en 5.000, porque no hay ningún caso ni nota que
  lo respalde y el comentario de `calculo.js:37` dice «a partir de» (ver D-01, Q-02).
- **Origen**: «acordado con Paco en 2018 para fidelizar hostelería»
  (`services/calculo.js:38`).

### RN-08 · El tramo del descuento se decide con la base **antes** de descontar
- **Enunciado**: el porcentaje se calcula sobre la suma de bases de línea **sin
  descuento** (cada una redondeada, y la suma redondeada paso a paso). Después de aplicar
  el descuento la base resultante puede quedar en un tramo inferior (incluso ≤ 1.000 €)
  sin que eso cambie el descuento ya decidido.
- **Ejemplo (Entorno)**: línea única de 1.020,41 € → base bruta > 1.000 → 2 % → precio
  1.000,00 € → factura con base **1.000,00 €** y `descuentoPct = 2` (mientras que una
  factura que *nace* con 1.000,00 € no lleva descuento: RN-07).
- **Evidencia**: `services/calculo.js:53-61` (base bruta y tramo), `:65-71`.
- **Clasificación: DUDOSA.** El código es coherente con «el descuento se decide sobre el
  pedido», pero no hay comentario que diga si la base de referencia debía ser la bruta o
  la neta. Q-03.

### RN-09 · El descuento se reparte en el precio unitario de cada línea
- **Enunciado**: no se descuenta del total: se rebaja el **precio unitario** de cada línea
  (precio × (100 − %) / 100, redondeado a 2 decimales) y con ese precio nuevo se vuelve a
  calcular base, IVA y recargo de la línea (RN-01 a RN-03). El precio rebajado es el que se
  guarda en la línea.
- **Ejemplo (Entorno)**: líneas 1 × 1.000,50 € y 3 × 0,25 € (base bruta 1.001,25 €, 2 %):
  precios 980,49 € y 0,25 € (0,25 × 0,98 = 0,245 se redondea a 0,25: en esa línea el
  descuento se pierde por redondeo); bases 980,49 + 0,75 = **981,24 €** (ejecutado). Si se
  descontara sobre el total daría 981,23 € (1.001,25 × 0,98 = 981,225). **Un céntimo de
  diferencia** por el orden de redondeo.
- **Evidencia**: `services/calculo.js:63-71`; comentario `:63-64` («para que la gestoría
  lo vea desglosado igual, petición de Puri, 2018»).
- **Clasificación: INTENCIONAL.** Petición de Puri (2018) explícita en el comentario.

### RN-10 · El descuento no distingue cliente, sector, artículo ni servicio
- **Enunciado**: se aplica a toda factura cuya base supere los umbrales, sea quien sea el
  cliente y el artículo (incluidos servicios como «Portes» o cuotas de alquiler).
- **Evidencia**: `calcularFactura` solo recibe líneas y la marca de recargo del cliente
  (`services/calculo.js:48-61`); el comentario habla de «fidelizar hostelería»
  (`:38`) pero el código no mira sector (la tabla `clientes` no tiene campo de sector,
  `db.js:19-32`).
- **Ejemplo**: cualquier cliente con 1.470 € de pedido recibe el 2 % (Entorno: 1 × 1.500
  € → precio 1.470,00 €).
- **Clasificación: DUDOSA.** El comentario limita la intención a hostelería; el código no.
  SUPOSICIÓN de que todos los clientes actuales son de hostelería. Q-04.

### RN-11 · La constancia del descuento solo queda en el alta manual
- **Enunciado**: en el alta manual, si hay descuento, se añade a las observaciones el
  texto « Descuento volumen N% aplicado» (con un espacio inicial). En la remesa no se
  escribe nada, aunque el descuento se aplique (RN-25).
- **Ejemplo (BD, `FA-2026-000105`)**: observaciones = «Descuento volumen 2% aplicado».
- **Evidencia**: `routes/facturas.js:76`; la remesa graba solo `'Remesa ' + mes`
  (`scripts/remesa_mensual.js:62`).
- **Clasificación: ACCIDENTAL** (la ausencia en la remesa); la existencia del texto en el
  alta manual es **INTENCIONAL**, pero no hay comentario que explique el motivo.

### RN-12 · Cero, vacío, negativo y no numérico
- **Enunciado** (lo que ocurre, no lo que se «debería» permitir):
  - Sin líneas: el cálculo devuelve todo a 0 (el alta manual lo impide antes, RN-27).
  - **Cantidad o precio negativos**: se calculan tal cual; la factura puede salir con
    total **negativo** en serie FA, y el descuento no se aplica (la base es menor que 1.000).
    (Entorno: 1 × −2.000 € al 21 % → total −2.420,00 €, `descuentoPct` 0.)
  - **Cantidad/precio vacío o no numérico** (`NaN`): la línea queda con `null` en base e
    IVA y el total sale `null` (Entorno). El efecto sobre el `INSERT` (la columna es `NOT
    NULL`, `db.js:72-75`) **no se ha ejecutado**; el registro de riesgos lo anota como R10.
  - **Precio cero** o **IVA 0 %**: válidos; IVA 0 y recargo 0 (Entorno).
- **Evidencia**: `services/calculo.js:26-34`, `:50-88`; entradas sin validar en
  `routes/facturas.js:59-61`.
- **Clasificación: ACCIDENTAL.** No hay ningún control; es lo que sale.

### RN-13 · El tipo de IVA no se valida
- **Enunciado**: se aplica el porcentaje que llegue como IVA (cualquier entero); solo los
  tipos de la tabla RN-04 generan recargo.
- **Ejemplo (Entorno)**: IVA 5 % sobre 100 € → cuota 5,00 €, recargo 0 aunque el cliente
  tenga la marca.
- **Evidencia**: `services/calculo.js:28`, `:22`; `routes/facturas.js:61`
  (`parseInt(ivas[i], 10)`).
- **Clasificación: ACCIDENTAL.**

---

## 3. Prorrateo de cuotas (`services/calculo.js`) y su uso

### RN-14 · Prorrateo «a lo comercial»: el mes son 30 días
- **Enunciado**: la parte proporcional de una cuota mensual es cuota / 30 × días de
  servicio, donde días = día final − día inicial + 1 (ambos inclusive), redondeada a 2
  decimales. El mes se considera **siempre** de 30 días, tenga los que tenga.
- **Ejemplos (Entorno, cuota 90 €)**: del 1 al 16 → 48,00 €; del 15 al 15 (un día) →
  3,00 €; del 1 al 15 → 45,00 €.
- **Evidencia**: `calcularProrrateo`, `services/calculo.js:95-102`; comentario `:90-93`.
- **Clasificación: INTENCIONAL.** «Así lo hacía Paco a mano en el Access y así lo espera la
  gestoría»; la Constitución (Principio I) lo protege.

### RN-15 · Tope de 30 días: el día 31 no suma
- **Enunciado**: si los días de servicio salen más de 30, se cobran 30 (la cuota
  completa). Un servicio de todo un mes de 31 días cobra la cuota entera, no más.
- **Ejemplos (Entorno)**: cuota 90 €, del 1 al 31 → **90,00 €**; cuota 100 €, del 2 al 31
  → 30 días → **100,00 €**; del 1 al 30 → 30 días → **100,00 €**. Es decir, tanto «2→31» como
  «1→30» cuestan la cuota entera.
- **Evidencia**: `services/calculo.js:99`.
- **Clasificación: INTENCIONAL.** Comentario expreso («el día 31 no se cobra»). Ver D-03:
  el comentario describe un efecto (no se cobra el 31) pero el código implementa un tope
  de 30 días, que no es lo mismo.

### RN-16 · Días negativos o cero → 0 €; no comprueba el mes ni el año
- **Enunciado**: si la fecha final es anterior a la inicial el importe es 0. La función
  solo mira el **día del mes** de las dos fechas: no comprueba que sean del mismo mes ni
  del mismo año (aunque el comentario dice «dentro del MISMO mes»).
- **Ejemplos (Entorno)**: del 10 al 5 → 0,00 €; del 10 al 9 → 0,00 €; del `2026-03-15` al
  `2026-04-20` → 20 − 15 + 1 = 6 días (mismo resultado que del 15 al 20).
- **Evidencia**: `services/calculo.js:96-100` (`dias < 0` → 0; con `dias = 0` el resultado
  también es 0 por la multiplicación); `:94` (comentario).
- **Clasificación: ACCIDENTAL.**

### RN-17 · Con 30 días fijos, un servicio durante todo febrero cobra 28/30
- **Enunciado**: como el divisor es 30 y los días se cuentan reales, un contrato dado de
  baja el 28 de febrero (servicio de todo el mes) saldría por **menos** que la cuota
  entera. El comentario de que el mes «son siempre 30 días» solo se cumple hacia arriba
  (tope), no hacia abajo.
- **Ejemplo (Entorno)**: cuota 90 €, del 1 al 28 de febrero → 28/30 × 90 = **84,00 €**;
  cuota 100 € → 93,33 €. En la remesa de febrero ese contrato saldría a **90,00 €**
  (cuota completa, RN-20).
- **Evidencia**: `services/calculo.js:95-102`; contraste con
  `scripts/remesa_mensual.js:45-51`.
- **Clasificación: DUDOSA.** No se sabe si «a lo comercial» de Paco incluía el caso de
  febrero completo. Q-05.

### RN-18 · El prorrateo de calculo.js solo se usa al dar de baja y no genera factura
- **Enunciado**: `calcularProrrateo` solo se llama desde la baja de un contrato (del día 1
  al día de baja del mes de la baja) y su resultado **solo se muestra** en la URL; la
  factura de ese prorrateo se emite «a mano». No hay prorrateo de la **alta** con esta
  función.
- **Ejemplo (Entorno)**: contrato 2 (145 €) dado de baja el 15-mar-2026 → pantalla:
  **72,50 €** (15/30). La remesa de marzo, si se lanzara con la baja ya grabada,
  facturaría 15/31 × 145 = **70,16 €** (RN-20/RN-26).
- **Evidencia**: `routes/contratos.js:28-30` (comentario), `:37-40`;
  `services/calculo.js:95-102`; uso en `mapa-sistema.md` §2.3 y F4.
- **Clasificación: INTENCIONAL** (comentario de `routes/contratos.js:28-30`), pero con la
  duda de la doble vía en RN-26.

---

## 4. Remesa mensual (`scripts/remesa_mensual.js`)

### RN-19 · Qué contratos se facturan en un mes
- **Enunciado**: para el mes `AAAA-MM`, se facturan los contratos con
  `fecha_alta <= último día del mes` y (`fecha_baja` vacía **o** `fecha_baja >= primer
  día del mes`). Ambos límites son **inclusivos**. Se compara texto con texto (formato
  `AAAA-MM-DD`).
- **Ejemplo (BD)**: remesa de `2026-02`: entran contrato 1 (alta 2024-03-01), contrato 2
  (alta 2023-01-15), contrato 4 (alta 2026-02-15) y **no** el contrato 3 (baja 2025-09-15
  < 2026-02-01). Remesa de `2025-09`: el contrato 3 entra (baja 15-sep ≥ 1-sep).
- **Evidencia**: `scripts/remesa_mensual.js:20-21` (límites), `:26-29` (consulta).
- **Clasificación: DUDOSA.** No hay comentario sobre las fronteras; la inclusión de un
  contrato dado de baja **el día 1** (se factura 1 día) y de un contrato con alta el último
  día del mes (se factura 1 día) son consecuencias de `<=`/`>=`. Q-06.

### RN-20 · La remesa prorratea por días reales del mes
- **Enunciado**: importe = cuota / **días reales del mes** × días de servicio, redondeado a
  2 decimales. Los días de servicio van desde `max(alta, día 1)` hasta `min(baja, último
  día)`, ambos inclusivos. Un mes completo da exactamente la cuota.
- **Ejemplos**:
  - BD, contrato 4 (90 €, alta 2026-02-15), remesa de `2026-02`: del 15 al 28 = 14 días
    de 28 → 90 / 28 × 14 = **45,00 €** (con el prorrateo de `calcularProrrateo` serían
    42,00 €).
  - Entorno, 90 €, alta el 16-jul: 16 días de 31 → **46,45 €** (con 30 días fijos: 48,00 €).
  - BD, contrato 3 (60 €, baja 2025-09-15), remesa de `2025-09`: 15 días de 30 →
    **30,00 €**.
- **Evidencia**: `scripts/remesa_mensual.js:45-51`; comentario `:43-44`.
- **Clasificación: DUDOSA.** El comentario dice «por los días reales del mes», así que el
  código hace lo que dice, pero contradice la regla «a lo comercial» de Paco y la
  gestoría (RN-14). Nadie documenta que se decidiera la diferencia (Roberto, becario,
  verano de 2021; `scripts/remesa_mensual.js:5-6`). Q-07.

### RN-21 · Fronteras de alta y baja dentro del mes
- **Enunciado**: con las fechas reales y las fórmulas anteriores:
  - alta el **día 1** → mes completo; alta el **último día** → 1 día (1/N de la cuota);
  - baja el **último día** → mes completo (la condición de `hasta` es `fecha_baja <
    último día`, estricta); baja el **día 1** → 1 día;
  - alta y baja el mismo día → 1 día.
- **Ejemplo (Entorno)**: 60 € en febrero de 2026 con baja el 28-feb (último día) → mes
  completo, **60,00 €**; con baja el 27-feb → 27/28 × 60 = 57,86 €.
- **Evidencia**: `scripts/remesa_mensual.js:45-46` (`>` / `<` estrictos que dejan `desde`
  y `hasta` en los extremos del mes).
- **Clasificación: ACCIDENTAL** (consecuencia de las comparaciones, sin comentario).

### RN-22 · Una factura por contrato: una sola línea de cantidad 1
- **Enunciado**: cada contrato genera una factura propia con una línea «concepto + sufijo»
  (cantidad 1, precio = importe del mes, IVA del contrato). El sufijo es « (N dias)» si hay
  prorrateo y « (mes AAAA)» si el mes es completo (con el nombre del mes en minúsculas). El
  recargo depende del cliente (RN-03).
- **Ejemplo (BD, `FA-2026-000108`)**: línea «Alquiler máquina de café Futurmat F3
  (mayo)», 1 × 90,00 € al 21 % (en la BD hay además otras líneas en esa factura, que no
  vienen de la remesa: ver H-03).
- **Evidencia**: `scripts/remesa_mensual.js:53-55`, `:66-69`, `nombreMes` `:80-84`.
- **Clasificación: INTENCIONAL.**

### RN-23 · Fecha de la factura, vencimiento y observación de la remesa
- **Enunciado**: la fecha de cada factura es el **último día del mes facturado**; el
  vencimiento es esa fecha + días de pago del cliente (o **30** si no tiene); las
  observaciones son «Remesa <mes> <año>». Estado «emitida», serie FA.
- **Ejemplo (BD, `FA-2026-000108`)**: remesa de mayo, cliente 1 sin plazo → fecha
  2026-05-31, vencimiento 2026-06-30 (+30). Cliente con 60 días: 2026-04-30 + 60 =
  2026-06-29.
- **Evidencia**: `scripts/remesa_mensual.js:59-62`.
- **Clasificación: INTENCIONAL** en fecha y estado; el `30` es una **constante duplicada**
  de `config.VENCIMIENTO_DIAS` (ver D-08) → **ACCIDENTAL** el valor literal.

### RN-24 · La remesa no impide facturar dos veces ni a clientes de baja
- **Enunciado**: la remesa no consulta si el contrato ya se facturó ese mes ni si el
  cliente está activo. Ejecutarla dos veces genera dos facturas del mismo mes para cada
  contrato. Un error a mitad hace `process.exit(1)` sin deshacer lo ya emitido.
- **Ejemplo (BD)**: `FA-2026-000106` («Remesa abril. ERROR cuota duplicada») rectificada
  con `RE-2026-000001` y sustituida por `FA-2026-000107` el 2026-05-06. SUPOSICIÓN: la
  causa fue una doble ejecución (no consta). Q-08.
- **Evidencia**: `scripts/remesa_mensual.js:26-29` (solo lee `contratos`), `:64`, `:70`.
- **Clasificación: ACCIDENTAL.**

### RN-25 · El descuento por volumen y el recargo también rigen en la remesa
- **Enunciado**: como la remesa usa `calcularFactura`, una cuota **mayor de 1.000 €** al mes
  recibiría el 2 % de descuento y una mayor de 5.000 € el 5 %, sin constancia en las
  observaciones (RN-11).
- **Ejemplo (Entorno)**: cuota de 1.500 € → precio 1.470,00 €, total 1.778,70 €. En la BD no
  hay contratos con cuota > 1.000 € (máximo 145 €), así que **no hay caso real**.
- **Evidencia**: `scripts/remesa_mensual.js:55` → `services/calculo.js:48-88`.
- **Clasificación: ACCIDENTAL.** Nadie parece haber decidido si los alquileres con cuota alta
  deben llevar descuento por volumen.

### RN-26 · La cuota de una baja a mitad de mes tiene dos importes posibles
- **Enunciado**: dos vías calculan lo mismo con fórmulas distintas: la pantalla de baja (30
  días fijos, RN-14) y la remesa (días reales, RN-20). Además, el contrato dado de baja a
  mitad de mes **sigue entrando** en la remesa de ese mes (RN-19), mientras la factura del
  prorrateo de la pantalla se emite a mano.
- **Ejemplo (Entorno)**: 90 €, del 16 al 31 de julio: **48,00 €** (pantalla) frente a
  **46,45 €** (remesa).
- **Evidencia**: `services/calculo.js:95-102` vs `scripts/remesa_mensual.js:45-51`;
  `routes/contratos.js:28-30`.
- **Clasificación: DUDOSA.** Q-07 y Q-09 (¿se factura dos veces el último mes?).

---

## 5. Alta, vencimiento y estados de factura (`routes/facturas.js`)

### RN-27 · Condiciones mínimas para emitir una factura manual
- **Enunciado**: hace falta que el cliente exista (no se mira si está dado de baja) y que
  haya al menos una línea. Si no, se devuelve error (400) y **no se consume número**.
- **Ejemplo**: cliente dado de baja (`activo = 0`): se le puede facturar (el código no
  comprueba `activo`). SUPOSICIÓN de que no es lo deseado. Q-10.
- **Evidencia**: `routes/facturas.js:46-47` (cliente), `:64` (líneas).
- **Clasificación: INTENCIONAL** (cliente y líneas); **ACCIDENTAL** (no mirar `activo`).

### RN-28 · Una fila sin descripción se descarta, aunque lleve importe
- **Enunciado**: en el formulario, las filas con la descripción vacía se tratan como «filas
  vacías» y no se facturan, aunque tengan cantidad y precio.
- **Ejemplo**: fila con descripción vacía, cantidad 2, precio 50 € → no entra en la
  factura (deducción del código; no ejecutado).
- **Evidencia**: `routes/facturas.js:56`.
- **Clasificación: INTENCIONAL** (comentario «filas vacías del formulario», pero la
  condición mira solo la descripción).

### RN-29 · Interpretación de cantidades y precios tecleados
- **Enunciado**: la **primera** coma de un número se sustituye por un punto antes de
  interpretarlo. Un número con separador de miles (`1.234,50`) se lee como **1,234**; se
  ignoran los caracteres tras el segundo punto.
- **Ejemplos (Entorno)**: `'12,5'` → 12,5 · `'1.234,50'` → **1,234** (pierde el resto) ·
  `''` → no numérico (`NaN`, ver RN-12).
- **Evidencia**: `routes/facturas.js:59-60`.
- **Clasificación: ACCIDENTAL.** SUPOSICIÓN: los usuarios no teclean separador de miles;
  Q-11.

### RN-30 · Fecha de la factura manual
- **Enunciado**: la fecha es la del formulario o, si va vacía, la de hoy (fecha local del
  servidor). No se valida el formato ni que sea razonable (puede ser pasada, futura, de
  otro año).
- **Ejemplo (Entorno)**: `sumarDias('abc', 30)` devuelve `NaN-NaN-NaN` como vencimiento.
- **Evidencia**: `routes/facturas.js:44`, `:69`; `lib/util.js:10-15`, `:20-26`.
- **Clasificación: ACCIDENTAL.** Consecuencia: el año del número (RN-37) y el trimestre del
  informe (RN-47) pueden no coincidir con la fecha tecleada.

### RN-31 · Plazo de pago: el del cliente o 30 días
- **Enunciado**: el vencimiento usa los días de pago del cliente; si no tiene (vacío) o es
  **0**, se aplican 30 días. El comentario de config dice «si el cliente no tiene forma de
  pago».
- **Ejemplos (BD)**: `FA-2026-000103`, cliente 5 (60 días), fecha 2026-02-20 → vence
  **2026-04-21** ✓; `FA-2026-000101`, cliente 1 (sin plazo), fecha 2026-01-31 → vence
  **2026-03-02** ✓ (30 días).
- **Evidencia**: `routes/facturas.js:68-69`; `config.js:39-40`; remesa:
  `scripts/remesa_mensual.js:60`.
- **Clasificación: INTENCIONAL.** El caso `dias_pago = 0` → 30 es **ACCIDENTAL** (efecto
  del `||`); Q-12.

### RN-32 · El vencimiento se cuenta en días naturales, sin ajustes
- **Enunciado**: el vencimiento es fecha + N días naturales. No se mueve a fin de mes, ni
  a día hábil, ni a festivo.
- **Ejemplos (Entorno, `TZ=Europe/Madrid`)**: 2026-01-31 + 30 = 2026-03-02 · 2026-05-31 +
  30 = 2026-06-30 · 2026-12-31 + 30 = **2027-01-30** · 2024-02-29 + 365 = 2025-02-28.
- **Dependencia de la zona horaria (Entorno)**: la función interpreta la fecha como UTC
  y la lee en hora local. En zonas con desfase **negativo** (p. ej. esta máquina, UTC−3)
  el resultado sale **un día antes**: 2026-01-31 + 30 = 2026-03-01 (y +0 días → 2026-01-30).
  En `Europe/Madrid` y `Atlantic/Canary`, sobre 2.016 combinaciones (fechas de 2025-2026,
  +0/+30/+60) **no hay ningún desfase**, incluidos los cambios de hora de marzo y octubre.
- **Evidencia**: `lib/util.js:20-26`; usos `routes/facturas.js:69`,
  `scripts/remesa_mensual.js:60`; TODO de marzo de 2019 en `lib/util.js:18-19`.
- **Clasificación: DUDOSA.** La causa que supuso Julián (cambio de hora) **no se
  reproduce** en las zonas europeas probadas; el desfase de un día reproducible depende de
  una zona horaria con desfase negativo. SUPOSICIÓN: el equipo de 2019 tenía otra
  configuración horaria. Q-13.

### RN-33 · Toda factura manual nace «emitida», serie FA
- **Enunciado**: el estado inicial es «emitida»; la serie, FA. Los estados posibles según
  el esquema son «emitida», «cobrada» y «rectificada» (sin restricción en la BD).
- **Evidencia**: `routes/facturas.js:74-75`; `db.js:61`.
- **Clasificación: INTENCIONAL.**

### RN-34 · Cabecera y líneas se graban sin transacción
- **Enunciado**: se numera y graba la cabecera, y después las líneas, una a una y en
  paralelo; si una falla, la factura queda con cabecera y líneas incompletas. El
  comentario del código lo reconoce.
- **Evidencia**: `routes/facturas.js:74-98`; comentario `:81-82` («si falla una a mitad ya
  se apaño en su día a mano en la bd, no ha vuelto a pasar»).
- **Clasificación: ACCIDENTAL** (es un efecto de cómo se escribió, aceptado a posteriori).

---

## 6. Numeración (`lib/numeracion.js`)

### RN-35 · Formato del número: `SERIE-AAAA-NNNNNN`
- **Enunciado**: serie, año de 4 dígitos y secuencia rellena de ceros a **6** cifras. Si la
  secuencia supera 999.999 el número crece a 7 cifras sin truncar.
- **Ejemplo (BD)**: contador `FA/2026 = 108` → último número `FA-2026-000108`; el siguiente
  sería **`FA-2026-000109`**.
- **Evidencia**: `formatear`, `lib/numeracion.js:38-42`; ejemplo de formato en
  `db.js:52`.
- **Clasificación: INTENCIONAL.**

### RN-36 · Contador independiente por serie y año; empieza en 1
- **Enunciado**: hay un contador por pareja (serie, año). La primera factura de un año nuevo
  recibe el 1 (se abre el contador a 0 y se reserva 1).
- **Ejemplo (BD)**: `contadores`: `FA|2026|108`, `RE|2026|1`. Primer número de FA en 2027
  (Entorno, deducción del código): `FA-2027-000001`.
- **Evidencia**: `lib/numeracion.js:16-28`, `:30-36`; clave primaria `(serie, anyo)`
  (`db.js:76-81`).
- **Clasificación: INTENCIONAL.** Requisito legal citado: «correlativa y sin huecos
  dentro de cada serie y año» (`lib/numeracion.js:3-6`).

### RN-37 · El año del número es el del reloj del sistema, no el de la factura
- **Enunciado**: el año se toma del reloj en el momento de grabar, **no de la fecha de la
  factura**. Una factura con fecha de diciembre grabada en enero lleva el año nuevo en su
  número.
- **Ejemplo (deducción del código, no ejecutado; SUPOSICIÓN S3 del registro de riesgos)**:
  remesa de `2026-12` lanzada el 1-ene-2027: fecha 2026-12-31 y número
  **`FA-2027-000001`**; en el informe de IVA cae en el T4 de 2026, por fecha, pero su
  número es de 2027. Q-14.
- **Evidencia**: `lib/numeracion.js:15` (`new Date().getFullYear()`);
  `scripts/remesa_mensual.js:5-7`, `:59`.
- **Clasificación: ACCIDENTAL.** El comentario legal habla de «serie y año» sin precisar de
  qué fecha.

### RN-38 · El número se reserva antes de grabar la factura
- **Enunciado**: el contador se incrementa antes del `INSERT` de la factura. Si la
  grabación falla después, el número queda consumido: hueco en una numeración que debe ser
  correlativa.
- **Evidencia**: `lib/numeracion.js:30-36`; llamada previa al `INSERT` en
  `routes/facturas.js:71-74`, `:138-141`, `scripts/remesa_mensual.js:57-61`.
- **Ejemplo**: alta con precio no numérico (RN-12) → número reservado y posible fallo de
  `INSERT` (el fallo concreto de SQLite **no se ha ejecutado**).
- **Clasificación: ACCIDENTAL**; contradice el comentario legal (D-05).

### RN-39 · Sin garantía de unicidad con grabaciones simultáneas
- **Enunciado**: leer el último número y escribir el siguiente son dos sentencias
  separadas; dos altas simultáneas pueden recibir el mismo número y la BD no lo impide
  (`facturas.numero` no es único).
- **Ejemplo**: incidente del 2-ene-2021 («salieron dos facturas con el mismo número»).
- **Evidencia**: `lib/numeracion.js:8-10` (comentario del incidente y arreglo), `:16`,
  `:32`; `db.js:52` (`numero TEXT NOT NULL`, sin UNIQUE).
- **Clasificación: ACCIDENTAL.** El «arreglo» de Julián («no ha vuelto a pasar (creo)»)
  solo acorta la ventana. Q-15.

### RN-40 · Dos series: FA (facturas) y RE (rectificativas)
- **Enunciado**: las facturas ordinarias van en la serie FA y las rectificativas en RE,
  cada una con su contador. Las series están escritas en el código (no son configurables).
- **Evidencia**: `routes/facturas.js:71` (FA), `:138` (RE); `scripts/remesa_mensual.js:57`.
- **Clasificación: INTENCIONAL** (comentario `lib/numeracion.js:5-6`).

---

## 7. Ciclo de vida de la factura (`routes/facturas.js`)

### RN-41 · Las facturas no se borran nunca
- **Enunciado**: no existe operación de borrado de facturas ni de líneas en el código; los
  errores se corrigen con una rectificativa y una factura nueva. Las altas «de baja» de
  clientes y artículos son lógicas (`activo = 0`).
- **Ejemplo (BD)**: `FA-2026-000106` (error de cuota duplicada) → rectificada, no borrada;
  sustituida por `FA-2026-000107`.
- **Evidencia**: `grep` de `delete` / `router.delete` / `app.delete` sin resultados en el
  código del producto (Entorno); comentario legal `lib/numeracion.js:3-6` («desde la
  inspección de 2020»).
- **Clasificación: INTENCIONAL.**

### RN-42 · Cobro: solo se puede cobrar lo que está «emitida»
- **Enunciado**: marcar como cobrada una factura solo cambia el estado si está «emitida»; si
  no lo está, la operación no hace nada y aun así redirige con éxito. No se mira la serie:
  una rectificativa (RE) «emitida» también podría marcarse como cobrada; no se registra
  fecha ni importe cobrado.
- **Ejemplo (BD)**: las facturas 101-104 están «cobradas», la 105, 107 y 108 «emitidas»,
  `RE-2026-000001` «emitida».
- **Evidencia**: `routes/facturas.js:117-122` (`WHERE ... AND estado = 'emitida'`).
- **Clasificación: INTENCIONAL** (filtro de estado); **ACCIDENTAL** (no distinguir serie ni
  avisar si no cambió nada).

### RN-43 · La rectificación es total y espejo exacto de la original
- **Enunciado**: rectificar crea una factura RE con cabecera e importes de la original
  **cambiados de signo**, sin recalcular nada, y copia cada línea con la cantidad y los
  importes en negativo (el precio unitario queda positivo). La original pasa a
  «rectificada». No hay rectificación parcial.
- **Ejemplo (BD)**: `FA-2026-000106` (base 101,61 · IVA 20,62 · total 122,23) →
  `RE-2026-000001` con −101,61 · −20,62 · −122,23, y sus dos líneas con cantidades −1 y
  −0,97.
- **Evidencia**: `routes/facturas.js:124-128` (comentario «Puri dixit: la rectificativa
  tiene que ser espejo exacto»), `:141-143`, `:148-150`, `:154`.
- **Clasificación: INTENCIONAL.** Testimonio de Puri (sin fecha) en el comentario.

### RN-44 · Qué facturas se pueden rectificar
- **Enunciado**: no se puede rectificar una factura ya «rectificada» ni una factura de la
  serie RE. Sí se puede rectificar una factura **cobrada** (pasa a «rectificada» sin
  ningún otro trámite); no se comprueba que sea la primera vez más allá del estado leído
  al principio.
- **Evidencia**: `routes/facturas.js:132-133`; no hay condición sobre `cobrada`.
- **Clasificación**: las dos prohibiciones, **INTENCIONAL** (mensajes explícitos); permitir
  rectificar una cobrada, **DUDOSA**: puede ser deseado (devolución tras el pago) o un
  hueco de validación. Q-16.

### RN-45 · Datos de la rectificativa: fecha de hoy, sin vencimiento
- **Enunciado**: la RE se fecha **hoy** (no en la fecha de la original), no lleva
  vencimiento y su observación es «Rectifica <número>. <motivo>». La original se marca
  «rectificada» al final, y solo si tiene líneas (si no tiene, no se responde).
- **Ejemplo (BD)**: `RE-2026-000001`: fecha 2026-05-06, vencimiento vacío,
  observaciones «Rectifica FA-2026-000106 (cuota abril duplicada)».
- **Evidencia**: `routes/facturas.js:141-143` (fecha `util.hoy()`, `null`), `:147-159`.
- **Clasificación: ACCIDENTAL** (la fecha de hoy y el caso sin líneas); la fecha puede caer
  en otro trimestre que la original (RN-47).

---

## 8. Informes para la gestoría (`routes/informes.js`)

### RN-46 · Resumen de IVA trimestral: suma de líneas por tipo de IVA
- **Enunciado**: por cada tipo de IVA, base, cuota y recargo se obtienen **sumando las
  líneas** de las facturas del trimestre, ordenado de mayor a menor tipo. Las rectificativas
  entran en negativo y restan solas. La suma no se redondea (se muestra con
  `formatearImporte`).
- **Ejemplo (BD, T1 de 2026)**: tipo 21 %: base 2.533,30 · cuota 532,00; tipo 10 %: base
  392,20 · cuota 39,22; tipo 4 %: base 811,10 · cuota 32,44. **Totales: base 3.736,60,
  IVA 603,66.**
- **Evidencia**: `routes/informes.js:14-30`, comentario `:21-22`, vista
  `views/informe_iva.ejs:5-14`, nota `:16`.
- **Clasificación: INTENCIONAL.**

### RN-47 · Fronteras del trimestre y estados incluidos
- **Enunciado**: el trimestre se define por la **fecha** de la factura (no por el año del
  número). Los límites son inclusivos: del día 1 del primer mes a «día 31» del tercer mes,
  comparados como texto. Entran **todas** las facturas, también «rectificada» y «cobrada».
  Original y rectificativa se compensan solo si caen en el mismo trimestre.
- **Ejemplo**: una factura de `2026-06-30` entra en el T2 (≤ `2026-06-31`). La original
  `FA-2026-000106` (rectificada) y su RE caen ambas en el T2 de 2026 → su efecto neto es
  0.
- **Evidencia**: `routes/informes.js:17-19`, `:23-25`.
- **Clasificación: ACCIDENTAL** (el «31» fijo funciona por comparar texto; nadie lo
  comenta).

### RN-48 · Parámetros por defecto y trimestre fuera de rango
- **Enunciado**: sin año se usa el actual; sin trimestre (o ilegible) se usa el 1. Un
  trimestre fuera de 1-4 (por ejemplo 5) provoca un error de ejecución porque no existe en
  la tabla de meses.
- **Ejemplo**: `/informes/iva?trimestre=5` → error interno (deducción del código, no
  ejecutado); `trimestre=0` → se usa el 1.
- **Evidencia**: `routes/informes.js:15-18`.
- **Clasificación: ACCIDENTAL.**

### RN-49 · Exportación CSV para la gestoría
- **Enunciado**: genera todas las facturas del **año de la fecha** (cualquier estado,
  FA y RE), ordenadas por número (texto). Formato: primera línea `CLAVE;<clave>`, segunda
  línea con las cabeceras `NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO`,
  separador `;`, importes con coma decimal y punto de millares, fecha `DD/MM/AAAA`,
  saltos de línea CRLF. Los **importes son los de la cabecera de la factura**, no la
  suma de líneas. No se escapan `;` ni saltos de línea en el nombre del cliente.
- **Ejemplo (BD, `FA-2026-000102`)**:
  `FA-2026-000102;06/02/2026;Ferretería El Tornillo;03488812K;115,60;24,28;6,01;145,89;cobrada`.
- **Evidencia**: `routes/informes.js:34-51`; clave `config.js:36-37`.
- **Clasificación: INTENCIONAL** (formato «acordado con Puri en 2019», comentario
  `routes/informes.js:32-33`; clave «no cambiar»). El orden por texto coloca todas las FA
  antes que las RE (ACCIDENTAL).

### RN-50 · El IVA de la pantalla y el del CSV pueden no coincidir
- **Enunciado**: la pantalla de IVA suma líneas (RN-46) y el CSV exporta cabeceras (RN-49).
  Si cabecera y líneas de una factura no coinciden, las dos salidas dan cifras distintas
  para el mismo periodo, y la gestoría podría recibir ambas.
- **Ejemplo (BD, T1 de 2026)**: por **líneas**: base 3.736,60 · IVA 603,66; por
  **cabeceras**: base 3.688,85 · IVA 736,97 · recargo 6,77. Facturas con diferencia:
  `FA-2026-000101` (IVA cabecera 27,97 vs líneas 24,27), `-105` (base 2.287,75 vs 2.335,50;
  IVA 468,63 vs 339,02), `-106`, `-107`, `RE-2026-000001` (IVA 20,62 vs 20,06) y `-108`
  (IVA 26,19 vs 24,26).
- **Evidencia**: `routes/informes.js:21-25` vs `:36-45`; datos en H-01.
- **Clasificación: DUDOSA.** No hay ninguna regla que diga cuál es la fuente de verdad.
  Q-17.

---

## 9. Utilidades de redondeo, formato, fechas y NIF (`lib/util.js`)

### RN-51 · Redondeo a 2 decimales, «de toda la vida»
- **Enunciado**: `redondear2(x) = Math.round(x * 100) / 100`: redondeo «half-up» sobre un
  número en coma flotante binaria. Los medios exactos que no son representables en binario
  pueden caer por abajo; en los **negativos**, el medio se redondea hacia cero (hacia +∞).
- **Ejemplos (Entorno)**: 1,005 → **1,00** · 2,675 → **2,68** · 1,255 → **1,25** · 10,075 →
  **10,07** · 0,285 → **0,28** · 0,125 → **0,13** pero −0,125 → **−0,12** · cantidad 0,01
  × 14,50 (0,145) → **0,14** · 0,03 × 7,50 (0,225) → **0,22**.
- **Evidencia**: `lib/util.js:5-7`; usada en `services/calculo.js:27,28,31,57,69,81-83,86,101`
  y `scripts/remesa_mensual.js:51`.
- **Clasificación: INTENCIONAL.** Comentario «de toda la vida», aviso «cuidado al
  tocar» (`lib/util.js:2`) y Constitución, Principio I. El efecto en los medios
  exactos es **ACCIDENTAL** pero forma parte del comportamiento sagrado.

### RN-52 · Formato de importes: no coincide con el redondeo de RN-51
- **Enunciado**: `formatearImporte` escribe el importe con `toFixed(2)`, punto de millares y
  coma decimal. `null`, `undefined` y no numéricos se muestran como `0,00`. Un negativo muy
  pequeño sale como «−0,00». `toFixed` y `redondear2` **no siempre dan lo mismo**.
- **Ejemplos (Entorno)**: 1234,5 → `1.234,50` · −1234,5 → `-1.234,50` · 1.000.000 →
  `1.000.000,00` · 2,675 → **`2,67`** (mientras `redondear2(2,675)` es 2,68) · 0,005 →
  `0,01` · −0,001 → **`-0,00`** · texto `'abc'` → `0,00`.
- **Evidencia**: `lib/util.js:51-58`; usada en `routes/informes.js:44-45` y las vistas.
- **Clasificación: ACCIDENTAL.** Ocurre al mostrar, no al calcular; solo afecta a importes
  que ya tengan más de 2 decimales (p. ej. sumas del informe de IVA, RN-46).

### RN-53 · Fechas: texto `AAAA-MM-DD`; «hoy» es la fecha local del servidor
- **Enunciado**: las fechas se guardan y comparan como **texto** ISO sin hora (comentario:
  «la bd guarda así desde 2018»). `hoy()` devuelve la fecha local del equipo que ejecuta
  el programa, no una zona fija. `fechaBonita` solo reordena los trozos separados por `-`,
  sin validar.
- **Ejemplos (Entorno)**: `fechaBonita('2026-05-06')` → `06/05/2026`; con una fecha con
  hora (`'2026-05-06T10:00'`) devuelve `06T10:00/05/2026`; vacío → vacío.
- **Evidencia**: `lib/util.js:9-15`, `:28-33`.
- **Clasificación: INTENCIONAL** (formato); **ACCIDENTAL** (dependencia de la zona
  horaria local y ausencia de validación).

### RN-54 · Días del mes
- **Enunciado**: el número de días lo calcula el calendario del sistema: febrero tiene 29
  en los bisiestos (2024) y 28 en los demás, incluidos 1900 y 2100 (correcto según
  calendario gregoriano). Un mes inválido no se detecta: el mes 13 da 31 días y el 00,
  también 31.
- **Ejemplos (Entorno)**: `2024-02` → 29 · `2026-02` → 28 · `1900-02` → 28 · `2100-02` → 28 ·
  `2026-13` → 31 · `2026-00` → 31. La remesa solo valida el **formato** `AAAA-MM`
  (`/^\d{4}-\d{2}$/`), no el rango del mes.
- **Evidencia**: `lib/util.js:36-39`; `scripts/remesa_mensual.js:14-18`, `:21`.
- **Clasificación: INTENCIONAL** (cálculo), **ACCIDENTAL** (mes 13/00).

### RN-55 · Validación del NIF/CIF: solo la longitud
- **Enunciado**: un NIF se acepta si tiene **9 caracteres** una vez quitados espacios y
  guiones. No se comprueba la letra ni el tipo; el valor se guarda tal cual lo tecleó el
  usuario (sin normalizar). La validación solo se aplica si el NIF se informa; puede
  quedar vacío.
- **Ejemplos (Entorno)**: `B12345678` → válido · `ABCDEFGHI` → **válido** · `123456789` →
  válido · `B-1234567` → inválido (8 tras quitar el guion) · cadena vacía → inválido (pero
  en el alta de cliente un NIF vacío no se valida). BD: `70355910k` (minúscula) está
  guardado.
- **Evidencia**: `lib/util.js:44-48`; llamada `routes/clientes.js:18-20` (solo `if
  (req.body.nif && ...)`), comentario TODO `lib/util.js:41-43`.
- **Clasificación: INTENCIONAL (provisional)**: es una decisión transitoria declarada
  («de momento con la longitud vale porque los da de alta Marga y los mira ella», Julián,
  nov 2017).

---

## 10. Constantes mágicas y tablas hardcodeadas

| Constante | Valor | Dónde | Época / origen | Por qué sigue |
|---|---|---|---|---|
| Recargo 21 / 10 / 4 % | 5,2 / 1,4 / 0,5 | `calculo.js:13-15` | Vigentes (SUPOSICIÓN, conocimiento general) | Se usa con clientes 2 y 4 (BD) |
| Recargo 18, 16 / 8, 7 % | 4 / 1 | `calculo.js:18-21` | «Ejercicios viejos del Access» (`:16-17`) | «No borrar» por si se reabren ejercicios; ninguna factura de la BD los usa (**BD**: tipos 21/10/4) |
| Umbral descuento 1 | 1.000 € → 2 % | `calculo.js:41` | Acuerdo con Paco, 2018 | Política comercial (Q-04) |
| Umbral descuento 2 | 5.000 € → 5 % | `calculo.js:40` | Ídem | Ídem |
| Mes comercial | 30 días | `calculo.js:99-101` | Access de Paco, previo a 2017 | Lo espera la gestoría (testimonio en comentario) |
| Plazo por defecto | 30 días | `config.js:40`; **duplicado** `remesa_mensual.js:60` | Sin fecha | — |
| Dígitos del número | 6 | `numeracion.js:40` | Sin fecha | — |
| Longitud NIF | 9 | `util.js:47` | TODO de nov 2017 | Provisional |
| Series | `'FA'`, `'RE'` | `facturas.js:71,138` | Rectificativas desde 2020 (comentario legal) | Requisito legal |
| Último día del trimestre | `-31` | `informes.js:19` | — | Funciona por comparar texto |
| Mes → trimestre | `{1:01-03,…}` | `informes.js:17` | — | Año natural |
| Clave de gestoría | texto fijo | `config.js:37` | Formato 2019 de Puri | «No cambiar» (no se reproduce el valor aquí) |
| Milisegundos por día | `24*60*60*1000` | `util.js:21` | — | Origen de la dependencia horaria (RN-32) |
| Redondeo `*100/100` | — | `util.js:6` | GesFact 1.x | Sagrado (Principio I) |

---

## 11. Discrepancias entre lo que dicen los comentarios y lo que hace el código

Cada una es un **hallazgo registrado**, no un descuido. Ninguna se corrige.

| # | Comentario / texto | Lo que hace el código | Evidencia | Regla |
|---|---|---|---|---|
| D-01 | «a partir de 1.000 eur → 2 %, a partir de 5.000 eur → 5 %» | Exige **más que** (`>`): 1.000,00 y 5.000,00 exactos no entran en el tramo | `calculo.js:37` vs `:40-41` | RN-07 |
| D-02 | «acordado con Paco … para fidelizar hostelería» | No distingue sector ni cliente; aplica a cualquier factura | `calculo.js:38` vs `:48-61` | RN-10 |
| D-03 | «meses de 31: el día 31 no se cobra» | Aplica un **tope de 30 días**, no excluye el 31: del 2 al 31 y del 1 al 30 cobran lo mismo (cuota entera) | `calculo.js:99` | RN-15 |
| D-04 | «el mes son siempre 30 días» (prorrateo) y «desde/hasta … dentro del MISMO mes» | Un mes completo de febrero (28 días) no cobra la cuota entera; no se comprueba que sean del mismo mes | `calculo.js:91-94` vs `:98-101` | RN-16, RN-17 |
| D-05 | «correlativa y sin huecos» (numeración) | Reserva el número **antes** de grabar; si falla, hay hueco | `numeracion.js:3-6` vs `:30-36` | RN-38 |
| D-06 | «puse el último+1 leyendo justo antes de grabar y no ha vuelto a pasar (creo)» | Sigue siendo lectura y escritura en sentencias separadas; no hay unicidad en la BD | `numeracion.js:8-10` vs `:16`,`:32`; `db.js:52` | RN-39 |
| D-07 | TODO: vencimiento «un día menos … creo que fue por el cambio de hora» | Con `Europe/Madrid`/`Atlantic/Canary` no se reproduce (0 de 2.016 casos); sí sale un día menos en una zona con desfase negativo | `util.js:18-26`; Entorno | RN-32 |
| D-08 | «dias de vencimiento por defecto si el cliente no tiene forma de pago» (`config.js`) | El alta manual lo respeta; la remesa usa un `30` literal propio | `config.js:39-40` vs `remesa_mensual.js:60` | RN-23, RN-31 |
| D-09 | Remesa: «prorratea por los días reales del mes» vs. prorrateo «a lo comercial … así lo espera la gestoría» | Dos fórmulas distintas para el mismo concepto | `remesa_mensual.js:43-44` vs `calculo.js:90-93` | RN-20, RN-26 |
| D-10 | `db.js:72`: base «ya redondeada (ver calculo.js)» y `db.js:122`: facturas «tal cual quedaron grabadas» | 7 de las 28 líneas de la BD **no se reproducen** con `calcularLinea` y 6 de 9 cabeceras **no suman** sus líneas (ver H-01, H-02) | `db.js:72`; BD | RN-01, RN-05 |
| D-11 | `db.js:36`: IVA «21 / 10 / 4» | El código admite cualquier IVA y conserva cuatro tipos antiguos | `db.js:36` vs `calculo.js:12-23` | RN-04, RN-13 |
| D-12 | `informes.js:21-22`: «las rectificativas entran con signo negativo y cuadran solas» | Solo cuadran si original y RE caen en el **mismo trimestre**; el CSV no suma líneas sino cabeceras | `informes.js:21-22` vs `:17-19`, `:36-45` | RN-47, RN-50 |
| D-13 | `remesa_mensual.js:6`: «normalmente el que acaba de terminar» (lanzada el día 1) | El número usa el año del reloj, no el del mes facturado | `remesa_mensual.js:5-7` vs `numeracion.js:15` | RN-37 |
| D-14 | `util.js:41`: «validación de NIF/CIF» | Solo cuenta caracteres; `ABCDEFGHI` es válido | `util.js:41-48` | RN-55 |
| D-15 | `facturas.js:124-127`: la rectificativa «deja la original en estado rectificada» | Si la factura no tiene líneas, no se marca ni se responde | `facturas.js:147-159` | RN-45 |

---

## 12. Hallazgos sobre los datos reales (BD) frente al código

Para el registro de anomalías (Principio III). Ejecutadas las funciones puras sobre las
líneas de la BD y comparadas con lo grabado.

- **H-01 · Cabeceras que no suman sus líneas.** 6 de 9 facturas: `FA-2026-000101` (IVA
  27,97 vs 24,27), `-105` (base 2.287,75 vs 2.335,50; IVA 468,63 vs 339,02), `-106`, `-107`
  y `RE-2026-000001` (IVA 20,62 vs 20,06), `-108` (IVA 26,19 vs 24,26). Solo `-102`, `-103` y
  `-104` cuadran. Es el origen de RN-50. (Coincide con `registro-riesgos.md` R1; las cifras
  se han recalculado aquí.)
- **H-02 · Líneas que `calcularLinea` no reproduce.** 7 líneas de 28: `FA-2026-000102`
  «Portes» (BD 1,90 / calc 1,92), `-103` «Portes» (5,50 / 5,52; IVA 1,15 / 1,16), `-105`
  «Portes» (17,20 / 17,22; IVA 3,61 / 3,62), `-106`, `-107` y la RE «Café 0,97 × 11,95»
  (11,61 / 11,59) y `-108` «Vaso caña 0,66 × 21,60» (14,15 / 14,26; IVA 2,97 / 2,99). Los
  importes grabados no salen de las reglas RN-01/RN-02 tal y como están hoy. SUPOSICIÓN:
  se tecleó el importe a mano o hubo una versión anterior del cálculo. Q-18.
- **H-03 · Remesa con líneas ajenas.** `FA-2026-000101` y `-108` («Remesa enero/mayo») tienen
  cuatro y tres líneas, mientras la remesa solo genera **una** por contrato
  (`scripts/remesa_mensual.js:54`, `:66`). Se añadieron a mano o por otra vía.
- **H-04 · `FA-2026-000105` con descuento sin reflejo en las líneas.** Observaciones: «Descuento
  volumen 2% aplicado», pero las líneas grabadas llevan el precio **sin** descuento (p. ej.
  145,00 €, no 142,10 €) y su suma (2.335,50) no es la base de cabecera (2.287,75).
  Recalculada con RN-09 la base sería **2.288,68** (Entorno); no coincide con ninguna de las
  dos cifras de la BD.
- **H-05 · Cuota duplicada (abril 2026).** `FA-2026-000106` → `RE-2026-000001` →
  `FA-2026-000107` (RN-24).
- **H-06 · Sin contratos de cuota alta.** Máxima cuota: 145 €; RN-25 no tiene caso real.

---

## 13. Preguntas abiertas para el negocio

| Q | Pregunta | Regla |
|---|---|---|
| Q-01 | ¿Qué rango de ejercicios podrían reabrirse con IVA 16/18/7/8 % y recargo 4/1 %? ¿Son esos recargos los que se aplicaron entonces? | RN-04 |
| Q-02 | ¿«A partir de 5.000 €» incluye los 5.000,00 € exactos? (el caso de 1.000 € está resuelto por la gestoría) | RN-07 |
| Q-03 | ¿El tramo del descuento debe decidirse con la base **antes** o **después** de descontar? (ejemplo: 1.020,41 € queda en 1.000,00 €) | RN-08 |
| Q-04 | ¿El descuento por volumen es solo para hostelería o para todos? ¿Algún cliente con acuerdo distinto? | RN-10 |
| Q-05 | En «a lo comercial», ¿un servicio de todo febrero debe cobrar la cuota completa o 28/30? | RN-17 |
| Q-06 | ¿Un contrato dado de baja el día 1 (o con alta el último día) debe facturar ese 1 día? | RN-19, RN-21 |
| Q-07 | ¿Qué fórmula es la correcta para prorratear la cuota: 30 días o días reales? ¿Quién decidió que la remesa fuera distinta? | RN-20, RN-26 |
| Q-08 | ¿Cómo se duplicó la cuota de abril de 2026 (FA-106)? ¿Se lanza la remesa dos veces alguna vez? | RN-24 |
| Q-09 | Tras una baja a mitad de mes, ¿se factura el último mes dos veces (prorrateo a mano + remesa)? | RN-18, RN-26 |
| Q-10 | ¿Se puede facturar a un cliente dado de baja? | RN-27 |
| Q-11 | ¿Los usuarios teclean alguna vez separador de miles (`1.234,50`) en precios o cantidades? | RN-29 |
| Q-12 | ¿Un cliente con plazo de pago 0 días debe significar «al contado» o «el plazo por defecto»? | RN-31 |
| Q-13 | ¿En qué equipo y con qué zona horaria se generó el vencimiento erróneo de marzo de 2019? ¿Dónde se ejecuta hoy el servidor? | RN-32 |
| Q-14 | ¿Alguna vez se ha lanzado la remesa de diciembre en enero? ¿Qué número y año llevó? | RN-37 |
| Q-15 | ¿Se ha comprobado desde 2021 que no hay números duplicados? | RN-39 |
| Q-16 | ¿Se puede rectificar una factura ya cobrada? ¿Y rectificar parcialmente (devolución parcial)? | RN-44 |
| Q-17 | ¿Qué documento usa la gestoría para el modelo 303: la pantalla (líneas) o el CSV (cabeceras)? | RN-50 |
| Q-18 | ¿Por qué 7 líneas y 6 cabeceras de la BD no coinciden con las reglas? ¿Se teclearon a mano o hubo otra versión del cálculo? | H-01, H-02, H-04 |
| Q-19 | ¿Quién es Paco y está su acuerdo (descuento 2018, 30 días) por escrito? | RN-07, RN-14 |
| Q-20 | ¿Se quiere extender la extracción a las rutas de criticidad media (clientes, contratos, artículos) y al panel de inicio? | §0.1 |

---

## 14. Qué se ha verificado y qué no

- **Verificado** (Entorno): resultados de `calcularLinea`, `calcularFactura`,
  `porcentajeDescuento`, `calcularProrrateo`, `recargoPara`, `redondear2`, `diasDelMes`,
  `sumarDias`, `validarNIF`, `formatearImporte` y `fechaBonita` en las entradas citadas; la
  comparación de las 28 líneas de la BD con `calcularLinea`; las sumas de cabeceras y líneas.
- **Deducido del código, no ejecutado**: todo el comportamiento de `numeracion.js`,
  `routes/*` y `scripts/remesa_mensual.js` (escriben en la BD; la Constitución prohíbe
  modificarla). Cada regla que depende de ellos lo indica («deducción del código»).
- **No verificable**: la zona horaria y la versión de Node del equipo de la oficina; si el
  equipo real tiene la misma BD; qué hizo cada persona con las facturas manualmente.
- **Puerta de calidad (Constitución)**: (a) sin cambios de comportamiento: el único fichero
  creado es este; (b) sin dependencias ni refactors; (c) cada afirmación lleva evidencia
  (código, **BD** o **Entorno**) o va marcada SUPOSICIÓN; (d) en español de España.
