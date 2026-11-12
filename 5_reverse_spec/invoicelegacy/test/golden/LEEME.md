# Golden master del flujo de emisión de facturas

## Qué es

`master.json` es la salida **completa** (con todos los decimales) que produce HOY GesFact
para un juego **fijo de 12 casos** de entrada (`casos.js`) del flujo central de negocio:
emitir una factura (`flujo-factura.md`).

| Casos | Camino | Qué ejercitan |
|---|---|---|
| G01–G10 | A · alta manual (`POST /facturas/nueva`, router real, BD temporal) | redondeo línea a línea con coma flotante, recargo de equivalencia, los tres tipos de IVA, fronteras del descuento (1.000,00 / 1.000,01 / 5.000,00 / 5.000,01), tramo decidido con la base bruta, tecleo español (`1.234,50`, filas vacías, negativos, IVA 5 %), año del número frente a la fecha de la factura, vencimientos |
| G11–G12 | B · remesa mensual (`scripts/remesa_mensual.js` real, BD temporal) | prorrateo por días reales, febrero de 28 días, baja y alta a mitad de mes, cuota grande con descuento y recargo, remesa de diciembre lanzada en enero (año 2027 en el número) |

Cada caso guarda: la **entrada** tal cual se envía, y la **salida** (respuesta HTTP o consola del
script, cabecera de la factura y todas sus líneas, y los contadores de numeración). No hay
ninguna cifra escrita a mano: el master se genera ejecutando el código real.

El master **congela el comportamiento actual, correcto o no** (Constitución, Principio I). Varias
cifras que contiene son anomalías registradas (A-06, A-09, A-10, A-25, A-27, A-29...); están ahí
a propósito.

## Cómo se usa

`node --test test/golden-master.test.js` (o `npm test`, que lo incluye) regenera la salida y la
compara en profundidad con `master.json`. Si algo cambia, el fallo indica el **caso** y el
**campo** exactos, por ejemplo:

```
Caso G05, campo salida.factura.base: esperado 980.01, obtenido 980.02
```

Todo se ejecuta en bases de datos temporales, con `TZ=Europe/Madrid` y el reloj del sistema fijo
en 2026-11-11 10:00 (G12 usa 2027-01-01 09:00). La base real `datos/gesfact.db` no se abre nunca.

## Cuándo DEBE regenerarse

**Solo** cuando el negocio haya tomado y **documentado por escrito** una decisión que cambie el
comportamiento del flujo de facturación (Constitución, Principio I y «Governance»), y el cambio
de código correspondiente esté aprobado. Ejemplos legítimos: la gestoría confirma que 5.000,00 €
exactos deben llevar el 5 % (A-07); se unifica el prorrateo (A-23).

**Nunca** se regenera:

- para «poner en verde» un test que falla (un fallo es un cambio de comportamiento que hay que
  explicar o revertir, no un resultado que aceptar);
- porque cambie la versión de Node, la zona horaria de la máquina o el orden de los ficheros: eso
  son problemas del entorno, no del master (el test fija TZ y reloj; si aun así falla, investigar);
- para añadir o quitar casos sin decisión: el juego de casos (`casos.js`) es fijo.

## Cómo se regenera

1. Dejar escrita la decisión de negocio (quién, cuándo, qué cambia y qué entradas anomalías del
   registro resuelve) y enlazarla en el mensaje del commit.
2. Hacer (y revisar) el cambio de código aprobado.
3. Ejecutar:

   ```
   node test/golden/generar.js
   ```

   Reescribe `test/golden/master.json` (formato estable: claves ordenadas, sangría de 2 espacios,
   números con todos sus decimales, `-0` conservado, salto de línea final).
4. Revisar `git diff test/golden/master.json`: **solo** deben aparecer las cifras que la decisión
   de negocio cambia. Cualquier otra diferencia es un efecto colateral no deseado.
5. Ejecutar la suite completa (`npm test`) y registrar el cambio en el registro de anomalías.

## Ficheros

| Fichero | Para qué |
|---|---|
| `master.json` | La salida congelada. No se edita a mano (el test comprueba que está en formato canónico) |
| `casos.js` | El juego fijo de 12 casos y el entorno (TZ y reloj) |
| `flujo.js` | Ejecuta los casos contra el código real y devuelve la salida completa |
| `canonico.js` | Formato estable del master y comparación en profundidad con mensajes por caso y campo |
| `generar.js` | Regenera `master.json` (solo con decisión de negocio, ver arriba) |
