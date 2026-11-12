# Mapa del sistema GesFact

Reconocimiento de la fase «documentar y proteger». Documento de solo lectura: no se
ha modificado código, datos ni dependencias (Constitución, Principios I, III y IV).

## 0. Alcance, método y convenciones

- **Alcance**: todo el producto GesFact (`server.js`, `config.js`, `db.js`, `routes/`,
  `services/`, `lib/`, `scripts/`, `views/`, `public/`, `datos/`, `package.json`,
  `LEEME.txt`). Quedan fuera `.specify/` y `.kiro/` (andamiaje de Spec Kit/Kiro, no
  producto; `AGENTS.md:52-53`), salvo mención en «Zonas oscuras».
- **Método**: lectura íntegra de todos los ficheros fuente con numeración de líneas;
  búsquedas por `require(` y por uso de cada función exportada; `npm ls` y
  `node_modules/*/package.json` para las versiones instaladas; consultas SQL de solo
  lectura (`sqlite3 -readonly`) sobre `datos/gesfact.db`.
- **Evidencia** (Principio II): `fichero:líneas` para código; «**BD**» para consultas
  sobre `datos/gesfact.db`; «**Entorno**» para la salida de un comando ejecutado aquí.
  No se ha usado ningún testimonio del negocio nuevo; los citados son comentarios del
  propio código (p. ej. «Puri, gestoría», `services/calculo.js:3-7`).
- **SUPOSICIÓN**: lo no verificable se marca así y se recoge en «Preguntas abiertas»
  (sección 6).
- **Criticidad** (alta/media/baja): es una **estimación** mía a partir de lo que el
  código hace con el dinero, lo legal y lo que consume la gestoría; no es una
  declaración del negocio. Cada una lleva su justificación.

## 1. Visión de conjunto

GesFact es una aplicación web interna (Node.js + Express + EJS + SQLite) con **dos
puntos de entrada** que comparten cálculo, numeración y base de datos:

1. **Servidor web**: `node server.js` (`package.json:6-8`, `server.js:44-54`).
2. **Remesa mensual por línea de comandos**: `node scripts/remesa_mensual.js AAAA-MM`
   (`scripts/remesa_mensual.js:3`, `views/index.ejs:9-10`).

Entidades de negocio en la BD: clientes, artículos, contratos, facturas, líneas y
contadores de numeración (`db.js:19-81`).

---

## 2. Mapa por módulo

Formato de cada ficha: **(1)** responsabilidad de negocio · **(2)** depende de / lo
usan · **(3)** criticidad.

### 2.1 Arranque y configuración

#### `server.js` — Pone en marcha la aplicación y muestra el panel de inicio con las cifras de facturación
- **Qué hace**: monta las pantallas (`server.js:38-42`), calcula el panel de inicio
  (total de facturas, pendientes, importe pendiente, clientes activos; `server.js:20-36`)
  y no arranca si la base de datos no se inicializa (`server.js:44-48`).
- **Depende de**: `db.js` (`server.js:11`), `config.js` (`server.js:12`), las cinco rutas
  `routes/{clientes,articulos,contratos,facturas,informes}` (`server.js:38-42`),
  `views/index.ejs` (`server.js:26`), `express` y `body-parser` (`server.js:9-10`).
- **Lo usan**: nadie lo importa; es punto de entrada (`package.json:5`).
- **Criticidad: media.** Sin él no hay aplicación web, pero no calcula importes ni
  numera; un fallo de arranque es visible al instante (`server.js:45-47`). El panel
  contiene sus propias consultas SQL de importes (`server.js:24`), de ahí que no sea baja.

#### `config.js` — Guarda los datos de la empresa que salen en las facturas y los parámetros que el negocio no quiere tocar
- **Qué contiene**: datos de la empresa (`config.js:8-17`), ruta de la BD (`:20`), puerto
  (`:22`), IVA por defecto (`:25`), SMTP (`:29-34`), clave del fichero de la gestoría
  (`:37`), días de vencimiento por defecto (`:40`).
- **Depende de**: nada.
- **Lo usan**: `db.js:9,11-15` (ruta BD), `server.js:12,49,52` (puerto),
  `routes/facturas.js:68,111` (vencimiento, datos de empresa),
  `routes/informes.js:40` (clave), `routes/articulos.js:16` (IVA por defecto),
  `services/email.js:14-20` (solo dentro de código comentado; ver 2.5).
  `scripts/remesa_mensual.js` **no** lo importa directamente (solo vía `db.js`).
- **Criticidad: alta.** Los datos de empresa se imprimen en cada factura legal
  (`views/factura_detalle.ejs:5-8,43`); la clave la exige la gestoría (`config.js:36`);
  el propio fichero avisa de que se copia a mano al servidor y «NO RENOMBRAR»
  (`config.js:2-3`). Contiene secretos en claro (`config.js:33,37`).

#### `package.json` / `package-lock.json` — Fijan con qué librerías funciona el programa
- **Depende de / lo usan**: declaran 4 dependencias (`package.json:11-16`); lo usan
  `npm install` y `npm start` (`package.json:6-8`).
- **Criticidad: media.** Congeladas por la Constitución (Principio IV) y de ellas
  depende que el programa arranque, pero no contienen lógica de negocio. Detalle en 3(b).

### 2.2 Datos

#### `db.js` — Guarda y recupera todos los datos del negocio (clientes, artículos, contratos, facturas, numeración) y carga datos de ejemplo si la base está vacía
- **Qué hace**: abre la BD SQLite (`db.js:15`), crea las 6 tablas si no existen
  (`db.js:19-81`) y, **solo si no hay clientes**, inserta clientes, artículos, contratos,
  9 facturas y los contadores (`db.js:83-87`, `93-181`). Crea la carpeta `datos/` si
  falta (`db.js:11-13`).
- **Depende de**: `config.js` (`db.js:9`), `fs`, `path`, `sqlite3` (`db.js:6-8`).
- **Lo usan**: `server.js:11`, `lib/numeracion.js:12`, `routes/{facturas,informes,clientes,articulos,contratos}.js`
  (todas `require('../db')`), `scripts/remesa_mensual.js:9`.
- **Criticidad: alta.** Es la única fuente de verdad de las facturas, que «no se borran
  nunca» (`lib/numeracion.js:3-6`); su fichero se respalda a mano los viernes
  (`LEEME.txt:18`). Un cambio de esquema afecta a todos los módulos.

#### `datos/gesfact.db` — Es la base de datos con las facturas y clientes de la empresa
- **Estado observado** (**BD**): 6 clientes, 8 artículos, 4 contratos, 9 facturas,
  28 líneas; contadores `FA/2026 = 108` y `RE/2026 = 1`; sin índices (salvo el de la
  clave primaria de `contadores`), sin vistas ni triggers.
- **Depende de / lo usan**: lo abre `db.js:15` vía `config.js:20`.
- **Criticidad: alta** en cuanto contenga datos reales (ver pregunta P1: el contenido
  actual coincide **exactamente** con los datos semilla de `db.js:93-181`, así que
  puede ser una copia de pruebas, no producción).

#### `datos/migracion_mysql_2018.sql` — Esbozo abandonado de un traslado de los datos a MySQL
- **Evidencia**: «NUNCA SE LLEGÓ A EJECUTAR EN PRODUCCIÓN. El esquema está desfasado»
  (`datos/migracion_mysql_2018.sql:2-3`); solo define 2 tablas (`:4-5`).
- **Depende de / lo usan**: nada lo importa (ver búsqueda en 5.3); solo lo cita
  `LEEME.txt:12-13` y `config.js:19`.
- **Criticidad: baja.** No participa en la ejecución; solo interesa como historia.

### 2.3 Utilidades y reglas de negocio centrales

#### `services/calculo.js` — Calcula los importes de las facturas: base, IVA, recargo de equivalencia, descuento por volumen y prorrateo de cuotas
- **Reglas (observadas)**: redondeo línea a línea (`:26-34`, aviso `:1-7`); recargo por
  tipo de IVA (`:12-23`); descuento 2 % si la base supera 1.000 € y 5 % si supera 5.000 €,
  con `>` estricto (`:39-43`) y aplicado al precio de cada línea (`:63-71`); prorrateo
  «a lo comercial» de 30 días (`:90-102`).
- **Depende de**: `lib/util.js` (solo `redondear2`; `:9`, usos `:27,28,31,57,69,81-83,86,101`).
- **Lo usan**: `routes/facturas.js:66` (`calcularFactura`),
  `routes/contratos.js:39` (`calcularProrrateo`),
  `scripts/remesa_mensual.js:55` (`calcularFactura`). No lo usa ninguna vista.
  `recargoPara`, `calcularLinea` y `porcentajeDescuento` se exportan (`:105-107`) pero
  solo se llaman dentro del propio fichero (`:31,56,60,71`).
- **Criticidad: alta.** Determina el importe de cada factura que la gestoría cuadra
  «línea a línea» (`:3-4`); un cambio de redondeo ya provocó que la gestoría devolviera
  un trimestre entero (`:5-6`; Constitución, Principio I).

#### `lib/numeracion.js` — Asigna el número correlativo legal a cada factura (serie, año y secuencia)
- **Qué hace**: lee el último número de la serie y año **del sistema**
  (`:15-16`), abre el contador si es año nuevo (`:18-23`), lo incrementa (`:30-36`) y
  devuelve el formato `SERIE-AAAA-000000` (`:38-42`).
- **Depende de**: `db.js` (`:12`).
- **Lo usan**: `routes/facturas.js:71` (serie FA) y `:138` (serie RE);
  `scripts/remesa_mensual.js:57` (serie FA). `formatear` se exporta (`:46`) pero solo se
  usa dentro (`:34`).
- **Criticidad: alta.** La numeración correlativa y sin huecos es un requisito legal
  (`:3-6`) y ya hubo un duplicado en enero de 2021 (`:8-10`).

#### `lib/util.js` — Reúne los pequeños servicios que todos usan: redondeo de euros, fechas, formato español de importes y comprobación del NIF
- **Funciones y consumidores**:

  | Función | Líneas | Quién la usa |
  |---|---|---|
  | `redondear2` | `:5-7` | `services/calculo.js` (10 usos), `scripts/remesa_mensual.js:51` |
  | `hoy` | `:10-15` | `routes/contratos.js:21,32`, `routes/facturas.js:44,142` |
  | `sumarDias` | `:20-26` | `routes/facturas.js:69`, `scripts/remesa_mensual.js:60` |
  | `fechaBonita` | `:29-33` | `routes/informes.js:43`, vistas `contratos`, `factura_detalle`, `facturas` |
  | `diasDelMes` | `:36-39` | `scripts/remesa_mensual.js:21,47` |
  | `validarNIF` | `:44-48` | `routes/clientes.js:18` |
  | `formatearImporte` | `:51-58` | `routes/informes.js:44-45`, vistas `factura_detalle`, `facturas`, `informe_iva` |

- **Depende de**: nada (sin `require`).
- **Lo usan**: `services/calculo.js:9`, `routes/{clientes,contratos,facturas,informes}.js`,
  `scripts/remesa_mensual.js:10`; las vistas lo reciben inyectado desde
  `res.render` (`routes/facturas.js:25,111`, `routes/contratos.js:12`,
  `routes/informes.js:28`).
- **Criticidad: alta.** `redondear2` es la base de todos los importes y `sumarDias`
  fija los vencimientos; el propio fichero avisa de que parte viene del GesFact 1.x
  (`:2`). Las demás funciones (formato, NIF) son de criticidad media-baja, pero
  comparten fichero.

### 2.4 Pantallas y operaciones (rutas HTTP)

#### `routes/facturas.js` — Permite emitir, consultar, cobrar y rectificar facturas
- **Operaciones**: listar con filtro por estado (`:15-27`); formulario de alta
  (`:30-38`); emitir factura calculando importes, vencimiento, número y líneas
  (`:42-102`); ver/imprimir (`:105-114`); marcar cobrada (`:117-122`); rectificar
  entera con abono en serie `RE` (`:129-164`).
- **Depende de**: `db`, `lib/util`, `services/calculo`, `lib/numeracion`,
  `services/email`, `config` (`:7-12`); vistas `facturas`, `factura_nueva`,
  `factura_detalle`.
- **Lo usan**: `server.js:41`.
- **Criticidad: alta.** Es el camino por el que se crea dinero facturado y se corrige;
  graba cabecera y líneas sin transacción (`:74-98`).

#### `routes/informes.js` — Entrega a la gestoría el resumen trimestral de IVA y el CSV anual de facturas
- **Operaciones**: menú (`:9-11`); resumen de IVA por trimestre sumando líneas
  (`:14-30`); exportación CSV con la clave de la gestoría en la primera línea, `;` como
  separador e importes con coma (`:34-51`).
- **Depende de**: `db`, `lib/util`, `config` (`:5-7`); vistas `informes`, `informe_iva`.
- **Lo usan**: `server.js:42`.
- **Criticidad: alta.** Es lo que la gestoría consume para el modelo 303 y su
  contabilidad (`:13`, `:32-33`; `views/informe_iva.ejs:16`).

#### `routes/contratos.js` — Gestiona las cuotas mensuales fijas (alquileres y mantenimientos) y calcula el prorrateo al darlas de baja
- **Operaciones**: listar (`:9-14`); crear (`:16-26`); dar de baja con fecha y calcular
  el prorrateo del último mes (`:31-43`).
- **Depende de**: `db`, `lib/util`, `services/calculo` (`:5-7`); vista `contratos`.
- **Lo usan**: `server.js:40`. Sus datos los consume `scripts/remesa_mensual.js:26-29`.
- **Criticidad: media.** Define qué cuotas se facturarán cada mes (alimenta la remesa),
  pero no genera facturas por sí misma; el prorrateo de baja se emite «a mano»
  (`:28-30`).

#### `routes/clientes.js` — Mantiene la lista de clientes y marca los que dejan de serlo
- **Operaciones**: listar (`:8-13`); alta con validación de NIF (`:15-30`); baja lógica
  (`:32-37`).
- **Depende de**: `db`, `lib/util` (`:5-6`); vista `clientes`.
- **Lo usan**: `server.js:38`.
- **Criticidad: media.** El campo `recargo_equivalencia` cambia los importes de las
  facturas (`services/calculo.js:49`) y el NIF aparece en facturas y CSV
  (`views/factura_detalle.ejs:18`, `routes/informes.js:43`); pero se puede corregir
  sin tocar facturas ya emitidas.

#### `routes/articulos.js` — Mantiene el catálogo de artículos y servicios con su precio e IVA
- **Operaciones**: listar (`:8-13`); alta (`:15-24`); baja lógica (`:26-31`).
- **Depende de**: `db`, `config` (`:5-6`); vista `articulos`.
- **Lo usan**: `server.js:39`. Sus datos alimentan el desplegable de la factura nueva
  (`routes/facturas.js:33`, `views/factura_nueva.ejs:22-24`).
- **Criticidad: baja.** El precio y el IVA se copian al formulario pero son editables
  y es el valor del formulario el que se factura (`routes/facturas.js:57-62`).

#### `services/email.js` — Debería enviar la factura al cliente por correo, pero hoy solo escribe un aviso en consola
- **Evidencia**: «FUERA DE SERVICIO desde 2022» (`:3-6`); el envío real está comentado
  (`:12-25`); lo único que ejecuta es `console.log` y `cb(null)` (`:26-28`).
- **Depende de**: `config` (`:9`, solo usado en el bloque comentado).
- **Lo usan**: `routes/facturas.js:93` (única llamada, en el alta manual de factura).
- **Criticidad: baja.** No hace nada hoy; las facturas se envían a mano desde Outlook
  (`:4-5`). Pasaría a alta si se reactiva (enviaría documentos legales a clientes).

### 2.5 Proceso por lotes

#### `scripts/remesa_mensual.js` — Genera cada mes las facturas de las cuotas de todos los contratos vigentes
- **Qué hace**: recibe `AAAA-MM` (`:14-18`), selecciona contratos vigentes en el mes
  (`:26-29`), prorratea alta/baja con **días reales del mes** (`:43-51`), calcula con
  `calculo.calcularFactura` (`:55`), numera serie FA (`:57`), fecha la factura el último
  día del mes (`:59`) y graba cabecera y línea (`:61-68`).
- **Depende de**: `db`, `lib/util`, `services/calculo`, `lib/numeracion` (`:9-12`).
- **Lo usan**: nadie lo importa; lo lanza una persona el día 1 desde el ordenador de
  Marga (`:7`, `views/index.ejs:9-10`).
- **Criticidad: alta.** Emite facturas reales en bloque; al ser un camino de cálculo
  distinto del interactivo (prorrateo por días reales frente a los 30 días de
  `services/calculo.js:95-102`) puede producir importes diferentes.

### 2.6 Presentación

#### `views/*.ejs` — Son las pantallas y el documento de factura que ve y imprime la oficina
Todas se usan; ninguna está huérfana.

| Vista | La renderiza | Criticidad |
|---|---|---|
| `factura_detalle.ejs` | `routes/facturas.js:111` | **Alta**: es la factura legal que se imprime/envía en PDF (`:45-46`; `services/email.js:4-5`) |
| `informe_iva.ejs` | `routes/informes.js:28` | **Media**: la gestoría la revisa antes del 303 (`:16`) |
| `factura_nueva.ejs` | `routes/facturas.js:35` | **Media**: formulario donde se teclean precios e IVA |
| `facturas.ejs` | `routes/facturas.js:25` | Baja: listado |
| `clientes.ejs`, `articulos.ejs`, `contratos.ejs` | `routes/{clientes,articulos,contratos}.js` | Baja |
| `informes.ejs`, `index.ejs` | `routes/informes.js:10`, `server.js:26` | Baja |
| `cabecera.ejs`, `pie.ejs` | `<%- include(...) %>` en todas | Baja |

#### `public/js/factura.js` y `public/css/estilos.css` — Ayudan a rellenar precio e IVA al elegir artículo y dan aspecto a las pantallas
- **Evidencia**: autorrellena precio e IVA desde el desplegable (`js:1-15`, cargado en
  `views/factura_nueva.ejs:28`); el CSS lo cargan todas las pantallas
  (`views/cabecera.ejs:6`) y oculta menús al imprimir (`css:28`). Servidos por
  `server.js:18`.
- **Criticidad: baja.** El JS es una comodidad (el usuario puede teclear el precio) y el
  CSS no afecta a los importes.

---

## 3. Anexos del mapa

### (a) Diagrama de dependencias

`A --> B` significa «A importa/usa a B». Entre paréntesis, la prueba (`require`).

```
 PUNTOS DE ENTRADA
 ┌──────────────┐                                  ┌───────────────────────────┐
 │  server.js   │                                  │ scripts/remesa_mensual.js │
 └──────┬───────┘                                  └──┬───────┬────────┬───────┘
        │ (server.js:11,12,38-42)                     │       │        │ (remesa:9-12)
        │                                             │       │        │
        ├──► routes/clientes.js   ──► db, util        │       │        │
        ├──► routes/articulos.js  ──► db, config      │       │        │
        ├──► routes/contratos.js  ──► db, util, calculo ──────┤        │
        ├──► routes/informes.js   ──► db, util, config│       │        │
        └──► routes/facturas.js   ──► db, util, calculo, numeracion, email, config
                                                      │       │        │
                         ┌────────────────────────────┘       │        │
                         ▼                                    ▼        ▼
                 services/calculo.js ──► lib/util.js     lib/numeracion.js
                                                               │
 services/email.js ──► config  (solo en código comentado)      ▼
                                                              db.js ──► config.js
                                                               │
                                                               ▼
                                                      datos/gesfact.db (SQLite)

 Vistas (views/*.ejs) ◄── res.render desde server.js y routes/*
                          (reciben `util` inyectado: facturas, contratos, informes)
 public/ ◄── express.static('public')  (server.js:18)

 SIN ENLACE ENTRANTE: datos/migracion_mysql_2018.sql, LEEME.txt
```

Fan-in (cuántos módulos de código importan a cada uno): `db.js` 8 · `lib/util.js` 6
· `config.js` 6 · `services/calculo.js` 3 · `lib/numeracion.js` 2 ·
`services/email.js` 1. Conteo hecho sobre los `require` de la salida de
«grep require» (Entorno).

### (b) Tecnologías y versiones reales

Fuente: `package.json`, `package-lock.json`, `node_modules/*/package.json`, `npm ls
--depth=0` y `node -e` (Entorno). **No** se ha usado `LEEME.txt` como fuente.

| Tecnología | Declarada | Instalada / observada | Evidencia |
|---|---|---|---|
| Aplicación GesFact | `2.4.0` | — | `package.json:3`; también `server.js:1,51`, `views/cabecera.ejs:5,10` |
| Express | `^4.22.2` | **4.22.2** | `package.json:14`; `npm ls` |
| body-parser | `^1.20.5` | **1.20.5** | `package.json:12`; `npm ls`; uso `server.js:17` (`urlencoded`, `extended:false`) |
| EJS | `^3.1.10` | **3.1.10** | `package.json:13`; `npm ls`; `server.js:16` |
| sqlite3 (paquete npm) | `^5.1.7` | **5.1.7** | `package.json:15`; `npm ls`; `package-lock.json:853-855` |
| SQLite (motor embebido) | — | **3.44.2** | `require('sqlite3').VERSION` (Entorno); la cabecera de `datos/gesfact.db` indica «SQLite version 3044002» |
| Node.js | **sin declarar** (no hay `engines` en `package.json:1-17`) | v22.23.2 en **este** entorno | `node --version` (Entorno). Cómo se ejecuta en la oficina: ver P2 |
| npm / lockfile | — | `lockfileVersion: 3` | `package-lock.json:4` |
| JavaScript del servidor | ES5 (`var`, *callbacks*, sin promesas) | — | p. ej. `db.js:6-9`, `routes/facturas.js:5-12` |
| JavaScript del navegador | `NodeList.forEach` y `Element.closest` | — | `public/js/factura.js:3,8` (navegadores modernos) |
| Plantillas / estilos | HTML + EJS, CSS plano, sin framework | — | `views/*.ejs`, `public/css/estilos.css` |
| Formatos | CSV `;` con decimales con coma | — | `routes/informes.js:36-49` |
| Pruebas / lint / build | **ninguno** | — | `package.json:6-8` solo `start`; no existen `test/`, `tests/` ni configuración de *linter* (Entorno) |

Notas:
- Los rangos `^` de `package.json` coinciden con las versiones instaladas, pero el
  `package-lock.json` tiene la entrada de `sqlite3` sin `resolved` ni `integrity`
  (`package-lock.json:853-855`), a diferencia de otras como `statuses` (`:856-864`).
  Hecho observado; causa no verificada.
- Un `lockfileVersion` 3 lo genera npm ≥ 7 (conocimiento general, no del proyecto), lo
  que sugiere que la instalación actual **no** se hizo con el npm de Node 8 que cita
  `LEEME.txt:5`. SUPOSICIÓN; ver P2.
- **No hay** `nodemailer` (instalado ni declarado; comprobado en `node_modules`) ni
  driver de MySQL: coherente con `services/email.js:8` y `config.js:19`.
- **Qué dice `LEEME.txt` y ya no es cierto o no es verificable**:
  - «Instalar node 8» (`:5`): `package.json` no lo exige y el código no lo comprueba.
  - «Última actualización: 11/03/2019 (aprox)» (`:20`), pero el propio fichero cita
    hechos de 2021 y 2022 (`:14-16`); y `server.js:4` data la remesa en 2021 y
    `services/email.js:8` la retirada de `nodemailer` en 2023.
  - «sqlite va bien» y «SIN PRISA» para MySQL (`:12-13`): coherente con `config.js:19`.

---

## 4. Resumen de criticidad

| Criticidad | Módulos |
|---|---|
| **Alta** | `services/calculo.js`, `lib/numeracion.js`, `lib/util.js` (`redondear2`, `sumarDias`), `routes/facturas.js`, `routes/informes.js`, `scripts/remesa_mensual.js`, `db.js`, `datos/gesfact.db`, `config.js`, `views/factura_detalle.ejs` |
| **Media** | `server.js`, `routes/contratos.js`, `routes/clientes.js`, `views/informe_iva.ejs`, `views/factura_nueva.ejs`, `package.json` |
| **Baja** | `routes/articulos.js`, `services/email.js`, `public/*`, resto de `views/`, `datos/migracion_mysql_2018.sql`, `LEEME.txt` |

---

## 5. (c) Zonas oscuras

Todo lo que existe y no encaja limpiamente en el mapa. Se **registra, no se corrige**
(Principio III).

### 5.1 Código muerto o inerte

| # | Elemento | Evidencia | Situación |
|---|---|---|---|
| M1 | Bloque de envío SMTP comentado | `services/email.js:12-25` | Código inactivo; `require('nodemailer')` comentado (`:8`) |
| M2 | `enviarFactura` sí se invoca, pero no hace nada | llamada `routes/facturas.js:93`; cuerpo `services/email.js:26-28` | En cada alta manual se escribe un aviso en consola; no la llaman ni la remesa (`scripts/remesa_mensual.js`) ni la rectificación (`routes/facturas.js:129-164`) |
| M3 | Bloque `SMTP` de la configuración | `config.js:29-34`; únicos usos `services/email.js:14-20` (comentados) | Sin consumidor activo; incluye una clave en claro (`config.js:33`) |
| M4 | Email de clientes: se captura y no sale a ningún sitio | recogido `routes/clientes.js:21-23`, `views/clientes.ejs:22`; único uso `services/email.js:27` (texto del aviso) | Dato guardado sin función activa |
| M5 | `config.EMPRESA.email` | definido `config.js:15`; ninguna vista lo usa (`views/factura_detalle.ejs:5-8,43` usa otros campos) | Sin consumidor |
| M6 | Exportaciones sin uso externo | `services/calculo.js:105-107` (`recargoPara`, `calcularLinea`, `porcentajeDescuento`), `lib/numeracion.js:46` (`formatear`) | Solo se llaman dentro de su propio fichero; no son código muerto, pero nadie fuera las consume |
| M7 | Tipos de IVA antiguos (16, 18, 7, 8) | `services/calculo.js:16-21` | Alcanzables solo con datos antiguos; la interfaz ofrece 21/10/4 (`views/factura_nueva.ejs:18`, `views/articulos.ejs:18`) y la BD actual no tiene otros (**BD**: artículos y contratos con IVA 21/10/4) |
| M8 | Cálculo `calcularProrrateo` solo se usa al dar de baja un contrato | `routes/contratos.js:39`; la remesa no lo usa (`scripts/remesa_mensual.js:43-51`) | Ver F4 |

### 5.2 Funcionalidades a medias o inacabadas

| # | Elemento | Evidencia |
|---|---|---|
| F1 | **Módulo de albaranes de Roberto (2021)**: no existe en el repositorio | Solo se menciona en `LEEME.txt:15-16` («a medias en su ordenador»); búsqueda de «albar» sin resultados en el código (Entorno). No se puede evaluar |
| F2 | **Envío de facturas por correo**, roto desde 2022 | `services/email.js:3-6`, `LEEME.txt:14` |
| F3 | **Migración a MySQL** | `datos/migracion_mysql_2018.sql:2-3`, `LEEME.txt:12-13` |
| F4 | **Prorrateo de baja de contrato**: el importe solo viaja en la URL (`/contratos?prorrateo=…`); ninguna ruta ni vista lo lee | `routes/contratos.js:38-40`; `GET /contratos` no usa `req.query` (`:9-14`); la vista lo describe como «barra de direcciones» (`views/contratos.ejs:17`). La factura se emite «a mano» (`routes/contratos.js:28-30`) |
| F5 | **No hay pantalla para crear contratos**, aunque la ruta existe | `POST /contratos/nuevo` en `routes/contratos.js:16-26`; `views/contratos.ejs` no tiene formulario de alta (solo tabla y baja, `:3-16`). SUPOSICIÓN: se dan de alta directamente en la BD (P4) |
| F6 | **Bajas sin reactivación ni edición** de clientes y artículos | solo `POST /:id/baja` (`routes/clientes.js:32-37`, `routes/articulos.js:26-31`); no hay ruta de edición ni de alta inversa |
| F7 | **Validación de NIF solo por longitud** (TODO de 2017) | `lib/util.js:41-48` |
| F8 | **Desfase de un día en vencimiento** (TODO de 2019, no reproducido) | `lib/util.js:17-26` |
| F9 | **Teléfono de empresa con marcador `XXX`** y es el que se imprime en la factura | `config.js:14`; impresión en `views/factura_detalle.ejs:7` |

### 5.3 Ficheros huérfanos y ajenos al producto

| # | Fichero | Evidencia |
|---|---|---|
| H1 | `datos/migracion_mysql_2018.sql` | Ningún `require`/ruta lo referencia (búsqueda en el código sin resultados, Entorno); solo citado en `LEEME.txt:12-13` y `config.js:19` (comentario) |
| H2 | `LEEME.txt` | Desactualizado y autocontradictorio (ver 3(b)); ningún código lo lee |
| H3 | `datos/gesfact.db` **no está versionada**: figura en `.gitignore:6` y `git ls-files datos` solo devuelve el `.sql` (Entorno). El fichero presente se creó el 9-oct (Entorno, `ls`) y su contenido coincide con la semilla de `db.js` | ver P1 |
| H4 | `.kiro/agents/` (directorio vacío) y `.kiro/prompts/`, `.specify/` | Andamiaje de Spec Kit/Kiro, no producto (`AGENTS.md:52-53`) |
| H5 | `.agents/summary/*.md` y `AGENTS.md` | Documentación generada en una fase anterior; no la he usado como evidencia: toda cita de este documento es de código/BD |
| H6 | Entrada `sqlite3` del lockfile sin `resolved`/`integrity` | `package-lock.json:853-855` |

### 5.4 Observaciones colaterales (para el registro de anomalías, sin corregir)

Detectadas al trazar dependencias; no son el objeto de este mapa pero afectan a la
criticidad asignada.

| # | Observación | Evidencia |
|---|---|---|
| O1 | **Dos prorrateos distintos**: 30 días fijos (`calcularProrrateo`) frente a días reales del mes (remesa) | `services/calculo.js:95-102` vs `scripts/remesa_mensual.js:43-51` |
| O2 | **El número de factura lleva el año del reloj del sistema, no el de la fecha de la factura**. La remesa se lanza el día 1 (`scripts/remesa_mensual.js:7`) y fecha la factura el último día del mes anterior (`:59`): la remesa de diciembre, lanzada en enero, tendría fecha de diciembre y número del año nuevo | `lib/numeracion.js:15`; `scripts/remesa_mensual.js:59` |
| O3 | **Alta de factura sin transacción**: cabecera primero, líneas después y en paralelo | `routes/facturas.js:74-98` (reconocido en `:81-82`) |
| O4 | **Rutas y base de datos relativas al directorio de ejecución**: ejecutar desde otra carpeta crearía una `datos/` nueva y, al estar vacía, la **rellenaría con los datos semilla** | `config.js:20`, `db.js:11-13,83-86`, `server.js:18` |
| O5 | **El panel de inicio cuenta como «pendientes» todas las facturas en estado `emitida`**, incluida la rectificativa `RE`, mientras el importe filtra la serie `FA` | `server.js:23-24` (**BD**: `RE-2026-000001` está `emitida`) |
| O6 | **`rectificar` no redirige si la factura no tiene líneas** (el `forEach` nunca llega al `redirect`) | `routes/facturas.js:147-159` |
| O7 | **Secretos en claro** en un fichero versionado | `config.js:33,37` (`git ls-files` incluye `config.js`) |
| O8 | **Vencimiento por defecto duplicado**: constante `VENCIMIENTO_DIAS` y `30` literal en la remesa | `config.js:40`, `routes/facturas.js:68`, `scripts/remesa_mensual.js:60` |
| O9 | **`/informes/iva?trimestre=5`** (u otro valor fuera de 1-4) provoca un error de ejecución al leer `meses[t][0]` | `routes/informes.js:16-18` |

---

## 6. Preguntas abiertas para el negocio

- **P1**: ¿`datos/gesfact.db` de este entorno es la base de producción o una copia de
  pruebas? Su contenido (6 clientes, 8 artículos, 4 contratos, 9 facturas, 28 líneas,
  contadores 108/1) coincide con la semilla de `db.js:93-181` y la Constitución la
  describe como datos reales. SUPOSICIÓN: es una copia generada por el propio programa.
- **P2**: ¿Con qué versión de Node se ejecuta hoy en el ordenador de la oficina? El
  `LEEME.txt` dice Node 8, pero `lockfileVersion: 3` y las dependencias instaladas
  apuntan a un entorno moderno. Sin esa respuesta, la versión de Node queda **sin
  verificar**.
- **P3**: Cuando se da de baja un contrato a mitad de mes, ¿se excluye después de la
  remesa de ese mes? La consulta de la remesa incluye contratos con `fecha_baja` dentro
  del mes (`scripts/remesa_mensual.js:28`) y la baja ya genera «a mano» el prorrateo
  (`routes/contratos.js:28-30`). SUPOSICIÓN: podría facturarse dos veces; sin verificar.
- **P4**: ¿Cómo se dan de alta los contratos, si `views/contratos.ejs` no tiene
  formulario? (F5).
- **P5**: ¿Se usa en producción alguna factura con IVA 16/18/7/8 en 2026 (M7)?
- **P6**: ¿Sigue vigente el número de teléfono con `XXX` impreso en las facturas
  (F9)?
- **P7**: ¿Conviene el año del sistema o el de la fecha de factura para la numeración
  de la remesa de diciembre (O2)? Hoy es el comportamiento sagrado (Principio I); la
  pregunta es solo para registrarlo.

---

## 7. Comprobación contra la puerta de calidad (Constitución)

- (a) **Sin cambios de comportamiento**: solo se ha creado este fichero. Las
  consultas a `datos/gesfact.db` fueron con `-readonly`.
- (b) **Sin dependencias nuevas ni refactors**: no se tocó `package.json`,
  `package-lock.json` ni ningún `.js`.
- (c) **Evidencia**: cada afirmación lleva fichero:líneas, «BD» o «Entorno». Los
  juicios de criticidad son estimaciones declaradas como tales; lo no verificable está
  marcado como SUPOSICIÓN y convertido en pregunta (sección 6).
- (d) **Idioma**: español.
