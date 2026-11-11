# Contradicción 06 — Los importes de una factura existen dos veces (cabecera y líneas) y se leen de fuentes distintas

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la fuente correcta.** Evidencia: código, **BD** (`sqlite3 -readonly`, producción
confirmada por el negocio según `registro-riesgos.md` R1) y **Entorno**.

**Estado: divergencia ACTIVA en los datos reales** (6 de 9 facturas). Ya anotada como R1
y RN-50; aquí se cuantifica por factura, periodo y pantalla.

## 1. Implementaciones y qué camino usa cada una

El mismo concepto —«cuánto suman base, IVA y recargo de una factura»— se guarda y se lee
de dos sitios:

| Fuente | Dónde se escribe | Quién la lee |
|---|---|---|
| **Cabecera** `facturas.base/iva/recargo/total` | `calcularFactura` (`calculo.js:81-86`) → `INSERT` en `facturas.js:74-76` y `remesa_mensual.js:61-62`; rectificativa: `-f.base`, `-f.iva`… (`facturas.js:142`) | CSV de gestoría (`informes.js:36,44-45`); importe del panel `SUM(total)` (`server.js:24`); totales impresos en la factura (`factura_detalle.ejs:37-40`); listado (`facturas.ejs:19`) |
| **Líneas** `lineas.base/cuota_iva/cuota_recargo` | `calcularFactura` (`calculo.js:72-80`) → `INSERT` (`facturas.js:86`, `remesa_mensual.js:67`); rectificativa: `-l.base`… (`facturas.js:150`) | Informe de IVA trimestral (`informes.js:23-25`); líneas impresas en la factura (`factura_detalle.ejs:24-34`) |

## 2. ¿Mismo algoritmo? Paso a paso

- **Cuando las crea el código**, ambas salen de la **misma variable** `c` dentro del mismo
  bucle (`calculo.js:71-83`): la línea guarda `c.base`, `c.cuotaIva`, `c.cuotaRecargo` y la
  cabecera los acumula con `redondear2` en cada vuelta. Sumar valores de 2 decimales y
  redondear tras cada suma es exacto, así que **cabecera = suma de líneas por
  construcción** en todo lo emitido por `calcularFactura` (alta manual y remesa).
- **Rectificativa**: copia ambos lados cambiados de signo, sin recalcular
  (`facturas.js:127-128`, «espejo exacto»); por tanto **hereda** cualquier discrepancia de
  la original.
- **Informe de IVA** (por líneas): desglosa por tipo de IVA (necesita las líneas).
  **CSV** (por cabecera): una fila por factura. Cada informe tiene una razón para su
  fuente.
- **Panel**: `SUM(total)` de cabecera.

## 3. Ejemplos con resultados distintos para la misma entrada

**3.1 Por factura (BD)**: `base + iva + recargo` de las líneas frente a la cabecera.

| Factura | Base cab. | Base líneas | IVA cab. | IVA líneas | Total cab. | Total líneas |
|---|---|---|---|---|---|---|
| `FA-2026-000101` | 133,20 | 133,20 | **27,97** | 24,27 | 161,17 | **157,47** |
| `FA-2026-000102` | 115,60 | 115,60 | 24,28 | 24,28 | 145,89 | 145,89 |
| `FA-2026-000103` | 1.000,00 | 1.000,00 | 210,00 | 210,00 | 1.210,00 | 1.210,00 |
| `FA-2026-000104` | 152,30 | 152,30 | 6,09 | 6,09 | 159,15 | 159,15 |
| `FA-2026-000105` | **2.287,75** | 2.335,50 | **468,63** | 339,02 | 2.756,38 | **2.674,52** |
| `FA-2026-000106` | 101,61 | 101,61 | **20,62** | 20,06 | 122,23 | **121,67** |
| `RE-2026-000001` | −101,61 | −101,61 | **−20,62** | −20,06 | −122,23 | **−121,67** |
| `FA-2026-000107` | 101,61 | 101,61 | **20,62** | 20,06 | 122,23 | **121,67** |
| `FA-2026-000108` | 128,05 | 128,05 | **26,19** | 24,26 | 154,24 | **152,31** |

Coinciden 3 de 9 (102, 103, 104). Las otras 6 difieren: la mayor, `FA-2026-000105`,
en 81,86 € de total y 129,61 € de IVA. La factura impresa de `FA-2026-000101` suma en
sus líneas 24,27 € de IVA y en su pie dice «IVA 27,97 €».

Un caso se explica con una regla simple: en `FA-2026-000101`, 21 % de la base total
(133,20 × 0,21 = 27,97) es la cifra de cabecera. En las demás no he encontrado regla
que reproduzca la cabecera (p. ej. 21 % de 2.287,75 sería 480,43, no 468,63).

**3.2 Por periodo (BD)**:

| Periodo | CSV (cabeceras): base / IVA | Informe IVA (líneas): base / IVA | Diferencia |
|---|---|---|---|
| T1 2026 (facturas 101-105) | 3.688,85 / 736,97 | 3.736,60 / 603,66 | base −47,75; IVA **+133,31** |
| Año 2026 (las 9) | 3.918,51 / 783,78 | 3.966,26 / 647,98 | base −47,75; IVA **+135,80** |

**3.3 Panel (BD)**: «Importe pendiente de cobro» = 3.032,85 € (cabecera de 105, 107 y
108). Con las líneas serían 2.948,50 € (2.674,52 + 121,67 + 152,31): **84,35 €** menos.

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden** en toda factura que haya generado `calcularFactura` sin retoques; en la
  BD, 102, 103 y 104.
- **Divergen** en facturas con cabecera y líneas no generadas juntas por el código. Las
  seis divergentes son las que `db.js:122-165` carga como «historicas (resumen, tal cual
  quedaron grabadas)»; dos («Remesa enero» y «Remesa mayo») tienen más líneas de las que
  la remesa graba (`remesa_mensual.js:54,66`), lo que apunta a ediciones manuales
  posteriores (también el comentario de `facturas.js:81-82`: «ya se apañó a mano en la
  bd»).
- **Por qué no se ha visto**: la gestoría usa el informe de IVA para el 303 (líneas) y el
  CSV para su contabilidad (cabeceras) sin que nada los cruce; en `informe_iva.ejs:16` solo
  se dice que «se calculan sumando las líneas».
- En las seis facturas el IVA de cabecera es mayor (en valor absoluto) que el de las
  líneas; la base de `FA-2026-000105` es la única en que la cabecera es menor. No sé si
  es casualidad.

## 5. Historia probable (SUPOSICIÓN)

1. En 2017-2018 la factura guardaba solo cabecera y líneas generadas juntas.
2. En 2019 (v2.3) se añaden informes: el IVA por tipo exige sumar líneas
   (`informes.js:21-22`: «se suma desde las líneas para tener el desglose por tipo»); el
   CSV, acordado con Puri, exporta una fila por factura, y la cabecera es lo natural.
   Cada informe se escribió con la fuente que le convenía, bajo el supuesto de que ambas
   coinciden.
3. Los incidentes de «apaño a mano» en la BD (`facturas.js:81-82`) y la carga de datos
   históricos desde el Access son los candidatos a haber roto la igualdad. No se puede
   confirmar.
4. La rectificativa como «espejo exacto» (Puri) copia la discrepancia sin detectarla.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: datos / discrepancia crítica)**: «6 de 9 facturas
tienen cabecera ≠ suma de líneas. El informe de IVA suma líneas y el CSV cabeceras, con
diferencia de IVA de 135,80 € en 2026; el panel suma cabeceras».

**Preguntas al negocio**:
- QC-15. ¿Qué documento usa la gestoría para el modelo 303 y cuál para su contabilidad?
  ¿Les ha salido alguna vez una diferencia entre ambos?
- QC-16. ¿Qué cifra considera correcta la oficina en `FA-2026-000101`, `-105`, `-106`,
  `-107` y `-108`: la de la cabecera o la de las líneas? ¿Quién modificó esos importes?
- QC-17. ¿La factura `FA-2026-000105` se imprimió con las líneas sin descuento y el total
  de cabecera? (las líneas no llevan el 2 % que dice la observación; ver RN-11 y H-04).
