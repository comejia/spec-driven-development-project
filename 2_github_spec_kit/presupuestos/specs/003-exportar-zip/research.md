# Investigación (Phase 0): Exportar todos los presupuestos en un .zip

**Rama**: `003-exportar-zip` | **Fecha**: 2026-08-27

Este documento resuelve las incógnitas técnicas antes del diseño. Cada decisión se toma
bajo el principio constitucional de **simplicidad ante todo** y **cero alcance fantasma**.

## Decisión 1: Librería de compresión ZIP en cliente

- **Decisión**: Añadir **JSZip** (`jszip`) como dependencia de producción, con versión fijada.
- **Racional**: Es el estándar de facto para generar `.zip` 100 % en el navegador, sin backend
  (alineado con la arquitectura sin servidor del proyecto). API sencilla (`zip.file()`,
  `zip.generateAsync()`), soporta blobs binarios (los PDF), y su `generateAsync` expone un
  callback de progreso (`metadata.percent`) útil para la barra de progreso (RF-012). Maduro y
  ampliamente usado.
- **Alternativas consideradas**:
  - `fflate`: más ligero y rápido, pero API de más bajo nivel; el ahorro no justifica la
    complejidad añadida para este caso (simplicidad).
  - Implementación manual del formato ZIP: descartada por complejidad y riesgo de corrupción.
  - `client-zip`: streaming eficiente, pero orientado a descargas por streaming y con menos
    control de progreso agregado sobre generación de PDF; JSZip encaja mejor.

## Decisión 2: Reutilizar el PDF existente sin duplicar lógica

- **Decisión**: Refactorizar `src/services/pdf.ts` para **separar construcción de guardado**:
  extraer una función `construirDocumentoPDF(presupuesto): jsPDF` que contenga toda la lógica
  actual de maquetación, y dejar `generarDocumentoPDF(presupuesto)` como un envoltorio que llama
  a `construirDocumentoPDF` y ejecuta `doc.save(...)`. La exportación ZIP llamará a
  `construirDocumentoPDF` y obtendrá los bytes con `doc.output('blob')`.
- **Racional**: Garantiza que cada PDF del `.zip` sea **idéntico al céntimo** al individual
  (RF-003, CE-003), porque ambos caminos usan exactamente el mismo código de generación. Evita
  duplicar la maquetación (riesgo de divergencia). Cambio mínimo y de bajo riesgo sobre el código
  existente.
- **Alternativas consideradas**:
  - Duplicar la lógica de PDF para la ruta ZIP: rechazado — viola simplicidad y garantiza
    divergencia futura entre PDF individual y PDF del ZIP.
  - Capturar la descarga individual y reempaquetarla: inviable en navegador (no hay acceso al
    archivo descargado).

## Decisión 3: Contenido y estructura de `datos.json`

- **Decisión**: `datos.json` reflejará **exactamente** los objetos tal como se almacenan hoy en
  `localStorage`, agrupando las claves internas del dominio:
  - `presupuestos` (clave `presupuestospro_presupuestos`)
  - `catalogo` (clave `presupuestospro_catalogo`)
  - `perfil` (clave `presupuestospro_perfil`, incluye `logo` como Data URL base64)
  - `contador` (clave `presupuestospro_contador`)
  - **NO** incluye `clientes` (clave `presupuestospro_clientes`) — exclusión explícita del spec.
  Se añade un envoltorio mínimo con metadatos: `{ version: 1, exportadoEl: <ISO>, datos: { ... } }`.
- **Racional**: La aclaración registrada exige que el contenido permita "reconstruir la aplicación
  tal cual, sin transformaciones ni pérdida de datos". El `contador` es parte del estado interno
  imprescindible para que, tras una futura restauración, la numeración continúe correctamente sin
  colisiones; omitirlo rompería la fidelidad de la copia. El envoltorio `version` protege la futura
  funcionalidad de importar/restaurar (fuera de alcance aquí) sin añadir complejidad hoy.
- **Nota de alcance**: RF-004 enumera "presupuestos, catálogo y perfil". Se interpreta esa lista
  como el contenido de negocio visible; `contador` se incluye como estado técnico necesario para la
  restauración fiel que la aclaración exige. Los `clientes` se excluyen explícitamente.
- **Alternativas consideradas**:
  - JSON sin envoltorio de versión: descartado — dificultaría una importación robusta futura.
  - Incluir clientes: prohibido por el spec (fuera de alcance).

## Decisión 4: Nombres de archivo y saneado de caracteres

- **Decisión**:
  - Nombre del `.zip`: `presupuestospro-copia-AAAA-MM-DD.zip` con **fecha local** del equipo
    (no UTC). Se derivará de `new Date()` usando componentes locales (`getFullYear`,
    `getMonth()+1`, `getDate()`), con relleno a 2 dígitos.
  - Nombre de cada PDF: `"<numero> - <cliente saneado>.pdf"`.
  - Saneado: reemplazar los caracteres no válidos para nombres de fichero
    (`\ / : * ? " < > |` y caracteres de control) por un guion o espacio, colapsar espacios y
    recortar extremos. Nunca dejar el nombre vacío.
- **Racional**: Cumple RF-006/RF-007/RF-008 y el caso "Diseño/Web S.L.". La fecha local evita el
  desfase de día que introduciría `toISOString()` (que usa UTC). El saneado garantiza que el `.zip`
  se descomprima sin errores en el explorador del sistema (CE-005).
- **Nota**: `utils/dates.ts::hoy()` usa `toISOString()` (UTC). Para el nombre del ZIP se usará una
  utilidad local nueva (p. ej. `fechaLocalISO()`) para respetar RF-006; no se modifica `hoy()` para
  no alterar el comportamiento existente de emisión de presupuestos.

## Decisión 5: Barra de progreso con contador real

- **Decisión**: La barra mostrará progreso real basado en **PDF generados** (p. ej. "12 de 50").
  El servicio de exportación aceptará un callback `onProgreso(generados, total)` que el componente
  UI usará para actualizar el estado. El bucle de generación de PDF es la fase dominante y medible;
  la compresión final de JSZip se refleja como tramo final opcional.
- **Racional**: Cumple RF-012 y CE-006 (contador real). Generar PDF secuencialmente permite reportar
  progreso determinista y sencillo, evitando complejidad de paralelismo (simplicidad).
- **Alternativas consideradas**:
  - Indicador indeterminado: rechazado por la aclaración (se pidió contador real).
  - Paralelizar generación de PDF con workers: complejidad innecesaria para el volumen esperado
    (hasta 200), viola simplicidad.

## Decisión 6: Manejo de fallo y atomicidad (solo lectura)

- **Decisión**: La exportación se ejecuta como **solo lectura** (no escribe en `localStorage`) y es
  **atómica**: se generan todos los PDF y se construye el `.zip` en memoria; solo si **todo** tiene
  éxito se dispara la descarga. Si la generación de cualquier PDF lanza error, se **aborta** toda la
  operación, no se descarga nada y se muestra un aviso claro.
- **Racional**: Cumple RF-009 (solo lectura, CE-007) y RF-014 (abortar ante fallo, nunca copia
  parcial). Construir todo en memoria antes de descargar hace trivial la atomicidad.
- **Alternativas consideradas**:
  - Descargar parcial avisando de fallos: rechazado por la aclaración (copia parcial silenciosa es
    peor que ninguna).

## Decisión 7: Disparo de la descarga en el navegador

- **Decisión**: Obtener el `Blob` del `.zip` desde `zip.generateAsync({ type: 'blob' }, onProgreso)`,
  crear una URL con `URL.createObjectURL`, un `<a download>` temporal y hacer clic programático;
  liberar la URL con `URL.revokeObjectURL` después.
- **Racional**: Patrón estándar y simple para descargas de blobs en el navegador, coherente con cómo
  `jsPDF.save()` descarga hoy. Sin dependencias extra.

## Resumen de dependencias nuevas

| Dependencia | Uso | Notas |
|-------------|-----|-------|
| `jszip` (versión fijada) | Construir el `.zip` en cliente y reportar progreso | Producción |

Sin NEEDS CLARIFICATION pendientes.
