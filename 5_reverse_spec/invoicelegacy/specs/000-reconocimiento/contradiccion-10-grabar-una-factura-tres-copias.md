# Contradicción 10 — «Grabar una factura»: tres copias con tratamientos distintos

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código, **BD** (`sqlite3 -readonly`) y **Entorno** (funciones
puras). Los caminos de escritura no se han ejecutado (escriben en la BD).

**Estado: divergencia ACTIVA** en trazabilidad y en manejo de errores; el importe
calculado coincide en A y B porque comparten `calcularFactura`.

## 1. Implementaciones y qué camino usa cada una

| | **A — Alta manual** | **B — Remesa mensual** | **C — Rectificativa** |
|---|---|---|---|
| `INSERT INTO facturas` | `routes/facturas.js:74-76` | `scripts/remesa_mensual.js:61-62` | `routes/facturas.js:141-143` |
| `INSERT INTO lineas` | `facturas.js:85-98` (todas las líneas, en paralelo) | `remesa_mensual.js:66-68` (una línea) | `facturas.js:148-159` (todas, en paralelo) |
| Importes | `calcularFactura` | `calcularFactura` | Negación de lo grabado, sin recalcular (`:127-128`) |
| Numeración | `siguienteNumero('FA')` | `siguienteNumero('FA')` | `siguienteNumero('RE')` |
| Columna `rectifica_a` | No | No | Sí |

## 2. ¿Mismo algoritmo? Paso a paso

| Aspecto | A | B | C |
|---|---|---|---|
| Orden | Número → cabecera → líneas (en paralelo) | Número → cabecera → línea (secuencial) | Número → cabecera RE → líneas (paralelo) → marca de la original |
| Error al grabar cabecera | 500, mensaje (`:78`) | `console.error` + **`process.exit(1)`** (`:64`) | 500, mensaje (`:145`) |
| Error al grabar línea | Se registra y, al terminar, 500 (`:89,92`) | `exit(1)` (`:70`) | **Se ignora** (`function () {…}` sin `err`, `:151`) |
| Error al marcar la original | — | — | **Se ignora** (`:154`, callback sin `err`) |
| Factura sin líneas | No se puede (`:64`) | No aplica | **Sin respuesta ni marca** (`forEach` vacío, `:147-159`) |
| Texto de observaciones | `obs` + « Descuento volumen N% aplicado» si hay descuento (`:76`) | `'Remesa ' + mes` siempre (`:62`), **sin mención al descuento** | `'Rectifica N. ' + motivo` |
| Aviso por correo | `email.enviarFactura` (no-op) (`:93`) | No | No |
| Vencimiento | `fecha` + plazo del cliente o config | `fecha` (último día) + plazo del cliente o 30 | `null` |
| Fecha | Libre o hoy | Último día del mes facturado | Hoy |

## 3. Ejemplos con resultados distintos para la misma entrada

**3.1 Mismo cálculo, distinta constancia del descuento** (**Entorno**: cuota de 1.500 €
al 21 %, cliente sin recargo; en la BD **no hay** ninguna cuota > 1.000 € (máxima: 145 €),
caso hipotético):

| Camino | Línea grabada | Observaciones |
|---|---|---|
| A (una línea de 1 × 1.500 €) | precio **1.470,00**, base 1.470,00, IVA 308,70, total 1.778,70 | « Descuento volumen 2% aplicado» |
| B (contrato de 1.500 €/mes) | precio **1.470,00**, base 1.470,00, IVA 308,70, total 1.778,70 | `Remesa <mes> <año>` (**sin** mención) |

Mismos importes; solo A explica por qué el precio unitario no es 1.500.

**3.2 Líneas que la remesa no graba (BD)**: la remesa graba **una** línea
(`remesa_mensual.js:66`), pero `FA-2026-000101` («Remesa enero») tiene 4 y `FA-2026-000108`
(«Remesa mayo») 3. Las líneas adicionales (café, azúcar, vasos…) no vienen de B. Las
facturas `FA-2026-000106` («Remesa abril», 2 líneas), su sustituta `FA-2026-000107` y `RE-2026-000001` (2 líneas
espejo) están en el mismo caso.

**3.3 Estado final tras un fallo parcial (deducción)**:

| Fallo | A | B | C |
|---|---|---|---|
| Falla el `INSERT` de una línea | Cabecera grabada, líneas incompletas, respuesta 500 | Cabecera y contratos anteriores grabados; el proceso termina | RE y líneas hasta el fallo grabadas, **sin aviso**; original puede quedar sin marcar |
| Número ya consumido | Sí | Sí | Sí |

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden**: en el importe de A y B (misma función) y en el flujo feliz.
- **Divergen**: ante errores (A avisa; B aborta; C calla) y en el texto de
  observaciones del descuento.
- **Por qué no se ha visto**: el flujo feliz funciona en los tres; el comentario
  «si falla una a mitad ya se apañó en su día a mano en la bd, no ha vuelto a pasar»
  (`facturas.js:81-82`) indica que se detectó un fallo en A y se resolvió a mano. No se
  conserva rastro de si pasó en B o C.

## 5. Historia probable (SUPOSICIÓN)

- A es el original (2017-2018). El comentario sobre el apaño manual muestra que se
  conoce el riesgo sin transacción.
- C se escribió más tarde (tras la inspección de 2020) copiando la estructura de A
  (`forEach` + contador `pendientes`, cf. `facturas.js:83-98` y `:147-159`) y quitando el
  control de errores.
- B (2021) reescribe la secuencia en versión secuencial y recursiva
  (`procesarSiguiente`), con su propia gestión de errores («parar todo»), porque se
  ejecuta fuera de Express y no puede responder con `res.status(500)`.
- La ausencia de «Descuento volumen» en B sugiere que la copia no incluyó la línea
  `facturas.js:76`.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: deuda / riesgo de integridad)**: «La grabación de
cabecera y líneas está copiada tres veces (alta, remesa, rectificativa) con tres
estrategias de error; solo el alta deja constancia textual del descuento».

**Preguntas al negocio**:
- QC-24. ¿Ha fallado alguna vez una remesa a mitad? ¿Cómo se supo qué contratos se
  habían facturado ya?
- QC-25. ¿Quién añadió las líneas extra a `FA-2026-000101` y `FA-2026-000108`, que no
  salen de la remesa?
- QC-26. ¿Debe constar el descuento por volumen en las observaciones de las facturas de
  remesa?
