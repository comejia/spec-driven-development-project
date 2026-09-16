import JSZip from 'jszip'
import type { Presupuesto, Servicio, Perfil, Contador } from '../types'
import { getItem } from '../storage/storage'
import { construirDocumentoPDF } from './pdf'
import { sanearNombreArchivo } from '../utils/nombreArchivo'
import { fechaLocalISO } from '../utils/dates'

// --- Contratos (contracts/exportacion.md) ---

export interface ResultadoExportacion {
  ok: boolean
  motivo?: 'sin-numerados' | 'fallo-pdf' | 'error'
  mensaje?: string
  nombreZip?: string
}

export type OnProgreso = (generados: number, total: number) => void

interface EntradaPDF {
  nombreArchivo: string
  blob: Blob
}

const MENSAJE_SIN_NUMERADOS = 'No hay nada que exportar'
const MENSAJE_FALLO_PDF =
  'No se pudo generar la copia. No se ha descargado ningún archivo. Inténtalo de nuevo.'

/**
 * Construye el objeto datos.json a partir del estado actual en localStorage.
 * Refleja las claves internas sin transformación (restauración tal cual).
 * NO incluye clientes (fuera de alcance, RF-004).
 */
export function construirDatosJson(): object {
  const presupuestos = getItem<Presupuesto[]>('presupuestos') ?? []
  const catalogo = getItem<Servicio[]>('catalogo') ?? []
  const perfil = getItem<Perfil>('perfil')
  const contador = getItem<Contador>('contador')

  return {
    version: 1,
    exportadoEl: new Date().toISOString(),
    datos: {
      presupuestos,
      catalogo,
      perfil: perfil ?? null,
      contador: contador ?? null,
    },
  }
}

/**
 * Selecciona los presupuestos numerados (los borradores quedan fuera, RF-005).
 */
function seleccionarNumerados(): Presupuesto[] {
  const presupuestos = getItem<Presupuesto[]>('presupuestos') ?? []
  return presupuestos.filter((p) => p.estado === 'numerado')
}

/**
 * Nombre del PDF dentro del .zip: "<numero> - <cliente saneado>.pdf" (RF-007, RF-008).
 */
function nombrePdf(presupuesto: Presupuesto): string {
  const numero = presupuesto.numero ?? presupuesto.id
  const cliente = presupuesto.clienteSnapshot?.nombre ?? 'cliente'
  const base = sanearNombreArchivo(`${numero} - ${cliente}`)
  return `${base}.pdf`
}

/**
 * Genera secuencialmente el PDF de cada presupuesto numerado.
 * Si alguno falla (construirDocumentoPDF lanza), propaga el error para abortar (RF-014).
 * Invoca onProgreso(generados, total) tras generar cada PDF (RF-012).
 */
function generarEntradasPDF(
  numerados: Presupuesto[],
  onProgreso?: OnProgreso,
): EntradaPDF[] {
  const total = numerados.length
  const entradas: EntradaPDF[] = []

  numerados.forEach((presupuesto, i) => {
    const doc = construirDocumentoPDF(presupuesto)
    const blob = doc.output('blob') as Blob
    entradas.push({ nombreArchivo: nombrePdf(presupuesto), blob })
    onProgreso?.(i + 1, total)
  })

  return entradas
}

/**
 * Construye el Blob del .zip en memoria (PDFs + datos.json).
 * Auxiliar testeable, SIN efectos de descarga.
 * Lanza si la generación de cualquier PDF falla (atomicidad, RF-014).
 */
export async function construirZip(
  onProgreso?: OnProgreso,
): Promise<{ blob: Blob; nombreZip: string }> {
  const numerados = seleccionarNumerados()
  const entradas = generarEntradasPDF(numerados, onProgreso)

  const zip = new JSZip()
  for (const entrada of entradas) {
    zip.file(entrada.nombreArchivo, entrada.blob)
  }
  zip.file('datos.json', JSON.stringify(construirDatosJson(), null, 2))

  const blob = await zip.generateAsync({ type: 'blob' })
  const nombreZip = `presupuestospro-copia-${fechaLocalISO()}.zip`
  return { blob, nombreZip }
}

/**
 * Dispara la descarga de un Blob en el navegador (patrón <a download>).
 */
function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exporta todos los presupuestos numerados en un único .zip.
 * Operación de solo lectura y atómica: construye todo en memoria y SOLO si
 * todo va bien dispara la descarga (RF-002, RF-009, RF-014).
 */
export async function exportarTodoZip(
  onProgreso?: OnProgreso,
): Promise<ResultadoExportacion> {
  const numerados = seleccionarNumerados()

  // Caso vacío (RF-011, CE-004)
  if (numerados.length === 0) {
    return { ok: false, motivo: 'sin-numerados', mensaje: MENSAJE_SIN_NUMERADOS }
  }

  let blob: Blob
  let nombreZip: string
  try {
    ;({ blob, nombreZip } = await construirZip(onProgreso))
  } catch {
    // Atomicidad: fallo al generar algún PDF → abortar sin descargar (RF-014)
    return { ok: false, motivo: 'fallo-pdf', mensaje: MENSAJE_FALLO_PDF }
  }

  descargarBlob(blob, nombreZip)
  return { ok: true, nombreZip }
}
