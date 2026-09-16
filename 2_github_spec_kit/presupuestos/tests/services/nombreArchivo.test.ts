import { describe, it, expect } from 'vitest'
import { sanearNombreArchivo } from '../../src/utils/nombreArchivo'

describe('sanearNombreArchivo', () => {
  it('elimina la barra en "Diseño/Web S.L." produciendo un nombre válido', () => {
    const r = sanearNombreArchivo('Diseño/Web S.L.')
    expect(r).not.toContain('/')
    expect(r).toBe('Diseño Web S.L')
  })

  it('sustituye todos los caracteres no válidos \\ / : * ? " < > |', () => {
    const r = sanearNombreArchivo('a\\b/c:d*e?f"g<h>i|j')
    expect(r).toBe('a b c d e f g h i j')
  })

  it('elimina caracteres de control', () => {
    const r = sanearNombreArchivo('nombre\u0000\u001f fin')
    expect(r).toBe('nombre fin')
  })

  it('colapsa espacios múltiples', () => {
    expect(sanearNombreArchivo('a    b     c')).toBe('a b c')
  })

  it('recorta espacios de los extremos', () => {
    expect(sanearNombreArchivo('   hola   ')).toBe('hola')
  })

  it('cadena vacía devuelve el fallback "sin-nombre"', () => {
    expect(sanearNombreArchivo('')).toBe('sin-nombre')
  })

  it('cadena solo con caracteres inválidos devuelve "sin-nombre"', () => {
    expect(sanearNombreArchivo('///:::')).toBe('sin-nombre')
  })
})
