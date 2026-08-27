import { describe, it, expect, beforeEach } from 'vitest'
import { cargarCatalogo, crearServicio, editarServicio, eliminarServicio } from '../../src/services/catalogo'

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

describe('catalogo', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
  })

  describe('crearServicio', () => {
    it('crea un servicio correctamente', () => {
      const resultado = crearServicio('Diseño Web', 500)

      expect(resultado.ok).toBe(true)
      expect(resultado.servicio).toBeDefined()
      expect(resultado.servicio!.nombre).toBe('Diseño Web')
      expect(resultado.servicio!.precio).toBe(500)
      expect(resultado.servicio!.id).toBeDefined()
    })

    it('no permite nombres duplicados (case-insensitive)', () => {
      crearServicio('Diseño Web', 500)
      const resultado = crearServicio('diseño web', 600)

      expect(resultado.ok).toBe(false)
      expect(resultado.error).toBe('Ya existe un servicio con ese nombre')
    })

    it('no permite nombres duplicados con espacios extras', () => {
      crearServicio('Diseño Web', 500)
      const resultado = crearServicio('  Diseño Web  ', 600)

      expect(resultado.ok).toBe(false)
      expect(resultado.error).toBe('Ya existe un servicio con ese nombre')
    })

    it('permite nombres diferentes', () => {
      crearServicio('Diseño Web', 500)
      const resultado = crearServicio('Desarrollo Backend', 800)

      expect(resultado.ok).toBe(true)
    })

    it('el servicio creado se persiste', () => {
      crearServicio('Diseño Web', 500)
      const catalogo = cargarCatalogo()

      expect(catalogo).toHaveLength(1)
      expect(catalogo[0].nombre).toBe('Diseño Web')
    })
  })

  describe('editarServicio', () => {
    it('edita un servicio correctamente', () => {
      const { servicio } = crearServicio('Diseño Web', 500)
      const resultado = editarServicio(servicio!.id, 'Diseño UX', 700)

      expect(resultado.ok).toBe(true)

      const catalogo = cargarCatalogo()
      expect(catalogo[0].nombre).toBe('Diseño UX')
      expect(catalogo[0].precio).toBe(700)
    })

    it('no permite renombrar a nombre existente (case-insensitive)', () => {
      crearServicio('Diseño Web', 500)
      const { servicio } = crearServicio('Desarrollo', 800)

      const resultado = editarServicio(servicio!.id, 'diseño web', 800)

      expect(resultado.ok).toBe(false)
      expect(resultado.error).toBe('Ya existe un servicio con ese nombre')
    })

    it('permite mantener su propio nombre al editar', () => {
      const { servicio } = crearServicio('Diseño Web', 500)
      const resultado = editarServicio(servicio!.id, 'Diseño Web', 700)

      expect(resultado.ok).toBe(true)
    })
  })

  describe('eliminarServicio', () => {
    it('elimina un servicio correctamente', () => {
      const { servicio } = crearServicio('Diseño Web', 500)
      crearServicio('Desarrollo', 800)

      eliminarServicio(servicio!.id)
      const catalogo = cargarCatalogo()

      expect(catalogo).toHaveLength(1)
      expect(catalogo[0].nombre).toBe('Desarrollo')
    })
  })
})
