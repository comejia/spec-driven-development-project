import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Presupuesto, Cliente, Perfil, Servicio, Contador } from '../../src/types'

// --- Mock localStorage (mismo patrón que el resto de tests de servicios) ---
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k])
  },
  length: 0,
  key: () => null,
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// jsdom no implementa URL.createObjectURL/revokeObjectURL; los stubeamos para
// poder espiar que NO se invocan cuando la exportación aborta.
if (typeof URL.createObjectURL !== 'function') {
  // @ts-expect-error añadir stub inexistente en jsdom
  URL.createObjectURL = () => 'blob:stub'
}
if (typeof URL.revokeObjectURL !== 'function') {
  // @ts-expect-error añadir stub inexistente en jsdom
  URL.revokeObjectURL = () => {}
}

import {
  construirDatosJson,
  construirZip,
  exportarTodoZip,
} from '../../src/services/exportacion'
import JSZip from 'jszip'

const PREFIX = 'presupuestospro_'

const perfil: Perfil = {
  nombre: 'Juan García',
  nif: '12345678A',
  direccion: 'Calle Mayor 1, Madrid',
  telefono: '600123456',
  email: 'juan@example.com',
  logo: 'data:image/png;base64,iVBORw0KGgo=',
}

const catalogo: Servicio[] = [{ id: 's1', nombre: 'Diseño web', precio: 1000 }]

const contador: Contador = { anio: 2026, ultimoNumero: 3 }

const clientes: Cliente[] = [
  {
    id: 'c1',
    nombre: 'Estudio García',
    nifCif: 'B12345678',
    direccion: 'Av. Central 2',
    email: 'estudio@example.com',
    telefono: '600000001',
    tipo: 'empresa_autonomo',
  },
]

function presupuestoNumerado(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: overrides.id ?? 'p1',
    clienteId: 'c1',
    clienteSnapshot: { ...clientes[0] },
    perfilSnapshot: { ...perfil },
    lineas: [{ id: 'l1', descripcion: 'Servicio', cantidad: 1, precioUnitario: 1000 }],
    retencion: 'ninguna',
    estado: 'numerado',
    numero: '2026-001',
    fechaEmision: '2026-03-15',
    fechaValidez: '2026-04-14',
    ...overrides,
  }
}

function presupuestoBorrador(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    ...presupuestoNumerado(),
    id: 'b1',
    estado: 'borrador',
    numero: null,
    fechaEmision: null,
    fechaValidez: null,
    ...overrides,
  }
}

function sembrar(presupuestos: Presupuesto[]) {
  store[PREFIX + 'presupuestos'] = JSON.stringify(presupuestos)
  store[PREFIX + 'catalogo'] = JSON.stringify(catalogo)
  store[PREFIX + 'perfil'] = JSON.stringify(perfil)
  store[PREFIX + 'contador'] = JSON.stringify(contador)
  store[PREFIX + 'clientes'] = JSON.stringify(clientes)
}

async function nombresEnZip(blob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(blob)
  return Object.keys(zip.files).sort()
}

describe('exportacion', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
    vi.restoreAllMocks()
  })

  // ---------- US1 ----------
  describe('US1 · selección y datos.json', () => {
    it('solo incluye presupuestos numerados (los borradores quedan fuera)', async () => {
      sembrar([presupuestoNumerado({ id: 'p1', numero: '2026-001' }), presupuestoBorrador()])
      const { blob } = await construirZip()
      const nombres = await nombresEnZip(blob)
      const pdfs = nombres.filter((n) => n.endsWith('.pdf'))
      expect(pdfs).toHaveLength(1)
      expect(nombres).toContain('datos.json')
    })

    it('genera un PDF por cada presupuesto numerado + un único datos.json', async () => {
      sembrar([
        presupuestoNumerado({ id: 'p1', numero: '2026-001' }),
        presupuestoNumerado({ id: 'p2', numero: '2026-002' }),
        presupuestoNumerado({ id: 'p3', numero: '2026-003' }),
      ])
      const { blob } = await construirZip()
      const nombres = await nombresEnZip(blob)
      expect(nombres.filter((n) => n.endsWith('.pdf'))).toHaveLength(3)
      expect(nombres.filter((n) => n === 'datos.json')).toHaveLength(1)
    })

    it('datos.json contiene presupuestos, catalogo, perfil y contador; NO contiene clientes', () => {
      sembrar([presupuestoNumerado()])
      const datos = construirDatosJson() as {
        version: number
        exportadoEl: string
        datos: Record<string, unknown>
      }
      expect(datos.version).toBe(1)
      expect(typeof datos.exportadoEl).toBe('string')
      expect(datos.datos).toHaveProperty('presupuestos')
      expect(datos.datos).toHaveProperty('catalogo')
      expect(datos.datos).toHaveProperty('perfil')
      expect(datos.datos).toHaveProperty('contador')
      expect(datos.datos).not.toHaveProperty('clientes')
    })

    it('es de solo lectura: localStorage no cambia tras exportar', async () => {
      sembrar([presupuestoNumerado()])
      const snapshot = JSON.stringify(store)
      await construirZip()
      expect(JSON.stringify(store)).toBe(snapshot)
    })
  })

  // ---------- US2 ----------
  describe('US2 · nombres', () => {
    it('nombra cada PDF como "<numero> - <cliente>.pdf"', async () => {
      sembrar([presupuestoNumerado({ numero: '2026-001' })])
      const { blob } = await construirZip()
      const nombres = await nombresEnZip(blob)
      expect(nombres).toContain('2026-001 - Estudio García.pdf')
    })

    it('sanea nombres de cliente con caracteres conflictivos (Diseño/Web S.L.)', async () => {
      const conflictivo: Cliente = { ...clientes[0], nombre: 'Diseño/Web S.L.' }
      sembrar([
        presupuestoNumerado({ numero: '2026-009', clienteSnapshot: conflictivo }),
      ])
      const { blob } = await construirZip()
      const nombres = await nombresEnZip(blob)
      const pdf = nombres.find((n) => n.endsWith('.pdf'))!
      expect(pdf).not.toContain('/')
      expect(pdf).toBe('2026-009 - Diseño Web S.L.pdf')
    })

    it('el nombre del .zip usa fecha local AAAA-MM-DD', async () => {
      sembrar([presupuestoNumerado()])
      const { nombreZip } = await construirZip()
      expect(nombreZip).toMatch(/^presupuestospro-copia-\d{4}-\d{2}-\d{2}\.zip$/)
    })
  })

  // ---------- US3 ----------
  describe('US3 · vacío, atomicidad y progreso', () => {
    it('sin numerados: exportarTodoZip devuelve { ok:false, motivo:"sin-numerados" } y no descarga', async () => {
      sembrar([presupuestoBorrador()])
      const spy = vi.spyOn(URL, 'createObjectURL')
      const res = await exportarTodoZip()
      expect(res.ok).toBe(false)
      expect(res.motivo).toBe('sin-numerados')
      expect(spy).not.toHaveBeenCalled()
    })

    it('atomicidad: si un PDF falla, exportarTodoZip aborta con motivo "fallo-pdf" y no descarga', async () => {
      // Un presupuesto sin perfilSnapshot ni clienteSnapshot hace fallar construirDocumentoPDF
      const roto = presupuestoNumerado({
        id: 'roto',
        numero: '2026-777',
        perfilSnapshot: null,
        clienteSnapshot: null,
        clienteId: 'inexistente',
      })
      sembrar([presupuestoNumerado({ id: 'p1', numero: '2026-001' }), roto])
      // Sin clientes para que no pueda resolver el cliente del roto
      store[PREFIX + 'clientes'] = JSON.stringify([])
      const spy = vi.spyOn(URL, 'createObjectURL')
      const res = await exportarTodoZip()
      expect(res.ok).toBe(false)
      expect(res.motivo).toBe('fallo-pdf')
      expect(spy).not.toHaveBeenCalled()
    })

    it('progreso: onProgreso se invoca total veces con valores 1..total', async () => {
      sembrar([
        presupuestoNumerado({ id: 'p1', numero: '2026-001' }),
        presupuestoNumerado({ id: 'p2', numero: '2026-002' }),
      ])
      const llamadas: Array<[number, number]> = []
      await construirZip((generados, total) => llamadas.push([generados, total]))
      expect(llamadas).toEqual([
        [1, 2],
        [2, 2],
      ])
    })

    it('escala: onProgreso llega hasta N con un lote grande (RF-010)', async () => {
      const lote = Array.from({ length: 200 }, (_, i) =>
        presupuestoNumerado({ id: `p${i}`, numero: `2026-${String(i + 1).padStart(3, '0')}` }),
      )
      sembrar(lote)
      let ultimo = 0
      let total = 0
      await construirZip((generados, tot) => {
        ultimo = generados
        total = tot
      })
      expect(total).toBe(200)
      expect(ultimo).toBe(200)
    })
  })
})
