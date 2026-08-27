import { describe, it, expect, beforeEach } from 'vitest'
import { esPerfilCompleto, cargarPerfil, guardarPerfil } from '../../src/services/perfil'
import type { Perfil } from '../../src/types'

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

const perfilCompleto: Perfil = {
  nombre: 'Juan García',
  nif: '12345678A',
  direccion: 'Calle Mayor 1, Madrid',
  telefono: '600123456',
  email: 'juan@example.com',
  logo: 'data:image/png;base64,iVBORw0KGgo=',
}

describe('perfil', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
  })

  describe('esPerfilCompleto', () => {
    it('devuelve false si perfil es null', () => {
      expect(esPerfilCompleto(null)).toBe(false)
    })

    it('devuelve true si todos los campos están completos', () => {
      expect(esPerfilCompleto(perfilCompleto)).toBe(true)
    })

    it('devuelve false si nombre está vacío', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, nombre: '' })).toBe(false)
    })

    it('devuelve false si nif está vacío', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, nif: '' })).toBe(false)
    })

    it('devuelve false si direccion está vacía', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, direccion: '' })).toBe(false)
    })

    it('devuelve false si telefono está vacío', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, telefono: '' })).toBe(false)
    })

    it('devuelve false si email está vacío', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, email: '' })).toBe(false)
    })

    it('devuelve false si logo está vacío', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, logo: '' })).toBe(false)
    })

    it('devuelve false si campo tiene solo espacios', () => {
      expect(esPerfilCompleto({ ...perfilCompleto, nombre: '   ' })).toBe(false)
    })
  })

  describe('cargarPerfil / guardarPerfil', () => {
    it('cargarPerfil devuelve null si no hay perfil guardado', () => {
      expect(cargarPerfil()).toBeNull()
    })

    it('guardarPerfil y cargarPerfil persisten correctamente', () => {
      guardarPerfil(perfilCompleto)
      const cargado = cargarPerfil()
      expect(cargado).toEqual(perfilCompleto)
    })
  })
})
