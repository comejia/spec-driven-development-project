# Contradicción 07 — «Factura emitida / pendiente de cobro»: tres criterios en el panel y el listado

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código y **BD** (`sqlite3 -readonly`).

**Estado: divergencia ACTIVA desde que existe la primera rectificativa
(`RE-2026-000001`, 2026-05-06).**

## 1. Implementaciones y qué camino usa cada una

| Criterio | Fichero y líneas | Lo que muestra |
|---|---|---|
| **P-1** `COUNT(*) FROM facturas` (sin filtro) | `server.js:22`; etiqueta «Facturas emitidas (total histórico)», `views/index.ejs:4` | Todas las facturas, de cualquier estado y serie |
| **P-2** `COUNT(*) … WHERE estado = 'emitida'` | `server.js:23`; etiqueta «Facturas pendientes de cobro», `index.ejs:5` | Emitidas de **cualquier** serie (FA y RE) |
| **P-3** `SUM(total) … WHERE estado = 'emitida' AND serie = 'FA'` | `server.js:24`; etiqueta «Importe pendiente de cobro», `index.ejs:6` | Solo serie **FA** |
| **P-4** Filtro «emitidas» del listado | `routes/facturas.js:18-19`; `views/facturas.ejs:7` | `estado = 'emitida'`, de cualquier serie |
| **P-5** Quién puede cobrarse según la pantalla | `views/factura_detalle.ejs:47` | `estado === 'emitida' && serie === 'FA'` |
| **P-6** Quién puede cobrarse según el endpoint | `routes/facturas.js:118` | `estado = 'emitida'` (cualquier serie) |

## 2. ¿Mismo criterio? Paso a paso

| Pregunta | P-1 | P-2 | P-3 | P-4 | P-5 | P-6 |
|---|---|---|---|---|---|---|
| ¿Cuenta cobradas? | Sí | No | No | No | No | No |
| ¿Cuenta rectificadas (original)? | Sí | No | No | No | No | No |
| ¿Cuenta una RE `emitida`? | Sí | **Sí** | **No** | **Sí** | **No** | **Sí** |
| ¿Cuenta importe? | No (cuenta) | No (cuenta) | Sí | No | — | — |

P-2 y P-3 están **dos líneas seguidas en la misma función**, una detrás de otra
(`server.js:23-24`), con criterio de serie distinto.

## 3. Ejemplos con resultados distintos para la misma entrada

**BD** (agrupado por estado y serie):

| Estado | Serie | Nº | Suma de totales |
|---|---|---|---|
| cobrada | FA | 4 | 1.676,21 |
| emitida | FA | 3 | 3.032,85 |
| emitida | RE | 1 | −122,23 |
| rectificada | FA | 1 | 122,23 |

El panel muestra:

| Indicador | Valor mostrado | Con qué criterio |
|---|---|---|
| «Facturas emitidas (total histórico)» | **9** | P-1: incluye cobradas, rectificada y la RE; el listado filtrado «emitidas» (P-4) devuelve **4** |
| «Facturas pendientes de cobro» | **4** | P-2: 3 FA + 1 RE |
| «Importe pendiente de cobro» | **3032.85 €** | P-3: solo las 3 FA |

Cantidad y importe no se corresponden: las 4 «pendientes» suman, con la RE, **2.910,62 €**
(3.032,85 − 122,23); el panel no muestra ni esa cifra ni «3 facturas».

**Pantalla frente a endpoint (cobro)**: `RE-2026-000001` figura en el panel como pendiente
de cobro, pero la pantalla no ofrece «Marcar cobrada» para ella (P-5). El endpoint sí lo
aceptaría (P-6; **no ejecutado**, deducción de `facturas.js:118`).

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden** (P-2 y P-3 sobre las mismas facturas) mientras no exista ninguna RE en
  estado `emitida`. En la BD, hasta la factura `FA-2026-000106`; la divergencia empezó el
  **2026-05-06** (fecha de `RE-2026-000001`).
- **Divergen** a partir de cada rectificativa: una RE nace `emitida` (`facturas.js:142`)
  y nunca se cobra (P-5), así que suma **+1 permanente** al recuento de «pendientes».
- **P-1 y P-4**: la palabra «emitidas» significa dos cosas: «todas» (panel) y
  «estado emitida» (listado).
- **Por qué no se ha visto**: el panel «son cuatro números y a correr»
  (`server.js:21`); solo hay una RE en toda la BD; quien lo mira ve «4» y «3.032,85» sin
  compararlos.

## 5. Historia probable (SUPOSICIÓN)

- El panel es de la versión 2.0 (2017) y su estructura de cuatro consultas encadenadas
  (`server.js:20-36`) es anterior a las rectificativas, que nacen tras la inspección de
  2020 (`numeracion.js:3-6`).
- Al aparecer las RE (importes negativos) alguien añadió `AND serie = 'FA'` a la suma
  (P-3) para que no restase, pero no al recuento (P-2): un arreglo parcial. No hay
  comentario; hipótesis.
- El botón de cobro se limitó a `serie === 'FA'` en la vista (P-5), pero no en el
  endpoint (P-6).

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: rareza / dato visible)**: «El panel cuenta 4 facturas
pendientes (incluye la rectificativa) pero suma el importe de 3; “emitidas” significa 9 en
el panel y 4 en el listado».

**Preguntas al negocio**:
- QC-18. ¿Una factura rectificativa debe contarse como «pendiente de cobro»? ¿Y su
  importe negativo debe restarse del importe pendiente?
- QC-19. ¿“Facturas emitidas (total histórico)” debe incluir las rectificativas y las
  rectificadas?
