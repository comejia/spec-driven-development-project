import { describe, it, expect } from 'vitest'
import { calcularDesglose } from '../../src/services/calculos'
import type { Linea } from '../../src/types'

const lineasBase: Linea[] = [
  { id: '1', descripcion: 'Servicio A', cantidad: 1, precioUnitario: 1500 },
  { id: '2', descripcion: 'Servicio B', cantidad: 1, precioUnitario: 500 },
]

describe('calcularDesglose', () => {
  it('Case A: empresa_autonomo con retención 15% → total = 2120.00', () => {
    const resultado = calcularDesglose(lineasBase, '15', 'empresa_autonomo')

    expect(resultado.baseImponible).toBe(2000)
    expect(resultado.iva).toBe(420) // 2000 * 0.21
    expect(resultado.retencionIRPF).toBe(300) // 2000 * 0.15
    expect(resultado.total).toBe(2120) // 2000 + 420 - 300
    expect(resultado.porcentajeRetencion).toBe(15)
    expect(resultado.aplicaRetencion).toBe(true)
  })

  it('Case B: empresa_autonomo con retención 7% → total = 2280.00', () => {
    const resultado = calcularDesglose(lineasBase, '7', 'empresa_autonomo')

    expect(resultado.baseImponible).toBe(2000)
    expect(resultado.iva).toBe(420) // 2000 * 0.21
    expect(resultado.retencionIRPF).toBe(140) // 2000 * 0.07
    expect(resultado.total).toBe(2280) // 2000 + 420 - 140
    expect(resultado.porcentajeRetencion).toBe(7)
    expect(resultado.aplicaRetencion).toBe(true)
  })

  it('Case C: particular con retención 15% → total = 2420.00 (retención no aplicada)', () => {
    const resultado = calcularDesglose(lineasBase, '15', 'particular')

    expect(resultado.baseImponible).toBe(2000)
    expect(resultado.iva).toBe(420) // 2000 * 0.21
    expect(resultado.retencionIRPF).toBe(0) // No aplica a particulares
    expect(resultado.total).toBe(2420) // 2000 + 420
    expect(resultado.porcentajeRetencion).toBe(0)
    expect(resultado.aplicaRetencion).toBe(false)
  })

  it('Case D: particular con retención 15% → retencionIRPF = 0', () => {
    const resultado = calcularDesglose(lineasBase, '15', 'particular')

    expect(resultado.retencionIRPF).toBe(0)
    expect(resultado.aplicaRetencion).toBe(false)
  })

  it('empresa_autonomo sin retención → no aplica retención', () => {
    const resultado = calcularDesglose(lineasBase, 'ninguna', 'empresa_autonomo')

    expect(resultado.retencionIRPF).toBe(0)
    expect(resultado.aplicaRetencion).toBe(false)
    expect(resultado.total).toBe(2420) // 2000 + 420
  })

  it('líneas vacías → todo a 0', () => {
    const resultado = calcularDesglose([], '15', 'empresa_autonomo')

    expect(resultado.baseImponible).toBe(0)
    expect(resultado.iva).toBe(0)
    expect(resultado.retencionIRPF).toBe(0)
    expect(resultado.total).toBe(0)
  })

  it('línea con cantidad > 1', () => {
    const lineas: Linea[] = [
      { id: '1', descripcion: 'Horas', cantidad: 10, precioUnitario: 50 },
    ]
    const resultado = calcularDesglose(lineas, 'ninguna', 'particular')

    expect(resultado.baseImponible).toBe(500) // 10 * 50
    expect(resultado.iva).toBe(105) // 500 * 0.21
    expect(resultado.total).toBe(605) // 500 + 105
  })
})
