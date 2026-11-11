# Contradicción 09 — Qué factura se puede cobrar o rectificar: pantalla frente a servidor

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código y **BD** (`sqlite3 -readonly`). Los efectos de los
endpoints son **deducción del código** (no se han ejecutado: escriben en la BD).

**Estado: divergencia ACTIVA** para quien llame a los endpoints sin la pantalla (el
sistema no tiene autenticación, `server.js:16-42`); invisible en el uso normal.

## 1. Implementaciones y qué camino usa cada una

| Regla | Dónde | Condición |
|---|---|---|
| **E-1** Mostrar botones «Marcar cobrada» y «Rectificar» | `views/factura_detalle.ejs:47` | `estado === 'emitida' && serie === 'FA'` (ambos botones comparten condición) |
| **E-2** `POST /facturas/:id/cobrar` | `routes/facturas.js:118` | `UPDATE … WHERE id = ? AND estado = 'emitida'` (**cualquier serie**; si no cumple, no hace nada y redirige igual) |
| **E-3** `POST /facturas/:id/rectificar` | `routes/facturas.js:132-133`, `:154` | Rechaza `estado === 'rectificada'` y `serie === 'RE'`; **acepta `emitida` y `cobrada`**; la marca final es `UPDATE … WHERE id = ?` sin condición de estado |

## 2. ¿Mismo criterio? Paso a paso

Matriz estado × serie (qué ocurre con cada acción):

| Factura | Botones en pantalla (E-1) | `/cobrar` (E-2) | `/rectificar` (E-3) |
|---|---|---|---|
| FA `emitida` | Ambos | Pasa a `cobrada` | Crea RE; original → `rectificada` |
| FA `cobrada` | **Ninguno** | Nada (redirige) | **Crea RE; original `cobrada` → `rectificada`** |
| FA `rectificada` | Ninguno | Nada | Error 400 «Ya está rectificada» |
| RE `emitida` | **Ninguno** | **Pasa a `cobrada`** | Error 400 «No se rectifica una rectificativa» |
| RE `cobrada` (si existiera) | Ninguno | Nada | Error 400 |

Las diferencias: E-3 acepta facturas `cobradas`; E-2 acepta rectificativas; E-1 no
ofrece ninguna de las dos cosas.

## 3. Ejemplos con resultados distintos para la misma entrada

**BD**: 9 facturas (4 `cobrada` FA, 3 `emitida` FA, 1 `emitida` RE, 1 `rectificada` FA).

| Pregunta | Pantalla (E-1) | Servidor |
|---|---|---|
| ¿A cuántas facturas se puede **rectificar**? | **3** (`FA-2026-000105`, `-107`, `-108`) | **7**: las 3 anteriores + las 4 `cobrada` (`-101` a `-104`) (E-3) |
| ¿A cuántas facturas se puede **cobrar** con efecto? | **3** (las mismas) | **4**: las 3 FA + `RE-2026-000001` (E-2) |

Ejemplo concreto (deducción): `POST /facturas/1/rectificar` sobre `FA-2026-000101`
(`cobrada`, 161,17 €) crearía `RE-2026-000002` (−161,17 €) y dejaría la original en
`rectificada`, aunque ya estaba cobrada. La pantalla no lo ofrece.

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden** en toda factura `emitida` de serie `FA` (el camino normal).
- **Divergen** en facturas `cobrada` (rectificar) y en rectificativas (cobrar), solo vía
  petición directa (formulario de otra pantalla, marcador, script o petición manual).
  El sistema es de red interna y sin autenticación; el comentario de `AGENTS.md` lo
  asume.
- **Por qué no se ha visto**: la oficina usa la pantalla, que solo ofrece lo coherente.
  La BD no contiene ninguna rectificativa en estado `cobrada`; sí contiene 4 facturas
  `cobrada` (`-101` a `-104`) que **no** están rectificadas, y la única `rectificada`
  (`FA-2026-000106`) no permite saber si estaba emitida o cobrada antes (no se guarda el
  historial de estados).

## 5. Historia probable (SUPOSICIÓN)

- El botón se fijó para `FA` emitida por regla de uso (Puri: la rectificativa es espejo de
  una factura; el comentario de `facturas.js:124-128`).
- Los controles del servidor se añadieron al lado del código de cada endpoint sin copiar
  la condición de la vista (`factura_detalle.ejs:47`): `rectificar` solo prohíbe lo que
  alguien vio como error evidente («ya rectificada», «rectificar una RE»). No hay un
  único punto donde se defina «rectificable» o «cobrable».

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: validación)**: «Las reglas de cobro y rectificación
están escritas dos veces con criterios distintos (vista y endpoint). Por petición
directa se puede rectificar una factura cobrada (7 de 9 en la BD frente a 3 por pantalla)
y cobrar una rectificativa».

**Preguntas al negocio**:
- QC-22. ¿Se puede rectificar una factura ya cobrada? Si es así, ¿cómo se devuelve el
  dinero y debe quedar constancia del cobro?
- QC-23. ¿Una factura rectificativa se cobra/paga alguna vez? ¿Qué estado debe tener?
