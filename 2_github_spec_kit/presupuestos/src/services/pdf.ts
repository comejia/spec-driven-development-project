import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Presupuesto } from '../types'
import { calcularDesglose } from './calculos'
import { cargarClientes } from './clientes'
import { formatearMoneda } from '../utils/currency'
import { isoAEspanol } from '../utils/dates'

// Professional color palette
const COLORS = {
  primary: [30, 64, 175] as [number, number, number],      // #1e40af
  primaryLight: [219, 234, 254] as [number, number, number], // #dbeafe
  text: [30, 41, 59] as [number, number, number],           // #1e293b
  textSecondary: [71, 85, 105] as [number, number, number], // #475569
  textMuted: [148, 163, 184] as [number, number, number],   // #94a3b8
  border: [226, 232, 240] as [number, number, number],      // #e2e8f0
  danger: [185, 28, 28] as [number, number, number],        // #b91c1c
  tableHead: [248, 250, 252] as [number, number, number],   // #f8fafc
}

export function construirDocumentoPDF(presupuesto: Presupuesto): jsPDF {
  const doc = new jsPDF()

  const perfil = presupuesto.perfilSnapshot
  const cliente = presupuesto.clienteSnapshot ?? cargarClientes().find((c) => c.id === presupuesto.clienteId) ?? null

  if (!perfil || !cliente) {
    throw new Error(
      `No se puede generar el PDF del presupuesto ${presupuesto.numero ?? presupuesto.id}: faltan datos de perfil o cliente`,
    )
  }

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 20
  const marginRight = 20
  const contentRight = pageWidth - marginRight

  // --- T017: Header with logo and freelancer info ---

  let cursorY = 20

  // Logo - top left, well-dimensioned
  if (perfil.logo) {
    try {
      doc.addImage(perfil.logo, 'PNG', marginLeft, 15, 35, 18)
    } catch {
      // Skip logo if invalid
    }
  }

  // Freelancer info - top right, clear typography
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(perfil.nombre, contentRight, cursorY, { align: 'right' })
  cursorY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)
  doc.text(`NIF: ${perfil.nif}`, contentRight, cursorY, { align: 'right' })
  cursorY += 4.5
  doc.text(perfil.direccion, contentRight, cursorY, { align: 'right' })
  cursorY += 4.5
  doc.text(`${perfil.telefono} · ${perfil.email}`, contentRight, cursorY, { align: 'right' })

  // Separator line
  cursorY = 42
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(marginLeft, cursorY, contentRight, cursorY)

  cursorY += 10

  // --- T017: Presupuesto number and dates - PROMINENT ---

  doc.setTextColor(...COLORS.primary)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`Presupuesto Nº ${presupuesto.numero ?? ''}`, marginLeft, cursorY)

  // Dates - right aligned, same line
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)
  if (presupuesto.fechaEmision) {
    doc.text(`Emisión: ${isoAEspanol(presupuesto.fechaEmision)}`, contentRight, cursorY - 4, { align: 'right' })
  }
  if (presupuesto.fechaValidez) {
    doc.text(`Validez: ${isoAEspanol(presupuesto.fechaValidez)}`, contentRight, cursorY + 1, { align: 'right' })
  }

  cursorY += 14

  // --- T017: Client info - differentiated block ---

  doc.setFillColor(...COLORS.primaryLight)
  doc.roundedRect(marginLeft, cursorY - 4, contentRight - marginLeft, 28, 2, 2, 'F')

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  doc.text('CLIENTE', marginLeft + 6, cursorY + 1)

  cursorY += 6
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(cliente.nombre, marginLeft + 6, cursorY)

  cursorY += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)
  if (cliente.nifCif) {
    doc.text(`NIF/CIF: ${cliente.nifCif}`, marginLeft + 6, cursorY)
    cursorY += 4.5
  }
  doc.text(cliente.direccion, marginLeft + 6, cursorY)
  cursorY += 4.5
  doc.text(`${cliente.email} · ${cliente.telefono}`, marginLeft + 6, cursorY)

  cursorY += 14

  // --- T018: Table of lines - professional with headers ---

  const tableBody = presupuesto.lineas.map((linea) => {
    const importe = linea.cantidad * linea.precioUnitario
    return [
      linea.descripcion,
      String(linea.cantidad),
      formatearMoneda(linea.precioUnitario),
      formatearMoneda(importe),
    ]
  })

  autoTable(doc, {
    startY: cursorY,
    head: [['Descripción', 'Cantidad', 'Precio unitario', 'Importe']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.tableHead,
      textColor: COLORS.textSecondary,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      lineWidth: { bottom: 0.5 },
      lineColor: COLORS.border,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
      cellPadding: { top: 3.5, bottom: 3.5, left: 6, right: 6 },
      lineWidth: { bottom: 0.2 },
      lineColor: COLORS.border,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    margin: { left: marginLeft, right: marginRight },
  })

  // --- T019: Desglose - professional hierarchy ---

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  const desgloseX = 125
  const desgloseRight = contentRight

  const desglose = calcularDesglose(presupuesto.lineas, presupuesto.retencion, cliente.tipo)

  let totalsY = finalY
  doc.setFontSize(9)

  // Subtotals - normal weight
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)
  doc.text('Base imponible', desgloseX, totalsY)
  doc.setTextColor(...COLORS.text)
  doc.text(formatearMoneda(desglose.baseImponible), desgloseRight, totalsY, { align: 'right' })
  totalsY += 6

  doc.setTextColor(...COLORS.textSecondary)
  doc.text('IVA (21%)', desgloseX, totalsY)
  doc.setTextColor(...COLORS.text)
  doc.text(formatearMoneda(desglose.iva), desgloseRight, totalsY, { align: 'right' })
  totalsY += 6

  // Retention - clearly differentiated
  if (desglose.aplicaRetencion) {
    doc.setTextColor(...COLORS.danger)
    doc.text(`Retención IRPF (${desglose.porcentajeRetencion}%)`, desgloseX, totalsY)
    doc.text(`-${formatearMoneda(desglose.retencionIRPF)}`, desgloseRight, totalsY, { align: 'right' })
    totalsY += 6
  }

  // Separator line before total
  totalsY += 2
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.8)
  doc.line(desgloseX, totalsY, desgloseRight, totalsY)
  totalsY += 7

  // Total - larger, bold, prominent
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.text)
  doc.text('TOTAL', desgloseX, totalsY)
  doc.setTextColor(...COLORS.primary)
  doc.text(formatearMoneda(desglose.total), desgloseRight, totalsY, { align: 'right' })

  return doc
}

/**
 * Genera el PDF del presupuesto y lo descarga (comportamiento existente).
 * Delega la construcción en construirDocumentoPDF para garantizar que el PDF
 * del ZIP sea idéntico al individual (RF-003, CE-003).
 */
export function generarDocumentoPDF(presupuesto: Presupuesto): void {
  const doc = construirDocumentoPDF(presupuesto)
  const fileName = `presupuesto_${presupuesto.numero ?? presupuesto.id}.pdf`
  doc.save(fileName)
}
