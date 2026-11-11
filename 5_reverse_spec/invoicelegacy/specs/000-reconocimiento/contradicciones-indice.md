# Índice de contradicciones (conceptos implementados más de una vez)

Documento de solo lectura (Constitución, Principios I, III y IV). Ninguna contradicción
se corrige y **ninguna decide cuál implementación es la correcta**: son preguntas de
negocio. Cada una acaba como entrada del registro de anomalías y como pregunta del guion
de entrevista (sección «Para el registro…» de cada ficha).

## 1. Método de búsqueda

1. Pistas de `flujo-factura.md` §6: «dos caminos hacen lo mismo con código distinto»
   (prorrateo, vencimiento, texto de descuento, grabación de líneas, año de numeración).
2. `grep` sobre todo el código de producto (sin `node_modules`, `.specify`, `.kiro`) de:
   `toFixed|Math.round`, `|| 30|21`, `replace(',', '.')`, `parseInt|parseFloat`, `activo`,
   `getFullYear|new Date|hoy`, `split('-')|slice|'-31'|LIKE`, literales de estado y serie,
   `SUM|COUNT`, nombres de meses.
3. Lectura de todas las vistas y rutas para comparar pantalla y servidor.
4. Cuantificación con funciones puras (**Entorno**) y consultas de solo lectura (**BD**).

## 2. Contradicciones con divergencia (una ficha por cada una)

| N.º | Concepto duplicado | Estado | Divergencia más clara (cuantificada) | Ficha |
|---|---|---|---|---|
| 01 | Prorrateo de cuota parcial (30 días fijos / días reales) | **Activa** | Hasta 6,67 € por 100 € de cuota (feb.); 3,23 € (31 días); 0 en 30 días. Real: contrato 4, +3,00 € de base (+3,63 € con IVA) | [`contradiccion-01-prorrateo-cuota-parcial.md`](contradiccion-01-prorrateo-cuota-parcial.md) |
| 02 | Valores por defecto (plazo 30 días e IVA 21) escritos 3-5 veces | Latente | Si `VENCIMIENTO_DIAS` pasara a 45: 15 días de diferencia entre alta manual y remesa | [`contradiccion-02-valores-por-defecto-duplicados.md`](contradiccion-02-valores-por-defecto-duplicados.md) |
| 03 | Redondear, mostrar y leer un importe | Activa (formato) / latente (redondeo, lectura) | 4,2 % de valores de 3 decimales difieren; `3032.85` frente a `2.756,38`; `1.210,00` leído como 1,21 | [`contradiccion-03-redondeo-formato-y-lectura-de-importes.md`](contradiccion-03-redondeo-formato-y-lectura-de-importes.md) |
| 04 | Convención de fechas (local / UTC→local / texto) | Activa según zona horaria | 730/730 fechas un día antes en UTC−3; 0/730 en Madrid | [`contradiccion-04-convencion-de-fechas.md`](contradiccion-04-convencion-de-fechas.md) |
| 05 | «Año» de la factura (reloj / fecha / informe) | Latente | Remesa de diciembre lanzada en enero: 3 facturas fechadas 2026 y numeradas 2027 | [`contradiccion-05-ano-de-la-factura.md`](contradiccion-05-ano-de-la-factura.md) |
| 06 | Importes de cabecera frente a líneas | **Activa en datos reales** | 6 de 9 facturas; IVA 2026: 783,78 € (CSV) frente a 647,98 € (informe) | [`contradiccion-06-importes-de-cabecera-y-de-lineas.md`](contradiccion-06-importes-de-cabecera-y-de-lineas.md) |
| 07 | «Emitida / pendiente de cobro» | **Activa** | Panel: 9 «emitidas», 4 «pendientes», importe de 3 (3.032,85 € frente a 2.910,62 €) | [`contradiccion-07-factura-pendiente-de-cobro.md`](contradiccion-07-factura-pendiente-de-cobro.md) |
| 08 | Cliente/artículo «activo» (pantalla frente a servidor y remesa) | Latente | Remesa facturaría 108,90 € a un cliente de baja | [`contradiccion-08-cliente-activo-y-facturable.md`](contradiccion-08-cliente-activo-y-facturable.md) |
| 09 | Qué se puede cobrar o rectificar (vista frente a endpoint) | Activa por petición directa | Rectificables: 3 por pantalla frente a 7 por endpoint | [`contradiccion-09-que-factura-se-puede-cobrar-o-rectificar.md`](contradiccion-09-que-factura-se-puede-cobrar-o-rectificar.md) |
| 10 | Grabar una factura (3 copias, 3 tratamientos de error) | Activa | 2 de las 7 escrituras (ambas en C) sin control de error; constancia del descuento solo en A | [`contradiccion-10-grabar-una-factura-tres-copias.md`](contradiccion-10-grabar-una-factura-tres-copias.md) |

## 3. Duplicaciones revisadas **sin** divergencia observable

Se registran para que quede constancia de que se buscaron y no son contradicciones:

| Duplicación | Dónde | Por qué no diverge |
|---|---|---|
| `calcularFactura` en alta manual y remesa | `facturas.js:66`; `remesa_mensual.js:55` | Misma función, mismos importes (la diferencia es de trazabilidad: ficha 10) |
| `siguienteNumero` en los tres caminos | `facturas.js:71,138`; `remesa_mensual.js:57` | Misma función; solo cambia la serie |
| Bloque de formato «año-mes-día» | `util.js:14` y `:25` | Idéntico (la diferencia de convención está en la entrada, ficha 04) |
| `parseFloat(('' + x).replace(',', '.'))` | `facturas.js:59-60`; `contratos.js:19`; `articulos.js:19` | Cuatro copias idénticas (la asimetría con el formato de salida está en la ficha 03) |
| `parseInt(x.split('-')[2], 10)` | `calculo.js:96-97`; `remesa_mensual.js:48-49` | Idénticas; difieren en lo que hacen después (ficha 01) |
| `new Date().getFullYear()` | `numeracion.js:15`; `informes.js:10,15,35` | Mismo valor; la contradicción está en lo que se compara (ficha 05) |
| `validarNIF` | `clientes.js:18` (única llamada) | No se repite en ningún otro sitio: el NIF no se valida al facturar ni al exportar |
| Lista de tipos de IVA 21/10/4 | `factura_nueva.ejs:18`, `articulos.ejs:18` | Mismos valores en ambas pantallas (el servidor acepta cualquiera: RN-13) |
| Nombres de mes | `remesa_mensual.js:80-84` (única copia) | Solo existe en un sitio |

## 4. Observaciones transversales

- **El patrón común** es que una regla nació en un sitio (alta manual, 2017) y se
  **copió y adaptó** al añadir caminos posteriores (informes en 2019, rectificativas
  tras 2020, remesa en 2021) en vez de reutilizar la función original; las copias se
  alejaron de forma silenciosa. Es una hipótesis basada en el estilo y la cronología;
  no hay historial de git del producto.
- **Por qué no se han detectado**: la divergencia depende del dato (mes de 28 o 31
  días, cambio de año, rectificativas, bajas de clientes) y la BD actual no contiene
  esos casos, excepto las fichas 06 y 07, donde sí se manifiestan en los datos
  presentes.
- **Qué no se ha podido verificar**: ninguna escritura se ha ejecutado
  (Constitución, «Datos sensibles»); todos los escenarios de cambio de año, baja de
  cliente y fallo parcial son deducciones del código.

## 5. Preguntas nuevas (QC-01 a QC-26)

Las preguntas de las fichas llevan el prefijo `QC-` (contradicciones) para no colisionar
con la serie `Q-01` a `Q-20` de `reglas-de-negocio.md`, que es independiente. Al
integrarlas en el guion de entrevista conviene fusionar las que se solapan (p. ej.
`QC-03`/`Q-05` sobre febrero completo, `QC-02`/`Q-09` sobre la doble facturación de una
baja, `QC-16`/`Q-18` sobre cabeceras y líneas, `QC-22`/`Q-16` sobre rectificar una cobrada).
