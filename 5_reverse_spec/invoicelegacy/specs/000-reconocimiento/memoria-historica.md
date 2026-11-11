# Memoria histórica de GesFact (extraída de los comentarios)

Cronología de incidentes, decisiones, advertencias y trabajos abandonados que el propio
código y los ficheros del proyecto cuentan sobre sí mismos. Es un documento de **solo
lectura**: no se ha modificado código, datos ni dependencias (Constitución, Principios I,
III y IV).

## 0. Método y límites

- **Fuentes revisadas**: todos los comentarios de `server.js`, `config.js`, `db.js`,
  `routes/*.js`, `services/*.js`, `lib/*.js`, `scripts/remesa_mensual.js`,
  `public/js/factura.js`, `public/css/estilos.css`, `LEEME.txt`,
  `datos/migracion_mysql_2018.sql`, `package.json`, `.gitignore`, y las notas visibles
  en `views/*.ejs`. También el texto de `observaciones` de las facturas semilla de
  `db.js`, porque cuenta un incidente.
- **Evidencia** (Principio II): `fichero:línea` sobre el estado actual del repositorio.
  Todo lo que es deducción mía va marcado **SUPOSICIÓN** y se convierte en pregunta.
- **Fechas**: «aprox.» significa que el comentario solo da mes/año o año. «Sin fecha»
  significa que el comentario no la da; el orden de esas entradas no implica cronología.
- **Qué NO es**: no he consultado el historial de git del producto original (el
  repositorio solo contiene la historia de esta fase documental) ni la BD de producción.
  Por tanto, nada de aquí está contrastado con datos reales salvo lo indicado.
- Los valores de secretos de `config.js` no se reproducen; solo se cita el nombre de la
  clave.
- Las referencias de línea de otros documentos de `specs/000-reconocimiento/` a
  `routes/clientes.js` (`:57`, `:59`, `:73-77`) no existen en el fichero actual (tiene 39
  líneas). Las de este documento sí están comprobadas contra el fichero actual.

Cada entrada tiene: **Cuándo · Qué · Quién · Dónde · Pregunta al negocio**. Tipos:
`INCIDENTE`, `DECISIÓN`, `NO TOCAR`, `ABANDONADO`, `PRÁCTICA` (forma de trabajar
documentada en un comentario).

---

## 1. Cronología

### H-01 · Antes de 2017 · DECISIÓN / PRÁCTICA · El prorrateo «a lo comercial» viene del Access de Paco
- **Qué**: el prorrateo de cuotas usa mes de 30 días fijos porque «así lo hacía Paco a
  mano en el Access y así lo espera la gestoría». Un comentario adicional dice que en
  meses de 31 días «el día 31 no se cobra».
- **Quién**: Paco (rol no consta), la gestoría (sin nombre en este comentario).
- **Dónde**: `services/calculo.js:90-93` y `:99`.
- **Pregunta**: ¿Quién es Paco y qué cargo tenía/tiene? ¿Sigue siendo la gestoría quien
  espera los 30 días, o fue un acuerdo verbal antiguo? ¿Hay algo escrito? Además, la
  remesa mensual prorratea por días reales (`scripts/remesa_mensual.js:43-51`): ¿alguien
  decidió esa diferencia o fue un descuido de Roberto en 2021 (ver H-15)?

### H-02 · Sin fecha (referido a «ejercicios viejos del Access») · NO TOCAR · Tipos de IVA antiguos
- **Qué**: se conservan los recargos de equivalencia de tipos antiguos (16/18 general,
  7/8 reducido) con la orden «no borrar por si hay que reabrir ejercicios viejos del
  Access».
- **Quién**: nadie identificado.
- **Dónde**: `services/calculo.js:16-21`.
- **Pregunta**: ¿Se ha reabierto alguna vez un ejercicio antiguo? ¿Hasta qué año hay
  facturas del Access que podrían requerir esos tipos? ¿Se conservan esos datos fuera de
  GesFact?

### H-03 · Sin fecha (heredado del GesFact 1.x) · NO TOCAR · Utilidades heredadas del Access
- **Qué**: «algunas [funciones] vienen del gesfact 1.x en Access, cuidado al tocar».
  Incluye el redondeo «de toda la vida».
- **Quién**: Julián (autor del comentario).
- **Dónde**: `lib/util.js:2` y `:4`.
- **Pregunta**: ¿Cuáles de esas funciones son las heredadas y por qué hay que tener
  cuidado? Julián no lo detalla. ¿Podemos hablar con él?

### H-04 · 2017 · DECISIÓN · Reescritura del GesFact 1.x (Access) a Node
- **Qué**: versión 2.0, reescritura del programa en Access a Node. El `package.json`
  firma a «Julian» como autor y el CSS lleva «Julian 2017».
- **Quién**: Julián.
- **Dónde**: `server.js:7`; `package.json:9`; `public/css/estilos.css:1`.
- **Pregunta**: ¿Quién encargó la reescritura y con qué alcance? ¿Se conserva el
  programa Access original y su base de datos (para contrastar cálculos de ejercicios
  anteriores)? ¿Dónde?

### H-05 · Nov 2017 · ABANDONADO · Comprobación de la letra del NIF
- **Qué**: queda un TODO: «falta comprobar la letra, de momento con la longitud vale
  porque los da de alta Marga y los mira ella». Hoy sigue validando solo 9 caracteres.
  Un segundo comentario repite la idea: «la validación "fuerte" la hace Marga mirándolo».
- **Quién**: Julián (TODO), Marga (validación manual).
- **Dónde**: `lib/util.js:41-48`; `routes/clientes.js:16`.
- **Pregunta**: ¿Marga sigue revisando cada NIF a mano? ¿Si Marga falta, quién lo hace?
  ¿Han rechazado alguna vez la gestoría o Hacienda un NIF de GesFact?

### H-06 · Mar 2018 · INCIDENTE + DECISIÓN · De ficheros JSON a SQLite por corrupción de datos
- **Qué**: se abandonó el almacenamiento en ficheros `.json` «porque se corrompían los
  datos cuando Marga y yo grabamos a la vez» y se pasó a SQLite (versión 2.2).
- **Quién**: Julián y Marga (como usuarios simultáneos).
- **Dónde**: `db.js:2-4`; `server.js:6`; `config.js:19`.
- **Pregunta**: ¿Qué datos se perdieron o hubo que reconstruir en aquella corrupción?
  ¿Cuántas personas graban hoy a la vez? (Es la misma causa del incidente H-14, tres años
  después.) ¿Se migraron todos los datos del JSON a SQLite y se verificaron?

### H-07 · 2018 · DECISIÓN · Descuento por volumen (2 % desde 1.000 €, 5 % desde 5.000 €)
- **Qué**: «acordado con Paco en 2018 para fidelizar hostelería». La comparación es
  estricta (`>`), de modo que 1.000,00 € exactos no descuentan (ver H-22).
- **Quién**: Paco.
- **Dónde**: `services/calculo.js:36-43`; `views/factura_nueva.ejs:26` («los descuentos
  por volumen se aplican solos»).
- **Pregunta**: ¿Sigue vigente la política? ¿Se aplica a clientes que no son de
  hostelería (SUPOSICIÓN: sí, el código no distingue sector)? ¿Algún cliente tiene un
  acuerdo distinto o sin descuento? ¿Está recogido en algún contrato o tarifa?

### H-08 · 2018 · DECISIÓN · El descuento se aplica línea a línea a petición de Puri
- **Qué**: el descuento se reparte en el precio de cada línea «para que la gestoría lo
  vea desglosado igual».
- **Quién**: Puri (gestoría).
- **Dónde**: `services/calculo.js:63-64`.
- **Pregunta**: ¿Puri sigue en la gestoría? ¿Quién es ahora el contacto y conoce este
  criterio? ¿Existe correspondencia o acta de esa petición?

### H-09 · Oct 2018 · ABANDONADO · Migración a MySQL
- **Qué**: se hizo un volcado «de PRUEBA» a MySQL que «nunca se llegó a ejecutar en
  producción»; el esquema está desfasado (sin recargo ni rectificativas). Se guarda
  «por si acaso». `LEEME.txt` lo deja como pendiente «SIN PRISA, sqlite va bien».
- **Quién**: Julián.
- **Dónde**: `datos/migracion_mysql_2018.sql:1-3`; `LEEME.txt:11-13`; `config.js:19`;
  `db.js:3-4`.
- **Pregunta**: ¿Existe de verdad un «servidor nuevo» con MySQL? ¿Sigue habiendo
  intención de migrar o se puede dar por cancelado? ¿Quién lo decidió?

### H-10 · Mar 2019 · INCIDENTE (no reproducido) · Vencimiento con un día menos
- **Qué**: el vencimiento de una factura salió un día menos; Julián cree que fue por el
  cambio de hora y no logró reproducirlo. Sigue como TODO.
- **Quién**: Julián.
- **Dónde**: `lib/util.js:17-26`.
- **Pregunta**: ¿Qué factura fue? ¿Alguien notó consecuencias (reclamación de cobro,
  recargo)? ¿En qué equipo (zona horaria, versión de Node) se emitió?

### H-11 · 2019 · DECISIÓN · Formato del CSV de gestoría acordado con Puri
- **Qué**: punto y coma, decimales con coma y clave en la primera línea. La clave tiene
  la anotación «(no cambiar)». Se añade en la versión 2.3 junto con el informe de IVA.
- **Quién**: Puri (gestoría).
- **Dónde**: `routes/informes.js:32-33` y `:40`; `config.js:36-37` (clave
  `CLAVE_EXPORT_GESTORIA`); `server.js:5`.
- **Pregunta**: ¿Para qué sirve exactamente esa clave (control de acceso, identificación
  del cliente en el software de la gestoría)? ¿La gestoría la cambiaría si se lo pidiéramos?
  ¿Sigue importando el fichero en Contaplus con este formato?

### H-12 · May 2019 · INCIDENTE + NO TOCAR · Redondeo sobre la base total: la gestoría devolvió el trimestre
- **Qué**: Julián cambió el redondeo a la base total; Puri devolvió «todo el trimestre»
  porque el Contaplus cuadra las facturas línea a línea. Se revirtió y quedó el aviso
  «NO CAMBIAR LA FORMA DE REDONDEAR».
- **Quién**: Julián, Puri.
- **Dónde**: `services/calculo.js:3-7`; `services/calculo.js:25`.
- **Pregunta**: ¿Qué facturas y trimestre afectó? ¿Hubo que reemitir o rectificar algo
  y cómo se resolvió? ¿Se conserva la lista de diferencias que mandó la gestoría?

### H-13 · 2020 · INCIDENTE LEGAL + NO TOCAR · Inspección: las facturas no se borran nunca
- **Qué**: «desde la inspección de 2020 las facturas NO SE BORRAN NUNCA»; los errores se
  corrigen con rectificativa en serie RE y una factura nueva. La numeración debe ser
  correlativa y sin huecos por serie y año.
- **Quién**: nadie identificado (la inspección no indica quién la hizo).
- **Dónde**: `lib/numeracion.js:3-6`.
- **Pregunta**: ¿Qué inspección fue (Hacienda, otra)? ¿Qué se halló? ¿Hay informe o
  acta? ¿Se impuso alguna sanción o requerimiento que condicione otros comportamientos
  del sistema?

### H-14 · 2 ene 2021 · INCIDENTE · Dos facturas con el mismo número
- **Qué**: el 2 de enero de 2021 salieron dos facturas con el mismo número porque
  «Marga y yo grabamos a la vez». El arreglo fue leer «último+1 justo antes de grabar».
  Julián remata con «no ha vuelto a pasar (creo)».
- **Quién**: Julián y Marga.
- **Dónde**: `lib/numeracion.js:8-10`.
- **Pregunta**: ¿Cuáles fueron esas dos facturas y cómo se corrigió (se rectificó una)?
  ¿Se le comunicó a la gestoría? ¿Se ha comprobado desde entonces que no hay duplicados?
  Hoy `facturas.numero` no tiene restricción de unicidad (`db.js:52`); la afirmación «no ha
  vuelto a pasar» no está verificada (**SUPOSICIÓN** de que no se ha repetido).

### H-15 · Verano 2021 · DECISIÓN / PRÁCTICA · Roberto (becario) crea la remesa mensual
- **Qué**: Roberto, siendo becario, añadió el script de remesas para no meter las cuotas
  a mano cada mes (versión 2.4). Se lanza el día 1 desde el ordenador de Marga con el
  mes recién terminado. La pantalla de inicio repite el recordatorio.
- **Quién**: Roberto, Marga.
- **Dónde**: `scripts/remesa_mensual.js:1-7`; `server.js:4`; `views/index.ejs:9-10`.
- **Pregunta**: ¿Roberto sigue en la empresa? ¿Quién revisó y aprobó el script antes de
  usarse en producción? ¿Qué ocurre si Marga está de vacaciones el día 1? ¿Quién valida
  el resultado de cada remesa?

### H-16 · 2021 · ABANDONADO · Módulo de albaranes de Roberto
- **Qué**: «Roberto empezó un módulo de albaranes en 2021, está a medias en su
  ordenador (preguntarle si vuelve en campaña)». No hay ningún rastro en este repositorio.
- **Quién**: Roberto.
- **Dónde**: `LEEME.txt:15-16`.
- **Pregunta**: ¿Qué problema de negocio resolvía (facturar a partir de albaranes
  entregados)? ¿Hoy se hace a mano? ¿Cuál es la «campaña» y cuándo es? ¿Se puede
  recuperar el código del ordenador de Roberto?

### H-17 · 2021 · DECISIÓN menor · Autorrelleno de precio/IVA y retoque de estilos
- **Qué**: Roberto añadió el autorrelleno de precio e IVA al elegir un artículo (antes se
  copiaba a mano del listado) y retocó el CSS de Julián.
- **Quién**: Roberto.
- **Dónde**: `public/js/factura.js:1-2`; `public/css/estilos.css:1`.
- **Pregunta**: ¿Los precios se siguen copiando del catálogo en el momento o hay
  facturas que llevan un precio distinto al del catálogo? (El script rellena, pero el
  usuario puede modificarlo.)

### H-18 · 2022 · INCIDENTE + NO TOCAR · El correo de facturas deja de funcionar (Arsys)
- **Qué**: Arsys cambió el servidor de correo y dejó de autenticar. Desde entonces las
  facturas se envían A MANO desde el Outlook de Marga, imprimiendo la vista de factura a
  PDF con el navegador. Hay dos avisos: «hablar con Manoli antes de reactivar esto» y
  «hablar con Manoli antes de tocar nada de esto».
- **Quién**: Manoli (rol no consta), Marga, Arsys (proveedor).
- **Dónde**: `services/email.js:1-6` y `:26-28`; `config.js:27-34`; `LEEME.txt:14`.
- **Pregunta**: ¿Quién es Manoli y por qué su visto bueno es necesario (¿contrato de
  correo, protección de datos, proveedor informático?). ¿Cuántas facturas al mes se envían
  a mano? ¿Existe algún registro de qué facturas se enviaron a qué cliente?

### H-19 · 2023 · DECISIÓN · Se desinstala `nodemailer` por un aviso de seguridad
- **Qué**: la dependencia de correo se retiró «porque daba un aviso de seguridad»; el
  código de envío queda comentado.
- **Quién**: nadie identificado.
- **Dónde**: `services/email.js:8` (y bloque comentado `:12-25`).
- **Pregunta**: ¿Quién la desinstaló y qué aviso era? ¿Se decidió a la vez no
  reactivar el correo, o simplemente quedó pendiente?

### H-20 · Sin fecha · INCIDENTE · Factura con líneas a medias, arreglada a mano en la BD
- **Qué**: al grabar una factura las líneas se insertan una a una; «si falla una a mitad
  ya se apaño en su dia a mano en la bd, no ha vuelto a pasar» (cita literal, sin tildes).
- **Quién**: nadie identificado (la voz parece la de Julián, **SUPOSICIÓN**).
- **Dónde**: `routes/facturas.js:81-82`.
- **Pregunta**: ¿Cuándo ocurrió y a qué factura(s)? ¿Qué se tocó exactamente en la BD y
  quién tiene autorización para hacerlo? ¿Se avisó a la gestoría? ¿Ha ocurrido otra vez
  sin que nadie lo notara?

### H-21 · Sin fecha · DECISIÓN + NO TOCAR · La rectificativa es el espejo exacto de la original («Puri dixit»)
- **Qué**: al rectificar no se recalcula nada; se invierten los signos de lo grabado. Se
  atribuye a Puri el criterio de que la rectificativa sea espejo exacto.
- **Quién**: Puri.
- **Dónde**: `routes/facturas.js:124-128`.
- **Pregunta**: ¿Es solo para rectificación total? ¿Qué hacen cuando el cliente solo
  devuelve parte de la mercancía (el sistema no tiene abono parcial)? ¿Quién emite
  entonces ese documento y en qué serie?

### H-22 · Sin fecha · NO TOCAR · «Caso comentado con la gestoría»: base de 1.000 € justos no lleva descuento
- **Qué**: la factura semilla `FA-2026-000103` está anotada con «OJO caso comentado con
  la gestoría: base 1000 justa NO lleva descuento». Es el origen del `>` estricto.
- **Quién**: la gestoría (sin nombre).
- **Dónde**: `db.js:138-139`; `services/calculo.js:39-43`.
- **Pregunta**: ¿Quién planteó el caso y quién lo resolvió? ¿La regla «a partir de
  1.000 €» (`calculo.js:37`) significa «más de 1.000» o «1.000 incluido»? El texto del
  comentario y la regla implementada se contradicen: el comentario dice «a partir de» y el
  código exige estrictamente más.

### H-23 · Sin fecha · ABANDONADO · Partir `routes/facturas.js` «algún día»
- **Qué**: Julián reconoce que el fichero ha crecido y que «algún día habría que
  partirlo. "Algún día"». Nunca se hizo.
- **Quién**: Julián.
- **Dónde**: `routes/facturas.js:2-3`.
- **Pregunta**: ¿Hay presupuesto o intención de mantenimiento evolutivo? (Fuera de
  alcance de esta fase por el Principio IV; se anota para el módulo siguiente.)

### H-24 · Sin fecha · PRÁCTICA · Baja de contrato a mitad de mes: el prorrateo se factura a mano
- **Qué**: la pantalla de baja calcula el prorrateo del último mes y lo devuelve por la
  barra de direcciones; «administración emite después a mano la factura del prorrateo».
- **Quién**: «administración» (Marga, **SUPOSICIÓN**: otros comentarios la sitúan como la
  persona que opera el sistema).
- **Dónde**: `routes/contratos.js:28-30` y `:37`; `views/contratos.ejs:17`.
- **Pregunta**: ¿Quién emite esa factura y con qué importe: el de la pantalla (30 días)
  o el que saldría de la remesa (días reales)? ¿Qué pasa si además la remesa del mes
  también factura ese contrato (mientras `fecha_baja >= primer día del mes` sigue
  entrando)? ¿Se ha duplicado alguna vez?

### H-25 · Sin fecha · PRÁCTICA · Copias de seguridad semanales en un pendrive
- **Qué**: Marga copia `datos/gesfact.db` a un pendrive los viernes.
- **Quién**: Marga.
- **Dónde**: `LEEME.txt:18`.
- **Pregunta**: ¿Se ha probado alguna vez una restauración? ¿Dónde se guarda el pendrive?
  ¿Quién cubre a Marga? ¿Qué pasa con lo facturado de lunes a viernes si falla el disco?
  (Para esa pregunta, el `LEEME.txt` es la única evidencia: no consta ninguna otra copia.)

### H-26 · Sin fecha · NO TOCAR · `config.js` se copia a mano al servidor y no se renombra
- **Qué**: «este fichero se copia a mano al servidor de la oficina (`\\SERVIDOR\gesfact`)
  cuando se cambia algo. NO RENOMBRAR.»
- **Quién**: nadie identificado.
- **Dónde**: `config.js:2-3`.
- **Pregunta**: ¿Por qué no se puede renombrar (¿algún otro programa, acceso directo o
  proceso lo lee?) ¿Quién copia el fichero y con qué frecuencia? Atención: la ruta citada
  aquí (`\\SERVIDOR\gesfact`) no coincide con la del `LEEME.txt:6`
  (`\\SERVIDOR\compartido\gesfact`). ¿Cuál es la real o hay dos copias del programa?

### H-27 · Sin fecha (la gestoría revisa) · PRÁCTICA · La gestoría revisa el IVA antes del modelo 303
- **Qué**: el informe de IVA lo revisa la gestoría «antes del modelo 303»; se calcula
  sumando líneas (las rectificativas restan solas). En el código: «para el modelo 303 lo
  termina la gestoría».
- **Quién**: la gestoría.
- **Dónde**: `routes/informes.js:13` y `:21-22`; `views/informe_iva.ejs:16`.
- **Pregunta**: ¿Qué documento usa realmente la gestoría para el 303: la pantalla de
  IVA (suma de líneas) o el CSV (importes de cabecera)? Ambos pueden diferir
  (registro de riesgos R1). ¿Alguna vez les ha salido una diferencia?

### H-28 · Sin fecha (mencionado en datos, 2026) · INCIDENTE · Remesa de abril 2026: cuota duplicada
- **Qué**: la factura semilla `FA-2026-000106` queda anotada «Remesa abril. ERROR cuota
  duplicada, ver RE-2026-000001». Se rectificó el 2026-05-06 y se emitió
  `FA-2026-000107` el mismo día con la nota «Sustituye a FA-2026-000106». Una cuota se
  facturó dos veces al cliente 6.
- **Quién**: nadie identificado.
- **Dónde**: `db.js:156`, `:160`, `:164`.
- **Pregunta**: ¿Cómo se duplicó? La causa no consta; **SUPOSICIÓN**: la remesa se lanzó
  dos veces o hubo dos contratos para el mismo cliente. ¿Se avisó al cliente? ¿Es el único
  caso? Nota: `db.js:91-92` presenta estos datos como «los que había cuando se hizo la
  copia»; no he verificado si coinciden con la BD de producción.

### H-29 · Sin fecha · NO TOCAR · Datos iniciales «no tocar, administración los usa de referencia»
- **Qué**: el bloque de datos semilla lleva la orden de no tocarlo porque administración
  lo usa de referencia.
- **Quién**: «administración».
- **Dónde**: `db.js:91-92`.
- **Pregunta**: ¿Qué significa «cuando se hizo la copia» (¿una copia de una BD real
  anonimizada, de pruebas, de formación?). ¿Quién en administración los consulta y para qué?

### H-30 · Inconsistencia · LEEME.txt fechado en 2019 pero cuenta hechos de 2021-2022
- **Qué**: `LEEME.txt` dice «última actualización: 11/03/2019 (aprox)», pero describe el
  fallo de Arsys de 2022 y el módulo de albaranes de 2021. Además `server.js:1,4` y
  `package.json:3` indican versión 2.4 (2021). Los comentarios no son del momento que
  parecen.
- **Quién**: Julián (firma del LEEME).
- **Dónde**: `LEEME.txt:14-16` y `:20`.
- **Pregunta**: ¿Quién ha ido editando el fichero tras 2019 sin actualizar la fecha?
  ¿Sigue Julián vinculado al sistema? ¿Hay otro mantenedor?

---

## 2. Índices por tipo

### 2.1 Advertencias «no tocar» y su motivo

| Advertencia | Motivo declarado | Entrada | Dónde |
|---|---|---|---|
| No cambiar la forma de redondear | Contaplus cuadra línea a línea; en may 2019 la gestoría devolvió un trimestre | H-12 | `services/calculo.js:3-7` |
| No borrar facturas | Inspección de 2020; numeración correlativa legal | H-13 | `lib/numeracion.js:3-6` |
| No borrar tipos de IVA antiguos | Reabrir ejercicios viejos del Access | H-02 | `services/calculo.js:16-17` |
| No cambiar la clave de exportación | La pide la gestoría para el fichero | H-11 | `config.js:36` |
| No renombrar `config.js` | No consta | H-26 | `config.js:2-3` |
| Hablar con Manoli antes de tocar el correo | No consta | H-18 | `config.js:27-28`; `services/email.js:6` |
| No tocar los datos iniciales | Administración los usa de referencia | H-29 | `db.js:91-92` |
| Cuidado al tocar `util.js` | Funciones heredadas del Access | H-03 | `lib/util.js:2` |
| Base de 1.000 € justos NO lleva descuento | Caso comentado con la gestoría | H-22 | `db.js:138` |
| La rectificativa no recalcula nada | Puri: espejo exacto de la original | H-21 | `routes/facturas.js:127-128` |
| Migración a MySQL «sin prisa» | sqlite va bien | H-09 | `LEEME.txt:12-13` |

Motivos que **no constan** y conviene preguntar: por qué no renombrar `config.js` y por
qué Manoli debe intervenir.

### 2.2 Trabajos abandonados o pendientes

| Trabajo | Estado según comentario | Entrada | Dónde |
|---|---|---|---|
| Migración a MySQL | Volcado de prueba, nunca ejecutado, esquema desfasado | H-09 | `datos/migracion_mysql_2018.sql:1-3`; `LEEME.txt:12-13` |
| Envío de facturas por email | Fuera de servicio desde 2022; `nodemailer` desinstalado en 2023 | H-18, H-19 | `services/email.js:3-8`; `LEEME.txt:14` |
| Módulo de albaranes (Roberto) | A medias en su ordenador, 2021 | H-16 | `LEEME.txt:15-16` |
| Comprobar la letra del NIF | TODO desde nov 2017 | H-05 | `lib/util.js:42-43` |
| Reproducir el desfase de vencimiento | TODO desde mar 2019 | H-10 | `lib/util.js:18-19` |
| Partir `routes/facturas.js` | «Algún día» | H-23 | `routes/facturas.js:2-3` |

### 2.3 Personas que aparecen

| Persona | Rol (según los comentarios) | Entradas |
|---|---|---|
| Julián | Autor y mantenedor original (2017-2021). Firma `package.json` y `LEEME.txt` | H-03, H-04, H-05, H-06, H-09, H-10, H-12, H-14, H-23, H-30 |
| Marga | Administración: da de alta y vigila clientes, lanza la remesa el día 1, envía facturas por Outlook, hace copias los viernes. Grabó a la vez que Julián en dos incidentes | H-05, H-06, H-14, H-15, H-18, H-25 |
| Paco | Aparece como fuente de dos reglas de negocio (descuento 2018 y prorrateo del Access). Rol **no consta** | H-01, H-07 |
| Puri | Gestoría: criterios de descuento, formato CSV, rectificativas; devolvió el trimestre de 2019 | H-08, H-11, H-12, H-21 |
| Roberto | Becario en 2021: remesa, autorrelleno, CSS; módulo de albaranes a medias | H-15, H-16, H-17 |
| Manoli | Debe consultarse antes de tocar el correo. Rol **no consta** | H-18 |
| «Administración» | Emite a mano facturas de prorrateo; usa los datos semilla de referencia | H-24, H-29 |

## 3. Preguntas prioritarias (si solo se pueden hacer unas pocas)

1. **H-12 / H-08 / H-01 / H-11** — ¿Hay algo escrito (correo, acta) de los acuerdos con
   Puri y Paco? Hoy esos acuerdos solo existen en comentarios de código.
2. **H-24 / H-01** — ¿Qué importe se factura realmente cuando se da de baja un contrato a
   mitad de mes: 30 días fijos o días reales?
3. **H-14 / H-28** — ¿Qué incidentes de duplicados (número repetido en 2021, cuota
   duplicada en abril de 2026) se han dado en realidad y cómo se detectaron?
4. **H-13** — ¿Qué se halló en la inspección de 2020 y existe documento?
5. **H-25 / H-15** — Dependencia de personas concretas (Marga: copias, remesa, Outlook,
   NIF). ¿Quién la sustituye?
6. **H-18 / H-26** — ¿Quién es Manoli y por qué no se puede tocar el correo ni renombrar
   `config.js`?
7. **H-22** — ¿«A partir de 1.000 €» incluye los 1.000,00 €? (Comentario y código se
   contradicen en el texto.)
