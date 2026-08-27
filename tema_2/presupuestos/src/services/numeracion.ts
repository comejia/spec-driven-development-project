import type { Contador } from '../types'
import { getItem, setItem } from '../storage/storage'
import { anioActual } from '../utils/dates'

const STORAGE_KEY = 'contador'

export function cargarContador(): Contador {
  const contador = getItem<Contador>(STORAGE_KEY)
  if (!contador) {
    return { anio: anioActual(), ultimoNumero: 0 }
  }
  return contador
}

export function siguienteNumero(): string {
  const anio = anioActual()
  let contador = cargarContador()

  // Reset on year change
  if (contador.anio !== anio) {
    contador = { anio, ultimoNumero: 0 }
  }

  contador.ultimoNumero += 1
  setItem(STORAGE_KEY, contador)

  const numeroFormateado = String(contador.ultimoNumero).padStart(3, '0')
  return `${anio}-${numeroFormateado}`
}
