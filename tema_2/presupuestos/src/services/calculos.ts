import type { Linea, TipoRetencion, TipoCliente, Desglose } from '../types'
import { redondear2 } from '../utils/currency'

export function calcularDesglose(
  lineas: Linea[],
  retencion: TipoRetencion,
  tipoCliente: TipoCliente
): Desglose {
  const baseImponible = lineas.reduce((sum, linea) => {
    const importeLinea = redondear2(linea.cantidad * linea.precioUnitario)
    return sum + importeLinea
  }, 0)

  const iva = redondear2(baseImponible * 0.21)

  const aplicaRetencion = tipoCliente === 'empresa_autonomo' && retencion !== 'ninguna'

  let porcentajeRetencion = 0
  if (aplicaRetencion) {
    porcentajeRetencion = retencion === '15' ? 15 : 7
  }

  const retencionIRPF = aplicaRetencion
    ? redondear2(baseImponible * (porcentajeRetencion / 100))
    : 0

  const total = redondear2(baseImponible + iva - retencionIRPF)

  return {
    baseImponible,
    iva,
    retencionIRPF,
    total,
    porcentajeRetencion,
    aplicaRetencion,
  }
}
