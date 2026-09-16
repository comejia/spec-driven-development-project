# Modelo de datos (Phase 1): Exportar todos los presupuestos en un .zip

**Rama**: `003-exportar-zip` | **Fecha**: 2026-08-27

Esta funcionalidad **no crea nuevas entidades persistentes** ni modifica el modelo existente
(operación de solo lectura, RF-009). Define estructuras **efímeras** que existen solo durante la
exportación y la forma exacta del archivo `datos.json` incluido en el `.zip`.

## Entidades de dominio reutilizadas (sin cambios)

Definidas en `src/types.ts`, se leen tal cual desde `localStorage`:

- `Presupuesto` (clave `presupuestospro_presupuestos`) — solo se exportan los de `estado === 'numerado'`.
- `Servicio[]` / catálogo (clave `presupuestospro_catalogo`).
- `Perfil` (clave `presupuestospro_perfil`) — incluye `logo` (Data URL base64).
- `Contador` (clave `presupuestospro_contador`) — estado interno para restauración fiel.
- `Cliente[]` (clave `presupuestospro_clientes`) — **excluido** de la exportación.

## Estructura del archivo `datos.json`

Refleja exactamente el estado interno restaurable, con un envoltorio mínimo de metadatos.

```jsonc
{
  "version": 1,                       // versión del formato de copia (protege importación futura)
  "exportadoEl": "2026-03-15T10:30:00.000Z", // marca de tiempo de la exportación (ISO)
  "datos": {
    "presupuestos": [ /* Presupuesto[] tal como se almacena */ ],
    "catalogo":     [ /* Servicio[]  tal como se almacena */ ],
    "perfil":       { /* Perfil con logo, o null si no existe */ },
    "contador":     { /* Contador { anio, ultimoNumero } */ }
  }
}
```

**Reglas**:
- El contenido de `datos` refleja las claves internas **sin transformación** (restauración tal cual).
- **No** se incluye `clientes` (fuera de alcance, RF-004 / Fuera de alcance del spec).
- Se serializa con `JSON.stringify(obj, null, 2)` para legibilidad.
- `perfil` puede ser `null` si el freelancer no lo ha completado; los presupuestos numerados llevan
  su propio `perfilSnapshot`, así que la generación de PDF no depende de este campo.

## Estructuras efímeras (solo en memoria durante la exportación)

### `EntradaPDF`
Representa un PDF listo para empaquetar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombreArchivo` | `string` | `"<numero> - <cliente saneado>.pdf"` (RF-007, RF-008) |
| `blob` | `Blob` | Bytes del PDF, obtenidos de `doc.output('blob')` sobre el builder reutilizado |

### `ResultadoExportacion`
Resultado que el servicio devuelve al componente UI.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | `true` si el `.zip` se construyó y descargó; `false` si se abortó |
| `motivo` | `'sin-numerados' \| 'fallo-pdf' \| 'error'` (opcional) | Causa cuando `ok === false` |
| `mensaje` | `string` (opcional) | Texto en español para mostrar al usuario |
| `nombreZip` | `string` (opcional) | Nombre del `.zip` generado cuando `ok === true` |

### Progreso
Callback `onProgreso(generados: number, total: number)` invocado tras generar cada PDF
(contador real para RF-012 / CE-006).

## Reglas de validación / selección

- **Selección**: incluir únicamente `presupuestos.filter(p => p.estado === 'numerado')`.
- **Vacío**: si no hay numerados, no se construye ni descarga nada; el servicio devuelve
  `{ ok: false, motivo: 'sin-numerados' }` y la UI muestra el tooltip (RF-011, CE-004).
- **Saneado de nombre**: caracteres `\ / : * ? " < > |` y de control → sustituidos; espacios
  colapsados; nombre nunca vacío (RF-008, CE-005).
- **Unicidad**: el `numero` es único (supuesto del spec), por lo que los nombres de PDF no colisionan.
- **Atomicidad / fallo**: si `construirDocumentoPDF` lanza para algún presupuesto, abortar toda la
  operación; devolver `{ ok: false, motivo: 'fallo-pdf' }`; no descargar nada (RF-014).
- **Solo lectura**: la exportación no llama a ningún `guardar*` ni `setItem` (RF-009, CE-007).

## Nombres de archivo (derivados)

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Archivo `.zip` | `presupuestospro-copia-AAAA-MM-DD.zip` (fecha local) | `presupuestospro-copia-2026-03-15.zip` |
| PDF por presupuesto | `<numero> - <cliente saneado>.pdf` | `2026-001 - Estudio García.pdf` |
| Archivo de datos | `datos.json` (fijo) | `datos.json` |
