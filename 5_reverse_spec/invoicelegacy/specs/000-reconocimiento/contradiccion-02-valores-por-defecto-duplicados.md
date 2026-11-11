# Contradicción 02 — Valores por defecto escritos varias veces (plazo de pago e IVA)

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código (`fichero:líneas`), **BD** (`sqlite3 -readonly`) y
**Entorno** (funciones puras en memoria).

**Estado: divergencia LATENTE.** Hoy todas las copias valen lo mismo; divergirían en
cuanto se cambie una sola.

## 1. Implementaciones y qué camino usa cada una

### 1.1 Plazo de pago por defecto (30 días)

| Copia | Fichero y líneas | Camino que la usa |
|---|---|---|
| Constante `VENCIMIENTO_DIAS: 30` («días de vencimiento por defecto si el cliente no tiene forma de pago») | `config.js:39-40` | Alta manual: `cliente.dias_pago \|\| config.VENCIMIENTO_DIAS` (`routes/facturas.js:68`) |
| Literal `30` | `scripts/remesa_mensual.js:60`: `co.dias_pago \|\| 30` | Remesa mensual |
| Sin plazo (`null`) | `routes/facturas.js:142` | Rectificativa: no calcula vencimiento |

### 1.2 IVA por defecto (21 %)

| Copia | Fichero y líneas | Camino que la usa |
|---|---|---|
| `IVA_DEFECTO: 21` | `config.js:24-25` | Alta de artículo si no se indica tipo: `routes/articulos.js:16` |
| Literal `21` | `routes/contratos.js:20`: `parseInt(req.body.tipo_iva \|\| 21, 10)` | Alta de contrato |
| `DEFAULT 21` en la columna | `db.js:46` | Contrato insertado sin tipo (aunque el `INSERT` de `contratos.js:17` siempre lo informa) |
| Lista de tipos ofrecida `21/10/4` | `views/factura_nueva.ejs:18`, `views/articulos.ejs:18`; comentario `db.js:36` | Formularios de factura y artículo |
| Tabla de recargos por tipo (7 tipos) | `services/calculo.js:12-23` | Cálculo de factura (alta manual y remesa) |

## 2. ¿Misma convención o algoritmo? Paso a paso

**Plazo.** Ambas copias usan el mismo operador `||` sobre `dias_pago`, luego
`util.sumarDias(fecha, dias)` (`facturas.js:68-69`, `remesa_mensual.js:60`).

| Paso | Alta manual | Remesa | ¿Igual? |
|---|---|---|---|
| Origen del plazo del cliente | `cliente.dias_pago` (`SELECT * FROM clientes`) | `co.dias_pago` (JOIN, `remesa_mensual.js:26`) | Sí |
| Valor por defecto | `config.VENCIMIENTO_DIAS` | `30` literal | **Mismo valor hoy, distinta fuente** |
| Tratamiento de 0, vacío, `NaN` | Todos caen al defecto (`\|\|`) | Igual | Sí |
| Tratamiento de negativos | Se aplican (vencimiento anterior a la fecha) | Igual | Sí |
| Fecha base | `fecha` libre del formulario o hoy | Último día del mes facturado | No (ver RN-23) |

La remesa **ni siquiera importa `config`**: sus `require` son `db`, `util`, `calculo` y
`numeracion` (`remesa_mensual.js:9-12`).

**IVA.** `articulos.js` lee la constante de `config`; `contratos.js` repite el literal; la
columna `DEFAULT 21` lo repite en SQL. El formulario de contratos ni siquiera existe
en pantalla (`mapa-sistema.md` F5), así que el literal de `contratos.js:20` solo se
ejercita por llamadas directas al endpoint.

## 3. Ejemplo con resultados distintos para la misma entrada

Cambiando únicamente `config.VENCIMIENTO_DIAS` de 30 a 45 (hipótesis; **no se ha
modificado nada**, se calcula con `sumarDias` en memoria y `TZ=Europe/Madrid`):

| Entrada | Alta manual | Remesa | Diferencia |
|---|---|---|---|
| Cliente sin `dias_pago`, fecha 2026-05-31 | vence **2026-07-15** (+45) | vence **2026-06-30** (+30) | **15 días** |

Con el valor actual (30) ambos dan 2026-06-30. Ejemplo real (**BD**): `FA-2026-000108`
(remesa de mayo, cliente 1 sin plazo): fecha 2026-05-31, vencimiento 2026-06-30.

Ejemplo análogo para el IVA: si se cambiara `IVA_DEFECTO` a otro tipo, un artículo nuevo
sin tipo recibiría el nuevo valor y un contrato nuevo sin tipo seguiría recibiendo 21.

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden hoy**: siempre, porque `VENCIMIENTO_DIAS = 30` y el literal es 30; y
  `IVA_DEFECTO = 21` coincide con los literales 21.
- **Divergirían**: al cambiar la constante de `config.js`. La Constitución congela el
  comportamiento; el propio `config.js` avisa de que se copia a mano al servidor
  (`config.js:2-3`), lo que favorece que una edición nunca llegue a todas partes.
- **Por qué no se ha visto**: nadie ha cambiado nunca el valor (no hay indicio de lo
  contrario) y todos los vencimientos reales de la BD (8 facturas con vencimiento)
  encajan con 30 o 60 días (**BD**).

## 5. Historia probable (SUPOSICIÓN)

`config.js` agrupa los parámetros que «el negocio no quiere tocar»; cuando Julián escribió
el alta manual (2017) usó la constante. En 2021 Roberto copió la lógica del alta manual en
un script independiente; como el script se pensó para ejecutarse desde la línea de
comandos sin cargar la aplicación, escribió el `30` directamente (no hay indicio de que
conociera la constante). El mismo patrón aparece en `contratos.js` (el literal `21`,
escrito seguramente al añadir contratos). Estilo ES5 común, sin comentario que justifique
el literal.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: deuda / divergencia latente)**: «El plazo de pago por
defecto está en `config.VENCIMIENTO_DIAS` (alta manual) y como literal 30 (remesa); el IVA
por defecto está en `config.IVA_DEFECTO`, en un literal 21 (contratos) y en el `DEFAULT 21`
de la tabla».

**Preguntas al negocio**:
- QC-05. ¿El plazo por defecto de 30 días es una regla de negocio fija o un parámetro que
  puede cambiar? Si cambiara, ¿debería aplicarse también a la remesa?
- QC-06. ¿Se ha cambiado alguna vez `config.js` en el servidor de la oficina? ¿Hay dos
  copias con valores distintos (la ruta de copia cita dos carpetas distintas,
  `memoria-historica.md` H-26)?
