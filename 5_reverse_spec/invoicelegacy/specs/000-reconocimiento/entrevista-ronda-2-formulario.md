# Entrevista de negocio · Ronda 2 · Formulario para respuesta y firma

Preparado el 2026-11-11 a partir de `registro-de-anomalias.md` §5 y §6 y de
`entrevista-negocio-simulada.md` §5. Es un documento de solo lectura (Constitución,
Principios I a IV).

## Instrucciones

- Hay un bloque por persona. Cada pregunta se responde marcando una opción. Si ninguna
  encaja, escriba la respuesta en «Otra». «No lo sé» es una respuesta válida.
- Cada bloque necesita **nombre, cargo, fecha y firma**. Sin ellos, la respuesta no puede
  usarse como testimonio (Principio II) y la anomalía sigue abierta.
- Las preguntas están ordenadas de más a menos importe. Si el tiempo es corto, responda
  primero las de arriba.
- El formulario no incluye a propósito las respuestas que propuso el consultor, para no
  condicionar. Están en `entrevista-negocio-simulada.md` §2, por si se quieren consultar
  después.
- Todos los importes son reales y salen de la base de datos analizada. Si la pregunta G-1
  confirma que esa base no es la de producción, los importes pueden cambiar.

---

## Bloque G · Gerencia de Suministros Hidalgo, S.L.

Nombre: ______________________ · Cargo: ______________________ · Fecha: ____________ · Firma: ____________

**G-1 · (A-18) Base de datos analizada.** El fichero `datos/gesfact.db` que hemos analizado
contiene 9 facturas, de enero a mayo de 2026, y ninguna anterior. ¿Es la base de datos que
usa la oficina?
☐ Sí ☐ No ☐ No lo sé
Si la respuesta es «No», ¿dónde está la real? ____________ ¿Autoriza entregarnos una copia
de solo lectura? ☐ Sí ☐ No

**G-2 · (A-01) Ratificar la rectificación.** En 6 facturas emitidas, el total del pie no
coincide con la suma de las líneas: `FA-2026-000101`, `-105`, `-106`, `-107`, `-108` y
`RE-2026-000001`. ¿Ordena corregirlas con rectificativa?
☐ Sí, las 6 ☐ Sí, solo algunas: ____________ ☐ No ☐ Lo decide otra persona: ____________

**G-3 · (A-61) Regularizar el IVA.** En el primer trimestre de 2026, el IVA de los pies de
factura supera en 133,31 € a la suma de líneas. ¿Se regulariza ante Hacienda?
☐ Sí ☐ No ☐ Lo decide la gestoría

**G-4 · (A-05) Baja de un cliente.** Hoy, dar de baja un cliente no detiene sus contratos.
Por ejemplo, el cliente 1 seguiría recibiendo una factura de 108,90 € cada mes.
- Cuando un cliente se da de baja, ¿sus contratos dejan de facturarse? ☐ Sí ☐ No ☐ Depende: ____________
- ¿Se le debe poder hacer después una factura manual? ☐ Sí ☐ No

**G-5 · (A-32) Correcciones directas en la base de datos.** ¿Se permite corregir a mano una
factura ya emitida directamente en la base de datos?
☐ Sí, la persona autorizada es: ____________ ☐ No ☐ No sabía que se hiciera

**G-6 · (A-27) Descuento en las cuotas.** Si una cuota mensual de alquiler o mantenimiento
pasara de 1.000 € (por ejemplo, 1.500 €), ¿llevaría el descuento por volumen?
☐ Sí ☐ No
Si lleva descuento, ¿debe aparecer escrito en la factura? ☐ Sí ☐ No

**G-7 · (A-07) Descuento con 5.000 € exactos.** Una factura con base de 5.000,00 € exactos,
¿qué descuento lleva?
☐ 2 % ☐ 5 %

**G-8 · (A-26) A quién se aplica el descuento.** ¿El descuento por volumen se aplica a…?
☐ Todos los clientes ☐ Solo hostelería ☐ Otro criterio: ____________
¿Está escrito el acuerdo de 2018? ☐ Sí (dónde: ________) ☐ No
¿Quién es Paco? ____________

**G-9 · (A-25) Importe que decide el tramo.** Un pedido de 1.020,41 € queda en 1.000,00 €
después del 2 %. ¿El tramo se decide con el importe…?
☐ Antes del descuento ☐ Después del descuento

**G-10 · (A-31) Primer y último día del mes.**
- Un contrato dado de baja el día 1, ¿paga ese día? ☐ Sí ☐ No
- Un contrato dado de alta el último día del mes, ¿paga ese día? ☐ Sí ☐ No

**G-11 · (A-46) Acceso al programa.** ¿Se entra en GesFact desde fuera de la oficina, por
ejemplo por VPN o desde casa?
☐ Sí ☐ No ☐ No lo sé
¿Quién debe poder emitir, cobrar y rectificar facturas? ____________

**G-12 · (A-51) Copias de seguridad.** Hoy se copia la base de datos a un pendrive cada
viernes.
- ¿Acepta perder hasta una semana de facturación si falla el disco? ☐ Sí ☐ No
- ¿Se ha probado alguna vez a recuperar una copia? ☐ Sí ☐ No ☐ No lo sé

---

## Bloque S · Gestoría

Nombre: ______________________ · Cargo: ______________________ · Fecha: ____________ · Firma: ____________

**S-1 · (A-61, A-01) IVA declarado.**
- 303 del primer trimestre de 2026: ☐ 603,66 € (pantalla de IVA) ☐ 736,97 € (CSV) ☐ Otra: ________
- 303 del segundo trimestre de 2026: ☐ Pantalla de IVA ☐ CSV ☐ Otra: ________
- Los trimestres anteriores a 2026, ¿se presentaron con el CSV? ☐ Sí ☐ No ☐ No consta

**S-2 · (PR-01) Qué anula la rectificativa.** La rectificativa copia, con el signo cambiado,
lo grabado en la factura. En `FA-2026-000101`, eso es un IVA de 27,97 € (el pie), aunque el
cliente pagó un IVA de 24,27 € (las líneas). Para las 6 facturas descuadradas, ¿la
rectificativa debe anular…?
☐ El pie (lo declarado) ☐ Las líneas (lo cobrado) ☐ Otra forma: ____________

**S-3 · (A-02) Redondeo.** ¿El Contaplus exige el IVA y el recargo redondeados línea a línea,
y no sobre el total?
☐ Sí ☐ No ☐ Indiferente
¿Conservan la lista de diferencias del trimestre devuelto en 2019? ☐ Sí ☐ No

**S-4 · (A-23) Prorrateo de cuotas.** Un contrato de 90 € al mes que empieza el 15 de
febrero cobra 54,45 € (IVA incluido) si se cuenta por días reales y 50,82 € si se cuenta
sobre 30 días.
- ¿Qué método corresponde? ☐ Días reales del mes ☐ 30 días fijos
- Un servicio de febrero completo, ¿cobra…? ☐ La cuota entera ☐ 28/30 de la cuota

**S-5 · (A-08) Rectificar una factura cobrada.**
- ¿Se puede rectificar una factura ya cobrada? ☐ Sí ☐ No
- ¿Dónde se deja constancia de la devolución del dinero? ____________

**S-6 · (A-09) Devolución de parte de un pedido.** Cuando el cliente devuelve parte de la
mercancía, ¿qué documento se emite?
☐ Rectificativa por la parte devuelta ☐ Factura normal con líneas negativas ☐ Otro: ____________

**S-7 · (A-10) Año del número.** Si la remesa de diciembre de 2026 se emite el 1 de enero de
2027, ¿qué número debe llevar la factura?
☐ FA-2026-… ☐ FA-2027-…
¿Qué fecha debe llevar? ☐ 31/12/2026 ☐ 01/01/2027 ☐ Las dos (expedición y servicio)

**S-8 · (A-16) Trimestre de la rectificativa.** Si una factura de marzo se rectifica en
abril, ¿en qué trimestre se declara la rectificativa?
☐ En el de la rectificativa (2.º) ☐ En el de la original (1.º)

**S-9 · (A-28) Descuento visible.** ¿El descuento por volumen debe verse rebajado en el
precio de cada línea?
☐ Sí ☐ No, basta con el total
¿Cómo recibieron `FA-2026-000105`, que tiene líneas sin descuento y un total de 2.756,38 €? ____________

**S-10 · (A-29) Otros tipos de IVA.** ¿Se ha facturado alguna vez con un IVA distinto de 21,
10 o 4 %?
☐ Sí (cuál: ____, y con qué recargo: ____) ☐ No

**S-11 · (A-39) Ejercicios antiguos.** ¿Puede hacer falta reabrir un ejercicio con IVA del
16, 18, 7 u 8 %?
☐ Sí, hasta el año: ____ ☐ No

**S-12 · (A-40) Fichero CSV.**
- ¿Siguen importándolo en el Contaplus con este formato? ☐ Sí ☐ No
- ¿Para qué sirve la clave de la primera línea? ____________
- ¿Importa el orden de las filas? ☐ Sí ☐ No

**S-13 · (A-22) NIF.** ¿Han tenido rechazos de NIF de clientes de Suministros Hidalgo?
☐ Sí ☐ No

**S-14 · (PR-06) Pantalla de IVA.** ¿Usan la pantalla «Informe de IVA» de GesFact?
☐ Sí, para: ____________ ☐ No

---

## Bloque M · Administración (Marga)

Nombre: ______________________ · Cargo: ______________________ · Fecha: ____________ · Firma: ____________

**M-1 · (PR-05) Lo que pagó cada cliente.** Para cada factura, ¿el cliente pagó el total del
pie o la suma de las líneas?

| Factura | Pie | Suma de líneas | Pagó |
|---|---|---|---|
| `FA-2026-000105` | 2.756,38 € | ver factura | ☐ Pie ☐ Líneas ☐ Aún no ☐ No consta |
| `FA-2026-000106` | ver factura | ver factura | ☐ Pie ☐ Líneas ☐ Aún no ☐ No consta |
| `FA-2026-000107` | ver factura | ver factura | ☐ Pie ☐ Líneas ☐ Aún no ☐ No consta |
| `FA-2026-000108` | ver factura | ver factura | ☐ Pie ☐ Líneas ☐ Aún no ☐ No consta |

**M-2 · (A-04) Mes de la baja de un contrato.** Ejemplo: un contrato de 145 € al mes se da
de baja el 15 de marzo. La pantalla de baja da 87,73 € y la remesa da 84,89 €. ¿Cómo se
factura ese mes?
☐ Solo a mano ☐ Solo con la remesa ☐ Con las dos ☐ Otra forma: ____________
¿Se ha cobrado alguna vez dos veces? ☐ Sí ☐ No ☐ No lo sé

**M-3 · (A-23) Alta del contrato 4.** ¿Cuánto se facturó en febrero de 2026 por el contrato 4,
que empezó el 15 de febrero?
☐ 54,45 € ☐ 50,82 € ☐ Otro: ________ ☐ No se facturó

**M-4 · (A-09) Líneas negativas.** ¿Ha hecho alguna vez una factura normal (serie FA) con
cantidades o precios negativos?
☐ Sí, para: ____________ ☐ No

**M-5 · (A-32) Cambios a mano en la base de datos.** Algunas facturas de remesa tienen
líneas de café, azúcar o vasos que el programa no genera. ¿Se añadieron a mano en la base
de datos?
☐ Sí, quién: ________ ☐ No ☐ No lo sé

**M-6 · (A-22) NIF.**
- ¿Son reales los NIF de los clientes 2 a 6? ☐ Sí ☐ No ☐ No lo sé
- ¿Sigue revisando cada NIF a mano? ☐ Sí ☐ No

**M-7 · (A-33) Pantalla de inicio.** ¿Una rectificativa debe contar como «pendiente de cobro»?
☐ Sí ☐ No

**M-8 · (A-36) Plazo de pago de 0 días.** Un cliente con 0 días de plazo, ¿qué significa?
☐ Al contado ☐ El plazo por defecto de 30 días

**M-9 · (A-49) Teléfono en la factura.** Las facturas que reciben los clientes, ¿qué
teléfono llevan?
☐ «925 511 XXX» ☐ El número completo

**M-10 · (A-56) Carpeta del programa.** ¿Cuál es la carpeta real?
☐ `\\SERVIDOR\gesfact` ☐ `\\SERVIDOR\compartido\gesfact` ☐ Las dos
¿Por qué no se puede renombrar `config.js`? ____________

**M-11 · (A-48) Envío de facturas.** ¿Lleva un control de qué facturas ha enviado y a qué
cliente?
☐ Sí, dónde: ________ ☐ No

---

## Bloque N · Responsable del correo (Manoli)

Nombre: ______________________ · Cargo: ______________________ · Fecha: ____________ · Firma: ____________

**N-1 · (A-48) Correo de facturas.** En el programa hay un aviso: «hablar con Manoli antes de
tocar el correo».
- ¿Por qué hay que hablar contigo? ____________
- ¿Se decidió no volver a enviar las facturas por correo desde el programa? ☐ Sí ☐ No ☐ Está pendiente

---

## Al recibir el formulario firmado

1. Pasar las respuestas a `entrevista-negocio.md` (el acta real), con el bloque, la
   pregunta, el nombre y la fecha.
2. Propagarlas al registro de anomalías, al de riesgos y a la memoria histórica con el
   mismo procedimiento que en `registro-de-anomalias.md` §6.
3. Lo que quede sin respuesta, o lo que surja nuevo, pasa a la ronda 3.
