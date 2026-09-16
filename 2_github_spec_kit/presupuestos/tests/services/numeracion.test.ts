import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cargarContador, siguienteNumero } from '../../src/services/numeracion'
import { anioActual } from '../../src/utils/dates'

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  length: 0,
  key: () => null,
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock anioActual
vi.mock('../../src/utils/dates', () => ({
  anioActual: vi.fn(() => 2026),
  hoy: vi.fn(() => '2026-01-15'),
  sumarDias: vi.fn((fecha: string, dias: number) => {
    const d = new Date(fecha)
    d.setDate(d.getDate() + dias)
    return d.toISOString().split('T')[0]
  }),
  formatearFecha: vi.fn(),
  isoAEspanol: vi.fn(),
}))

describe('numeracion', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
    vi.mocked(anioActual).mockReturnValue(2026)
  })

  it('cargarContador devuelve contador inicial si no existe', () => {
    const contador = cargarContador()
    expect(contador.anio).toBe(2026)
    expect(contador.ultimoNumero).toBe(0)
  })

  it('siguienteNumero genera formato AAAA-NNN', () => {
    const numero = siguienteNumero()
    expect(numero).toBe('2026-001')
  })

  it('siguienteNumero incrementa secuencialmente', () => {
    const n1 = siguienteNumero()
    const n2 = siguienteNumero()
    const n3 = siguienteNumero()

    expect(n1).toBe('2026-001')
    expect(n2).toBe('2026-002')
    expect(n3).toBe('2026-003')
  })

  it('contador se persiste correctamente', () => {
    siguienteNumero()
    siguienteNumero()

    const contador = cargarContador()
    expect(contador.anio).toBe(2026)
    expect(contador.ultimoNumero).toBe(2)
  })

  it('siguienteNumero resetea al cambiar de año', () => {
    // Generate some numbers in 2026
    siguienteNumero()
    siguienteNumero()

    // Change year to 2027
    vi.mocked(anioActual).mockReturnValue(2027)

    const numero = siguienteNumero()
    expect(numero).toBe('2027-001')
  })
})
