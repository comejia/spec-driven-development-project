import type { Presupuesto } from '../types'
import { getItem, setItem } from '../storage/storage'
import { generarId } from '../utils/uuid'
import { hoy, sumarDias } from '../utils/dates'
import { cargarPerfil, esPerfilCompleto } from './perfil'
import { cargarClientes } from './clientes'
import { siguienteNumero } from './numeracion'
import { generarDocumentoPDF } from './pdf'

const STORAGE_KEY = 'presupuestos'

export function cargarPresupuestos(): Presupuesto[] {
  return getItem<Presupuesto[]>(STORAGE_KEY) ?? []
}

export function guardarPresupuestos(presupuestos: Presupuesto[]): void {
  setItem(STORAGE_KEY, presupuestos)
}

export function crearPresupuesto(clienteId: string): Presupuesto {
  const presupuestos = cargarPresupuestos()

  const nuevoPresupuesto: Presupuesto = {
    id: generarId(),
    clienteId,
    clienteSnapshot: null,
    perfilSnapshot: null,
    lineas: [],
    retencion: 'ninguna',
    estado: 'borrador',
    numero: null,
    fechaEmision: null,
    fechaValidez: null,
  }

  presupuestos.push(nuevoPresupuesto)
  guardarPresupuestos(presupuestos)

  return nuevoPresupuesto
}

export function actualizarPresupuesto(presupuesto: Presupuesto): void {
  const presupuestos = cargarPresupuestos()
  const index = presupuestos.findIndex((p) => p.id === presupuesto.id)

  if (index === -1) {
    presupuestos.push(presupuesto)
  } else {
    presupuestos[index] = presupuesto
  }

  guardarPresupuestos(presupuestos)
}

export function generarPDF(presupuestoId: string): { ok: boolean; error?: string } {
  const presupuestos = cargarPresupuestos()
  const index = presupuestos.findIndex((p) => p.id === presupuestoId)

  if (index === -1) {
    return { ok: false, error: 'Presupuesto no encontrado' }
  }

  const presupuesto = presupuestos[index]

  if (presupuesto.lineas.length === 0) {
    return { ok: false, error: 'El presupuesto debe tener al menos una línea' }
  }

  const perfil = cargarPerfil()
  if (!esPerfilCompleto(perfil)) {
    return { ok: false, error: 'El perfil del freelance debe estar completo' }
  }

  const clientes = cargarClientes()
  const cliente = clientes.find((c) => c.id === presupuesto.clienteId)
  if (!cliente) {
    return { ok: false, error: 'Cliente no encontrado' }
  }

  // Assign number, dates, snapshots
  const numero = siguienteNumero()
  const fechaEmision = hoy()
  const fechaValidez = sumarDias(fechaEmision, 30)

  presupuesto.numero = numero
  presupuesto.fechaEmision = fechaEmision
  presupuesto.fechaValidez = fechaValidez
  presupuesto.clienteSnapshot = { ...cliente }
  presupuesto.perfilSnapshot = { ...perfil! }
  presupuesto.estado = 'numerado'

  presupuestos[index] = presupuesto
  guardarPresupuestos(presupuestos)

  // Generate and download PDF
  generarDocumentoPDF(presupuesto)

  return { ok: true }
}

export function editarNumerado(presupuestoId: string): Presupuesto {
  const presupuestos = cargarPresupuestos()
  const original = presupuestos.find((p) => p.id === presupuestoId)

  if (!original) {
    throw new Error('Presupuesto no encontrado')
  }

  // Clone to new borrador
  const nuevoBorrador: Presupuesto = {
    id: generarId(),
    clienteId: original.clienteId,
    clienteSnapshot: null,
    perfilSnapshot: null,
    lineas: original.lineas.map((l) => ({ ...l, id: generarId() })),
    retencion: original.retencion,
    estado: 'borrador',
    numero: null,
    fechaEmision: null,
    fechaValidez: null,
  }

  presupuestos.push(nuevoBorrador)
  guardarPresupuestos(presupuestos)

  return nuevoBorrador
}
