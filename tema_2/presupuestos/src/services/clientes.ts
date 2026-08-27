import type { Cliente } from '../types'
import { getItem, setItem } from '../storage/storage'
import { generarId } from '../utils/uuid'

const STORAGE_KEY = 'clientes'

export function cargarClientes(): Cliente[] {
  return getItem<Cliente[]>(STORAGE_KEY) ?? []
}

export function guardarClientes(clientes: Cliente[]): void {
  setItem(STORAGE_KEY, clientes)
}

export function crearCliente(data: Omit<Cliente, 'id'>): Cliente {
  const clientes = cargarClientes()

  const nuevoCliente: Cliente = {
    id: generarId(),
    ...data,
  }

  clientes.push(nuevoCliente)
  guardarClientes(clientes)

  return nuevoCliente
}

export function editarCliente(id: string, data: Omit<Cliente, 'id'>): void {
  const clientes = cargarClientes()
  const index = clientes.findIndex((c) => c.id === id)

  if (index === -1) return

  clientes[index] = { id, ...data }
  guardarClientes(clientes)
}
