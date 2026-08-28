# Contrato: Servicio y UI de exportación ZIP

**Rama**: `003-exportar-zip` | **Fecha**: 2026-08-27

Contratos internos de la SPA (no hay API externa). Definen las interfaces que el servicio de
exportación expone y cómo el componente `PresupuestosPage` las consume.

## Contrato del servicio de PDF (refactor)

`src/services/pdf.ts`

```ts
// NUEVO: construye el documento sin descargarlo (reutilizable por PDF individual y por ZIP).
export function construirDocumentoPDF(presupuesto: Presupuesto): jsPDF

// EXISTENTE (mismo comportamiento externo): ahora delega en el builder y descarga.
export function generarDocumentoPDF(presupuesto: Presupuesto): void
//   = { const doc = construirDocumentoPDF(p); doc.save(`presupuesto_${...}.pdf`) }
```

**Garantía**: el `jsPDF` devuelto por `construirDocumentoPDF` produce bytes idénticos a los que
`generarDocumentoPDF` guardaría para el mismo presupuesto (RF-003, CE-003).

## Contrato de utilidades

`src/utils/nombreArchivo.ts`

```ts
// Sustituye caracteres no válidos para nombres de fichero, colapsa espacios,
// recorta extremos y nunca devuelve cadena vacía (fallback a "sin-nombre").
export function sanearNombreArchivo(nombre: string): string
```

`src/utils/dates.ts` (añadir)

```ts
// Fecha LOCAL del equipo en formato AAAA-MM-DD (no UTC). Para el nombre del .zip (RF-006).
export function fechaLocalISO(fecha?: Date): string
```

## Contrato del servicio de exportación

`src/services/exportacion.ts`

```ts
export interface ResultadoExportacion {
  ok: boolean
  motivo?: 'sin-numerados' | 'fallo-pdf' | 'error'
  mensaje?: string
  nombreZip?: string
}

export type OnProgreso = (generados: number, total: number) => void

// Construye el .zip en memoria (PDFs + datos.json), y SOLO si todo va bien, dispara la descarga.
// Operación de solo lectura y atómica.
export async function exportarTodoZip(onProgreso?: OnProgreso): Promise<ResultadoExportacion>

// (Auxiliar testeable, sin efectos de descarga) construye el Blob del zip o lanza/aborta.
export async function construirZip(
  onProgreso?: OnProgreso,
): Promise<{ blob: Blob; nombreZip: string }>

// (Auxiliar testeable) construye el objeto datos.json a partir del storage actual.
export function construirDatosJson(): object
```

### Comportamiento esperado de `exportarTodoZip`

| Precondición | Resultado |
|--------------|-----------|
| 0 presupuestos numerados | `{ ok: false, motivo: 'sin-numerados', mensaje: 'No hay nada que exportar' }`, sin descarga |
| ≥1 numerados, todos generan PDF | Descarga `presupuestospro-copia-AAAA-MM-DD.zip`; `{ ok: true, nombreZip }` |
| Falla la generación de algún PDF | Aborta todo; `{ ok: false, motivo: 'fallo-pdf', mensaje: <aviso> }`, sin descarga |
| Cualquier caso | No se modifica `localStorage` (solo lectura) |

### Progreso
`onProgreso(generados, total)` se invoca tras generar cada PDF (`generados` de `1..total`),
para alimentar la barra con contador real (RF-012, CE-006).

## Contrato de UI (`PresupuestosPage.tsx`)

- **Botón**: "Exportar todo (.zip)" en la cabecera de la página (`.page-header`), junto a
  "Nuevo presupuesto" (RF-001).
- **Sin numerados**: al pulsar, mostrar un **tooltip** con "No hay nada que exportar" y no
  descargar (RF-011). (El botón puede seguir clicable para poder mostrar el aviso.)
- **Durante la exportación**: mostrar una **barra de progreso** con texto de contador real
  ("X de N") mientras `onProgreso` avanza; deshabilitar el botón para evitar dobles clics.
- **Éxito**: la descarga se dispara automáticamente; la barra desaparece al terminar.
- **Fallo de PDF**: mostrar aviso claro en español; no se descarga nada.
- **Invariante**: tras exportar, la lista y los datos permanecen exactamente igual (RF-009, CE-007).
- **Idioma**: todos los textos en español de España (RF-013).

## Estados de UI (resumen)

```text
inactivo --click, hay numerados--> exportando(0/N)
exportando(k/N) --onProgreso--> exportando(k+1/N)
exportando(N/N) --zip listo--> descarga --> inactivo
inactivo --click, 0 numerados--> tooltip "No hay nada que exportar" --> inactivo
exportando(*) --fallo PDF--> aviso error --> inactivo (sin descarga)
```
