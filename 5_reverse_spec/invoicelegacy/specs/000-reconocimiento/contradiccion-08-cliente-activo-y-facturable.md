# Contradicción 08 — «Cliente (o artículo) activo»: se filtra en la pantalla y no en el servidor

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código y **BD** (`sqlite3 -readonly`). Los efectos de las
rutas y de la remesa son **deducción del código** (no se han ejecutado: escriben en la
BD).

**Estado: divergencia LATENTE** (hoy no hay ningún cliente ni artículo dado de baja).

## 1. Implementaciones y qué camino usa cada una

| Camino | Qué hace con `activo` | Evidencia |
|---|---|---|
| Formulario de nueva factura (GET) | Solo lista clientes y artículos con `activo = 1` | `routes/facturas.js:31`, `:33` |
| Grabar factura (POST) | Lee el cliente **sin** mirar `activo` | `routes/facturas.js:46-47` |
| Remesa mensual | Une contratos con clientes **sin** filtrar `activo` | `scripts/remesa_mensual.js:26-29` |
| Baja de cliente | `UPDATE clientes SET activo = 0`; no toca sus contratos ni sus facturas | `routes/clientes.js:32-37` |
| Baja de artículo | `UPDATE articulos SET activo = 0` | `routes/articulos.js:26-31` |
| Panel de inicio | Cuenta solo `activo = 1` («Clientes activos») | `server.js:25` |
| Listado de clientes y artículos | Muestra todos, los de baja con otra clase CSS | `views/clientes.ejs:7`, `views/articulos.ejs:6` |
| Contratos | No tienen estado de cliente: solo `fecha_baja` propia | `db.js:40-48` |

## 2. ¿Mismo criterio? Paso a paso

El concepto «a este cliente se le puede facturar» tiene tres respuestas:

| Pregunta | Pantalla de alta de factura | Servidor (alta manual) | Remesa |
|---|---|---|---|
| ¿Aparece en el desplegable? | Solo si `activo = 1` | — | — |
| ¿Se acepta si llega su `cliente_id`? | — | **Sí**, aunque `activo = 0` | Se factura **siempre** que tenga contrato vigente |
| ¿Se comprueba que el contrato siga vigente por la baja del cliente? | — | — | **No**: la baja del cliente no cierra sus contratos |

La misma regla aplica a artículos: el desplegable solo ofrece los activos
(`facturas.js:33`), pero el servidor ni siquiera usa `articulos` al grabar (las líneas
se teclean y no se enlazan con el catálogo, `facturas.js:55-63`).

## 3. Ejemplos con resultados distintos para la misma entrada

(**Deducción**; nada se ha ejecutado.) Sea el cliente 1 «Cafetería La Parada» (**BD**,
`activo = 1`, contrato 1: 90,00 € al 21 %, vigente), al que se da de baja con
`POST /clientes/1/baja`:

| Camino | Resultado |
|---|---|
| Pantalla «Nueva factura» | El cliente **desaparece** del desplegable |
| `POST /facturas/nueva` con `cliente_id=1` | Se emite la factura y se consume un número |
| Remesa del mes siguiente | Se emite una factura de **108,90 €** (90 + 18,90 de IVA) a un cliente de baja; no hay aviso |

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden**: mientras nadie se dé de baja. **BD**: 6 clientes, todos `activo = 1`;
  8 artículos, todos `activo = 1`. Nunca se ha usado la baja en los datos presentes.
- **Divergen**: en cuanto un cliente con contrato vigente se dé de baja (la remesa
  seguiría facturándole) o se envíe la petición sin pasar por la pantalla.
- **Por qué no se ha visto**: no hay bajas en los datos y, con interfaz normal,
  nadie ve al cliente dado de baja para facturarle manualmente.

## 5. Historia probable (SUPOSICIÓN)

- La baja lógica (`activo`) viene del esquema original (`db.js:27-38`) y se aplica a la
  pantalla de factura por comodidad de uso.
- El servidor de `POST /facturas/nueva` valida solo «existe» (`facturas.js:47`),
  coherente con el estilo del proyecto («la validación fuerte la hace Marga mirándolo»,
  `clientes.js:16`).
- La remesa (2021) se escribió con su propia consulta de contratos y no con la lógica de
  la pantalla; no se pensó en la baja del cliente.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: validación / rareza)**: «`activo` solo se aplica al
desplegable. El alta manual y la remesa facturan a clientes de baja (la remesa, además,
mientras el contrato siga vigente)».

**Preguntas al negocio**:
- QC-20. Cuando un cliente se da de baja, ¿sus contratos deben cerrarse y dejar de
  facturarse automáticamente?
- QC-21. ¿Debe poder facturarse a mano a un cliente dado de baja (p. ej. para cobrar un
  resto pendiente)?
