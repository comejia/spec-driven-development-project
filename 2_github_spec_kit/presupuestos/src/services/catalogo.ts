import type { Servicio } from '../types'
import { getItem, setItem } from '../storage/storage'
import { generarId } from '../utils/uuid'

const STORAGE_KEY = 'catalogo'

export function cargarCatalogo(): Servicio[] {
  return getItem<Servicio[]>(STORAGE_KEY) ?? []
}

export function guardarCatalogo(servicios: Servicio[]): void {
  setItem(STORAGE_KEY, servicios)
}

export function crearServicio(nombre: string, precio: number): { ok: boolean; error?: string; servicio?: Servicio } {
  const servicios = cargarCatalogo()

  const nombreNormalizado = nombre.trim().toLowerCase()
  const duplicado = servicios.some((s) => s.nombre.trim().toLowerCase() === nombreNormalizado)

  if (duplicado) {
    return { ok: false, error: 'Ya existe un servicio con ese nombre' }
  }

  const nuevoServicio: Servicio = {
    id: generarId(),
    nombre: nombre.trim(),
    precio,
  }

  servicios.push(nuevoServicio)
  guardarCatalogo(servicios)

  return { ok: true, servicio: nuevoServicio }
}

export function editarServicio(id: string, nombre: string, precio: number): { ok: boolean; error?: string } {
  const servicios = cargarCatalogo()

  const nombreNormalizado = nombre.trim().toLowerCase()
  const duplicado = servicios.some(
    (s) => s.id !== id && s.nombre.trim().toLowerCase() === nombreNormalizado
  )

  if (duplicado) {
    return { ok: false, error: 'Ya existe un servicio con ese nombre' }
  }

  const index = servicios.findIndex((s) => s.id === id)
  if (index === -1) {
    return { ok: false, error: 'Servicio no encontrado' }
  }

  servicios[index] = { id, nombre: nombre.trim(), precio }
  guardarCatalogo(servicios)

  return { ok: true }
}

export function eliminarServicio(id: string): void {
  const servicios = cargarCatalogo()
  const filtrados = servicios.filter((s) => s.id !== id)
  guardarCatalogo(filtrados)
}
