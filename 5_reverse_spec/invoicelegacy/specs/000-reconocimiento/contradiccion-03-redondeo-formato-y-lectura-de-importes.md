# Contradicción 03 — Redondear, mostrar y leer un importe (tres convenciones)

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código, **BD** (`sqlite3 -readonly`) y **Entorno** (funciones
puras en memoria).

**Estado: divergencia ACTIVA en el formato; LATENTE en el redondeo y en la lectura.**

## 1. Implementaciones y qué camino usa cada una

### 1.1 «Redondear a 2 decimales»

| Variante | Fichero y líneas | Quién la usa |
|---|---|---|
| **R-1** `Math.round(x*100)/100` (`redondear2`) | `lib/util.js:5-7` | Todo el cálculo: `calculo.js:27,28,31,57,69,81-83,86,101`; `remesa_mensual.js:51` |
| **R-2** `toFixed(2)` dentro de `formatearImporte` | `lib/util.js:54` | Listado y detalle de factura, informes, CSV (`routes/informes.js:44-45`; `views/facturas.ejs:19`; `views/factura_detalle.ejs:28-40`; `views/informe_iva.ejs:7-14`) |
| **R-3** `toFixed(2)` directo | `views/index.ejs:6`; `views/contratos.ejs:8`; `views/articulos.ejs:8`; `routes/contratos.js:40`; `scripts/remesa_mensual.js:71` | Panel de inicio, listado de contratos y artículos, URL del prorrateo, consola de la remesa |
| **R-4** Sin redondear | `server.js:24` (`SUM(total)`); `routes/informes.js:23` (`SUM(l.base)`…); `views/informe_iva.ejs:5` (`tb+=…` en la vista) | Importe pendiente del panel; totales del informe de IVA |

### 1.2 «Escribir un importe» (formato de salida)

| Formato | Dónde | Ejemplo con 2756,38 |
|---|---|---|
| **F-1** `1.234,50` (`formatearImporte`) | Listado/detalle de facturas, informe de IVA, CSV | `2.756,38` |
| **F-2** `1234.50` (`toFixed(2)`) | Panel, cuotas de contratos, precios de artículos, consola de la remesa, URL | `2756.38` |

### 1.3 «Leer un importe tecleado» (formato de entrada)

| Copia | Fichero y líneas |
|---|---|
| `parseFloat(('' + x).replace(',', '.'))` | `routes/facturas.js:59` (cantidad) y `:60` (precio); `routes/contratos.js:19` (cuota); `routes/articulos.js:19` (precio) |

## 2. ¿Misma convención o algoritmo? Paso a paso

**R-1 frente a R-2/R-3** (los dos redondeos de «céntimo»):

| Paso | R-1 `redondear2` | R-2/R-3 `toFixed(2)` |
|---|---|---|
| Operación | Multiplica por 100, `Math.round` (medio hacia +∞), divide por 100 | Expande el `double` binario exacto y redondea ese decimal |
| Empate «exacto» (p. ej. 0,125) | Sube (0,13) | Depende de la representación binaria |
| Número negativo, empate | Hacia cero (−0,125 → −0,12) | `formatearImporte` trabaja con el valor absoluto (`util.js:53-54`): **−0,13** |
| Dónde actúa | Al **calcular** (se guarda) | Al **mostrar** (no se guarda) |

**F-1 frente a F-2**: miles con punto y decimales con coma, frente a decimal con punto y sin
miles. Además `formatearImporte` convierte `null`, `undefined` y no numéricos en `0,00`
(`util.js:52`), mientras `toFixed` lanza error si el valor es `null` (R-3 no protege).

**Lectura frente a escritura**: la entrada acepta `12,5` (coma decimal) y `12.5` (punto
decimal), pero **solo cambia la primera coma**. No interpreta el punto de millares que
la propia salida F-1 produce.

## 3. Ejemplos con resultados distintos para la misma entrada

(**Entorno**; valores con tres decimales, `R-1` frente a `toFixed`):

| Valor | `redondear2` (R-1) | `toFixed(2)` (R-2/R-3) |
|---|---|---|
| 0,015 | 0,02 | 0,01 |
| 2,675 | 2,68 | **2,67** (`formatearImporte` → `2,67`) |
| 1,005 | 1,00 | 1,00 |
| 8,345 | 8,35 | 8,35 |
| −0,125 | −0,12 | `−0,13` (`formatearImporte`) |

**Cuantificación**: sobre los 100.000 valores `k/1000` (de 0,000 a 99,999), `redondear2` y
`toFixed(2)` difieren en **4.228** (≈ 4,2 %).

**Mismo importe, dos formatos en pantalla** (**BD**): `FA-2026-000105`, total 2756,38.
Listado: `2.756,38 €` (`facturas.ejs:19`). La suma de las tres facturas `FA` emitidas
(105, 107 y 108) es 3032,85, que el panel muestra como `3032.85 €` (`index.ejs:6`,
`importePendiente.toFixed(2)`): sin separador de miles y con punto. Cualquier importe
que se muestre en las dos familias sale con dos formatos distintos (100 % de los casos).

**Lectura de un importe con millares**: el listado de facturas muestra `1.210,00`
(`FA-2026-000103`). Si se teclea ese texto como precio, `parseFloat('1.210.00')` da
**1,21** (Entorno: `'1.234,50'` → `1.234`). Divergencia de ×1000 en la dirección
contraria al formato de salida.

## 4. Cuándo se manifiesta y cuándo coinciden

- **R-1 y R-2 coinciden** cuando el valor ya tiene como mucho 2 decimales. Todo lo que
  se guarda en la BD pasó por `redondear2`, así que se muestra igual: **0 diferencias**
  en los 62 valores intermedios calculados sobre las 28 líneas reales (cantidad × precio y
  cuota de IVA de cada línea, más 6 cuotas de recargo; **Entorno**). Divergen solo con valores no redondeados: sumas del
  informe de IVA (R-4) o importes con 3 decimales.
- **Deriva de coma flotante**: la suma real de bases al 4 % del trimestre es
  `811.09999999999991` (`registro-riesgos.md` R32, **BD**), que `formatearImporte` muestra como `811,10` (coinciden al
  mostrar, pero el valor interno no es exacto).
- **Formatos F-1/F-2**: divergen siempre; coinciden solo en importes < 1000 con
  mismo separador decimal (nunca, porque F-1 usa coma y F-2 punto).
- **Lectura**: no se manifiesta mientras los precios y cuotas tecleados sean < 1000 con
  coma o con punto sin miles. En los datos reales, el precio unitario máximo es 145,00
  (cuota) y 28,90 (artículo) (**BD**), por debajo de 1000.
- **Por qué no se ha visto**: el autorrelleno escribe el precio con punto
  (`data-precio="28.9"`, `views/factura_nueva.ejs:23`, `public/js/factura.js:9`), que
  `parseFloat` entiende; y los importes ≥ 1000 que aparecen en pantalla son totales
  calculados, no teclados.

## 5. Historia probable (SUPOSICIÓN)

- `redondear2` es «de toda la vida» (`util.js:4`), heredado del Access (`util.js:2`).
- Los `toFixed(2)` directos están en las vistas que **no reciben `util`**: `index.ejs`
  (`server.js:26` renderiza sin `util`) y `articulos.ejs` (`routes/articulos.js:11` sin
  `util`). `contratos.ejs` sí recibe `util` (`routes/contratos.js:12`) y usa
  `util.fechaBonita` en la misma fila (`:9`), pero `toFixed` para la cuota (`:8`): el
  patrón apunta a pantallas escritas **antes** de existir `formatearImporte` y no
  actualizadas.
- `formatearImporte` y el CSV con coma decimal llegan con la versión 2.3 (2019,
  `server.js:5`; `routes/informes.js:32-33`), cuando la gestoría pidió formato español.
- La lectura con `replace(',', '.')` se copió en tres rutas; nada la relaciona con
  `formatearImporte`. Todo esto es inferencia del orden de versiones; no hay
  historial de git del producto.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: rareza / deuda)**: «Tres convenciones para importes:
redondeo `Math.round` al calcular y `toFixed` al mostrar (difieren en ≈ 4 % de los
valores de 3 decimales); dos formatos de salida (`1.234,50` y `1234.50`); y una lectura
de entrada que no entiende el formato de salida».

**Preguntas al negocio**:
- QC-07. ¿Qué formato espera ver la oficina en el panel de inicio (importe pendiente): el
  mismo que el listado de facturas?
- QC-08. ¿Se teclean alguna vez precios o cantidades con separador de miles?
- QC-09. ¿Se ha contrastado alguna vez un importe del informe de IVA con la suma de sus
  facturas a nivel de céntimo (el informe suma sin redondear, `informe_iva.ejs:5`)?
