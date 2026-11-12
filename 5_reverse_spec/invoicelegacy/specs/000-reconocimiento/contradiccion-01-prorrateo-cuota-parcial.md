# Contradicción 01 — Prorrateo de una cuota parcial de contrato

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál de
las dos implementaciones es la correcta**: es una pregunta de negocio. No se ha corrido
ninguna escritura sobre la BD; los cálculos son funciones puras ejecutadas en memoria
(**Entorno**) o consultas `sqlite3 -readonly` (**BD**).

**Estado: divergencia ACTIVA.** Ya registrada parcialmente como O1/R5 (`mapa-sistema.md`,
`registro-riesgos.md`) y RN-26 (`reglas-de-negocio.md`); aquí se compara paso a paso y se
cuantifica.

## 1. Implementaciones y qué camino usa cada una

| | **I-1 `calcularProrrateo`** | **I-2 cálculo en línea de la remesa** |
|---|---|---|
| Fichero y líneas | `services/calculo.js:95-102` (comentario `:90-94`) | `scripts/remesa_mensual.js:45-51` (comentario `:43-44`) |
| Quién la llama | `routes/contratos.js:39`, dentro de `POST /contratos/:id/baja` (única llamada) | Se ejecuta para **cada** contrato dentro de `procesarSiguiente` |
| Entrada | cuota, `primeroDeMes = fechaBaja.slice(0,8)+'01'` (`contratos.js:38`), `fechaBaja` | cuota, `fecha_alta`, `fecha_baja`, mes `AAAA-MM` |
| Qué se hace con el resultado | Solo se **muestra** en la URL `/contratos?prorrateo=…` (`contratos.js:40`); ninguna ruta ni vista lo lee (`mapa-sistema.md` F4). Administración emite la factura «a mano» (`contratos.js:28-30`) | Se factura directamente: `calcularFactura` → número → `INSERT` (`remesa_mensual.js:55-68`) |
| Qué casos cubre | Solo **baja** (nunca alta, nunca mes completo) | Mes completo, alta, baja, ambas |

## 2. ¿Misma convención? Comparación paso a paso

| Paso | I-1 (`calculo.js`) | I-2 (remesa) | ¿Igual? |
|---|---|---|---|
| Fecha de inicio del servicio | **Siempre el día 1** del mes de la baja (`contratos.js:38`); ignora la fecha de alta | `max(fecha_alta, día 1)` (`remesa_mensual.js:45`) | **No** |
| Fecha de fin | La fecha de baja tal cual (`contratos.js:35,39`) | `min(fecha_baja, último día)`; solo recorta si `fecha_baja < último día` (`:46`) | Casi (coinciden si baja dentro del mes) |
| Días de servicio | `d2 − d1 + 1` (`calculo.js:96-98`) | `d2 − d1 + 1` (`:48-50`) | **Sí** (mismo código, nombres `d1`, `d2` idénticos) |
| Tope | `dias > 30 → 30` (`:99`) | Ninguno | **No** |
| Mínimo | `dias < 0 → 0` (`:100`) | Ninguno: puede salir negativo | **No** |
| Divisor del mes | **30 fijo** (`:101`) | **Días reales** del mes, `util.diasDelMes` (`:47,51`) | **No** |
| Fórmula | `redondear2(cuota / 30 * dias)` | `redondear2(cuota / diasMes * diasServicio)` | Misma estructura |
| IVA, recargo, descuento | No los calcula (devuelve base) | Los añade `calcularFactura` (`:55`) | No aplica |
| Comprobación de mes | Ninguna (el comentario dice «dentro del MISMO mes», `:94`) | Implícita: se recorta al mes | **No** |

## 3. Ejemplos con resultados distintos para la misma entrada

Todos con `redondear2` real (**Entorno**). «Pantalla» = I-1; «Remesa» = I-2.

| Caso | Cuota | Pantalla (I-1) | Remesa (I-2) | Diferencia (base) |
|---|---|---|---|---|
| **Real, contrato 4** (alta 2026-02-15, febrero de 28 días; mismas fechas 15→28 en ambas fórmulas) | 90,00 | 42,00 (14 × 90/30) | 45,00 (14/28 × 90) | **+3,00** (remesa); con IVA 21 %: total 54,45 vs 50,82, **+3,63** |
| **Real, contrato 2** (alta 2023-01-15, enero de 31 días) | 145,00 | 82,17 (17/30) | 79,52 (17/31) | **−2,65**; con IVA: 99,43 vs 96,22, **−3,21** |
| Alta el 16 de julio | 90,00 | 48,00 | 46,45 | −1,55 |
| Baja el 15 de marzo (31 días), contrato 2 | 145,00 | 72,50 | 70,16 | −2,34 |
| Baja el 28 de febrero (servicio de todo el mes) | 100,00 | 93,33 | 100,00 | **+6,67** |
| Alta 15 y baja 20 de febrero (mismo mes) | 90,00 | **60,00** (días 1→20) | **19,29** (días 15→20, 6/28) | **−40,71** |
| Baja anterior al alta en el mismo mes (alta 20, baja 10, febrero) | 90,00 | 30,00 (días 1→10) | **−28,93** (línea negativa; con IVA total −35,01) | — |

Datos reales usados: contratos 2 y 4 de `datos/gesfact.db` (**BD**: `contratos`).

Nota de método: las cinco primeras filas comparan **las dos fórmulas con el mismo rango de
fechas** (`desde`, `hasta`), para aislar la diferencia de divisor. I-1, tal y como la
llama la pantalla de baja, solo recibe el día 1 y la fecha de baja (`contratos.js:38-39`),
de modo que nunca vería «15→28»; esa diferencia de punto de partida es la que muestran
las dos últimas filas (alta y baja en el mismo mes).

### Cuantificación general (cuota de 100 €, todas las altas y bajas posibles)

Se compararon, para cada día `d` del mes, «alta en `d` hasta fin de mes» y «baja en `d`
desde el día 1» (**Entorno**):

| Longitud del mes | Casos | Casos con importe distinto | Diferencia máxima |
|---|---|---|---|
| 28 días (feb. normal) | 56 | **56** (100 %) | 6,67 € por cada 100 € de cuota |
| 29 días (feb. bisiesto) | 58 | **58** (100 %) | 3,33 € |
| 30 días | 60 | **0** | 0,00 € |
| 31 días | 62 | **60** | 3,23 € |

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden**: en meses de **30 días** (abril, junio, septiembre, noviembre) siempre; en
  meses de 31 días solo si el servicio empieza el día 1 o termina el día 31 (el tope de 30
  de I-1 compensa).
- **Divergen**: en febrero **siempre**, incluso en un mes completo; en los de 31 días en
  casi todas las altas y bajas intermedias.
- **Por qué nadie lo ha visto (deducción)**:
  1. De los 4 contratos reales, las dos altas/bajas de `contrato 3` (16-jun-2025 y
     15-sep-2025) caen en meses de 30 días → **coinciden**; `contrato 1` empieza el día 1
     de un mes de 31 → coincide. Solo `contrato 2` (ene-2023) y `contrato 4` (feb-2026)
     caen en meses que divergen.
  2. I-1 **no genera factura**: su importe solo viaja en la URL (`contratos.js:40`) y
     nadie lo lee en pantalla. Las dos cifras nunca se ven una al lado de la otra.
  3. **BD**: no existe ninguna factura de `contrato 4` de febrero ni de marzo de 2026
     (solo `FA-2026-000106`, de abril), ni de `contrato 2` de enero de 2023. No se puede
     comprobar qué importe se facturó realmente en los dos casos divergentes. QC-01.
- **Interacción**: tras la baja a mitad de mes, el contrato **sigue entrando en la remesa
  de ese mes** (`remesa_mensual.js:28`, `fecha_baja >= primerDia`). Si además
  administración factura a mano el importe de la pantalla, el último mes puede
  facturarse dos veces con importes distintos. No verificado (SUPOSICIÓN). QC-02.

## 5. Historia probable (SUPOSICIÓN; no hay historial de git del producto)

1. **Antes de 2017**: Paco prorrateaba a mano en el Access con mes de 30 días (comentario
   de `calculo.js:90-93`: «así lo hacía Paco… y así lo espera la gestoría»). Al reescribir
   en Node (v2.0, 2017, `server.js:7`) se conservó como `calcularProrrateo`.
2. **Verano de 2021**: Roberto, becario, escribió la remesa (`remesa_mensual.js:5-6`;
   `server.js:4`). Necesitaba prorratear también **altas** y **meses completos**, algo que
   `calcularProrrateo` no contemplaba (solo recibe `desde`/`hasta` del mismo mes y no
   recorta al mes).
3. **Indicio de copia adaptada**: las líneas `remesa_mensual.js:48-50` repiten casi
   literalmente `calculo.js:96-98` (`parseInt(x.split('-')[2], 10)`, `d1`, `d2`,
   `d2 - d1 + 1`), con el divisor 30 sustituido por `diasMes` y sin el tope. Parece una
   copia modificada, no una decisión documentada.
4. El comentario de la remesa dice «se prorratea por los días reales del mes»
   (`:43-44`): era una decisión consciente de quien lo escribió o desconocimiento de la
   regla comercial; **no se puede distinguir desde el código**. La remesa **no** importa
   `calcularProrrateo` aunque ya importa `calculo` (`:11`) para otra cosa.
5. Nadie reconcilió ambas; la Constitución (Principio I) protege el 30 comercial y el
   comportamiento actual de la remesa a la vez.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: discrepancia / riesgo de importes)**: «Dos fórmulas de
prorrateo (30 días fijos vs días reales), con diferencias de hasta 6,67 € por cada 100 €
de cuota en febrero y 3,23 € en meses de 31 días; solo coinciden en meses de 30 días.
Además la pantalla de baja parte del día 1 aunque el contrato empezara a mitad de mes, y
la remesa puede generar líneas negativas».

**Preguntas al negocio** (sin sugerir respuesta):
- QC-01. ¿Qué importe se facturó realmente por el alta del contrato 4 (feb-2026) y del
  contrato 2 (ene-2023)? ¿Se conservan esas facturas?
- QC-02. Cuando se da de baja un contrato a mitad de mes, ¿se facturan ese mes la remesa,
  la factura manual, o ambas? ¿Con qué importe?
- QC-03. ¿La gestoría espera que un servicio durante **todo febrero** cobre la cuota
  completa o 28/30?
- QC-04. ¿Quién decidió, y cuándo, que la remesa prorrateara por días reales? ¿Se
  consultó a la gestoría?
