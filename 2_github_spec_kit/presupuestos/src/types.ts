export interface Perfil {
  nombre: string
  nif: string
  direccion: string
  telefono: string
  email: string
  logo: string // Data URL base64
}

export interface Servicio {
  id: string
  nombre: string
  precio: number // base imponible en euros
}

export type TipoCliente = 'empresa_autonomo' | 'particular'

export interface Cliente {
  id: string
  nombre: string
  nifCif: string
  direccion: string
  email: string
  telefono: string
  tipo: TipoCliente
}

export type TipoRetencion = 'ninguna' | '15' | '7'

export type EstadoPresupuesto = 'borrador' | 'numerado'

export interface Linea {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
}

export interface Presupuesto {
  id: string
  clienteId: string
  clienteSnapshot: Cliente | null
  perfilSnapshot: Perfil | null
  lineas: Linea[]
  retencion: TipoRetencion
  estado: EstadoPresupuesto
  numero: string | null
  fechaEmision: string | null
  fechaValidez: string | null
}

export interface Contador {
  anio: number
  ultimoNumero: number
}

export interface Desglose {
  baseImponible: number
  iva: number
  retencionIRPF: number
  total: number
  porcentajeRetencion: number
  aplicaRetencion: boolean
}
