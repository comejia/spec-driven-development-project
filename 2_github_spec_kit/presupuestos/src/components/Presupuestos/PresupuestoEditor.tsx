import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Presupuesto, Cliente, Servicio, Linea, TipoRetencion, Desglose } from '../../types'
import { cargarPresupuestos, crearPresupuesto, actualizarPresupuesto, generarPDF } from '../../services/presupuestos'
import { cargarClientes } from '../../services/clientes'
import { cargarCatalogo } from '../../services/catalogo'
import { calcularDesglose } from '../../services/calculos'
import { formatearMoneda } from '../../utils/currency'
import { redondear2 } from '../../utils/currency'
import { generarId } from '../../utils/uuid'

export default function PresupuestoEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogo, setCatalogo] = useState<Servicio[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

  // New line form state
  const [lineaDescripcion, setLineaDescripcion] = useState('')
  const [lineaCantidad, setLineaCantidad] = useState('1')
  const [lineaPrecio, setLineaPrecio] = useState('')
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState('')

  // Edit line state
  const [editandoLineaId, setEditandoLineaId] = useState<string | null>(null)
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editCantidad, setEditCantidad] = useState('')
  const [editPrecio, setEditPrecio] = useState('')

  // UI state
  const [error, setError] = useState('')
  const [lineaError, setLineaError] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [desglose, setDesglose] = useState<Desglose>({
    baseImponible: 0,
    iva: 0,
    retencionIRPF: 0,
    total: 0,
    porcentajeRetencion: 0,
    aplicaRetencion: false,
  })

  // Load initial data
  useEffect(() => {
    const todosClientes = cargarClientes()
    setClientes(todosClientes)
    setCatalogo(cargarCatalogo())

    if (id === 'nuevo') {
      return
    }

    const presupuestos = cargarPresupuestos()
    const existente = presupuestos.find((p) => p.id === id)
    if (existente) {
      setPresupuesto(existente)
      const cliente = todosClientes.find((c) => c.id === existente.clienteId)
      if (cliente) {
        setClienteSeleccionado(cliente)
      }
    } else {
      setError('Presupuesto no encontrado')
    }
  }, [id])

  // Recalculate desglose when lines or retention change
  useEffect(() => {
    if (!presupuesto || !clienteSeleccionado) return
    const nuevoDesglose = calcularDesglose(
      presupuesto.lineas,
      presupuesto.retencion,
      clienteSeleccionado.tipo
    )
    setDesglose(nuevoDesglose)
  }, [presupuesto?.lineas, presupuesto?.retencion, clienteSeleccionado])

  function handleSeleccionarCliente() {
    if (!clienteId) {
      setError('Selecciona un cliente')
      return
    }

    const cliente = clientes.find((c) => c.id === clienteId)
    if (!cliente) return

    const nuevo = crearPresupuesto(clienteId)
    setPresupuesto(nuevo)
    setClienteSeleccionado(cliente)
    setError('')

    window.history.replaceState(null, '', `/presupuestos/${nuevo.id}`)
  }

  function handleRetencionChange(valor: TipoRetencion) {
    if (!presupuesto) return
    const actualizado = { ...presupuesto, retencion: valor }
    setPresupuesto(actualizado)
    actualizarPresupuesto(actualizado)
  }

  function handleCatalogoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const servicioId = e.target.value
    setCatalogoSeleccionado(servicioId)

    if (servicioId) {
      const servicio = catalogo.find((s) => s.id === servicioId)
      if (servicio) {
        setLineaDescripcion(servicio.nombre)
        setLineaPrecio(String(servicio.precio))
      }
    }
  }

  function handleAgregarLinea(e: React.FormEvent) {
    e.preventDefault()
    setLineaError('')

    if (!presupuesto) return

    if (!lineaDescripcion.trim()) {
      setLineaError('La descripción es obligatoria')
      return
    }

    const cantidad = parseFloat(lineaCantidad)
    if (isNaN(cantidad) || cantidad <= 0) {
      setLineaError('La cantidad debe ser mayor que 0')
      return
    }

    const precioUnit = parseFloat(lineaPrecio)
    if (isNaN(precioUnit) || precioUnit <= 0) {
      setLineaError('El precio unitario debe ser mayor que 0')
      return
    }

    const nuevaLinea: Linea = {
      id: generarId(),
      descripcion: lineaDescripcion.trim(),
      cantidad,
      precioUnitario: precioUnit,
    }

    const actualizado = {
      ...presupuesto,
      lineas: [...presupuesto.lineas, nuevaLinea],
    }

    setPresupuesto(actualizado)
    actualizarPresupuesto(actualizado)

    setLineaDescripcion('')
    setLineaCantidad('1')
    setLineaPrecio('')
    setCatalogoSeleccionado('')
  }

  function handleEliminarLinea(lineaId: string) {
    if (!presupuesto) return
    const actualizado = {
      ...presupuesto,
      lineas: presupuesto.lineas.filter((l) => l.id !== lineaId),
    }
    setPresupuesto(actualizado)
    actualizarPresupuesto(actualizado)
  }

  function handleEditarLinea(linea: Linea) {
    setEditandoLineaId(linea.id)
    setEditDescripcion(linea.descripcion)
    setEditCantidad(String(linea.cantidad))
    setEditPrecio(String(linea.precioUnitario))
  }

  function handleGuardarEdicionLinea() {
    if (!presupuesto || !editandoLineaId) return

    const cantidad = parseFloat(editCantidad)
    const precioUnit = parseFloat(editPrecio)

    if (!editDescripcion.trim() || isNaN(cantidad) || cantidad <= 0 || isNaN(precioUnit) || precioUnit <= 0) {
      return
    }

    const actualizado = {
      ...presupuesto,
      lineas: presupuesto.lineas.map((l) =>
        l.id === editandoLineaId
          ? { ...l, descripcion: editDescripcion.trim(), cantidad, precioUnitario: precioUnit }
          : l
      ),
    }
    setPresupuesto(actualizado)
    actualizarPresupuesto(actualizado)
    setEditandoLineaId(null)
  }

  function handleCancelarEdicionLinea() {
    setEditandoLineaId(null)
  }

  function handleGenerarPDF() {
    if (!presupuesto) return
    setError('')

    const resultado = generarPDF(presupuesto.id)
    if (!resultado.ok) {
      setError(resultado.error ?? 'Error al generar el PDF')
      return
    }

    const presupuestos = cargarPresupuestos()
    const actualizado = presupuestos.find((p) => p.id === presupuesto.id)
    if (actualizado) {
      setPresupuesto(actualizado)
    }

    navigate('/presupuestos')
  }

  // Client selection view
  if (id === 'nuevo' && !presupuesto) {
    return (
      <div>
        <div className="page-header">
          <h1>Nuevo presupuesto</h1>
          <button className="secondary" onClick={() => navigate('/presupuestos')}>
            ← Volver
          </button>
        </div>

        <div className="card">
          <div className="form-group">
            <label htmlFor="cliente-selector">Selecciona un cliente</label>
            {clientes.length === 0 ? (
              <p className="text-muted" style={{ fontStyle: 'italic' }}>
                No hay clientes registrados. Crea uno primero en la sección Clientes.
              </p>
            ) : (
              <select
                id="cliente-selector"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">— Seleccionar cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo === 'empresa_autonomo' ? 'Empresa/Autónomo' : 'Particular'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          {clientes.length > 0 && (
            <button className="primary" onClick={handleSeleccionarCliente}>
              Crear presupuesto
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div>
        <p className="error-message">{error || 'Cargando...'}</p>
        <button className="secondary mt-4" onClick={() => navigate('/presupuestos')}>
          ← Volver
        </button>
      </div>
    )
  }

  const esNumerado = presupuesto.estado === 'numerado'
  const esParticular = clienteSeleccionado?.tipo === 'particular'

  return (
    <div>
      <div className="page-header">
        <h1>
          {esNumerado ? `Presupuesto ${presupuesto.numero}` : 'Editar presupuesto'}
          {' '}
          <span className={`badge ${esNumerado ? 'badge-numerado' : 'badge-borrador'}`}>
            {esNumerado ? 'Numerado' : 'Borrador'}
          </span>
        </h1>
        <button className="secondary" onClick={() => navigate('/presupuestos')}>
          ← Volver
        </button>
      </div>

      {/* Client info */}
      {clienteSeleccionado && (
        <div className="card mb-6">
          <h3>Cliente</h3>
          <p className="font-semibold">{clienteSeleccionado.nombre}</p>
          {clienteSeleccionado.nifCif && <p className="text-secondary">NIF/CIF: {clienteSeleccionado.nifCif}</p>}
          <p className="text-secondary">{clienteSeleccionado.email} · {clienteSeleccionado.telefono}</p>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
            Tipo: {clienteSeleccionado.tipo === 'empresa_autonomo' ? 'Empresa/Autónomo' : 'Particular'}
          </p>
        </div>
      )}

      {/* Line table */}
      <h2>Líneas del presupuesto</h2>

      {presupuesto.lineas.length === 0 ? (
        <p className="text-muted mb-4" style={{ fontStyle: 'italic' }}>
          No hay líneas. Añade servicios al presupuesto.
        </p>
      ) : (
        <div className="mb-6">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Importe</th>
                {!esNumerado && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {presupuesto.lineas.map((linea) => (
                <tr key={linea.id}>
                  {editandoLineaId === linea.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editDescripcion}
                          onChange={(e) => setEditDescripcion(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={editCantidad}
                          onChange={(e) => setEditCantidad(e.target.value)}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPrecio}
                          onChange={(e) => setEditPrecio(e.target.value)}
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>—</td>
                      <td>
                        <div className="form-actions">
                          <button className="primary" onClick={handleGuardarEdicionLinea}>✓</button>
                          <button className="secondary" onClick={handleCancelarEdicionLinea}>✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{linea.descripcion}</td>
                      <td>{linea.cantidad}</td>
                      <td>{formatearMoneda(linea.precioUnitario)}</td>
                      <td className="font-semibold">{formatearMoneda(redondear2(linea.cantidad * linea.precioUnitario))}</td>
                      {!esNumerado && (
                        <td>
                          <div className="form-actions">
                            <button className="secondary" onClick={() => handleEditarLinea(linea)}>Editar</button>
                            <button className="danger" onClick={() => handleEliminarLinea(linea.id)}>Eliminar</button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add line form - only for borradores */}
      {!esNumerado && (
        <div className="card mb-6">
          <form onSubmit={handleAgregarLinea}>
            <h3>Añadir línea</h3>

            {catalogo.length > 0 && (
              <div className="form-group">
                <label htmlFor="catalogo-selector">Desde catálogo (opcional)</label>
                <select
                  id="catalogo-selector"
                  value={catalogoSeleccionado}
                  onChange={handleCatalogoChange}
                >
                  <option value="">— Entrada manual —</option>
                  {catalogo.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — {formatearMoneda(s.precio)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="linea-descripcion">Descripción</label>
              <input
                id="linea-descripcion"
                type="text"
                value={lineaDescripcion}
                onChange={(e) => setLineaDescripcion(e.target.value)}
                placeholder="Descripción del servicio"
              />
            </div>

            <div className="editor-line-fields">
              <div className="form-group">
                <label htmlFor="linea-cantidad">Cantidad</label>
                <input
                  id="linea-cantidad"
                  type="number"
                  step="1"
                  min="1"
                  value={lineaCantidad}
                  onChange={(e) => setLineaCantidad(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="linea-precio">Precio unitario (€)</label>
                <input
                  id="linea-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={lineaPrecio}
                  onChange={(e) => setLineaPrecio(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {lineaError && <p className="error-message mb-4">{lineaError}</p>}

            <button type="submit" className="primary">
              Añadir línea
            </button>
          </form>
        </div>
      )}

      {/* Retention selector */}
      {!esNumerado && (
        <div className="card mb-6">
          <div className="form-group">
            <label htmlFor="retencion-selector">Retención IRPF</label>
            <select
              id="retencion-selector"
              value={presupuesto.retencion}
              onChange={(e) => handleRetencionChange(e.target.value as TipoRetencion)}
              disabled={esParticular}
            >
              <option value="ninguna">Sin retención</option>
              <option value="15">15%</option>
              <option value="7">7%</option>
            </select>
            {esParticular && (
              <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                La retención IRPF no se aplica a clientes particulares.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Desglose */}
      <div className="card desglose-card mb-6">
        <h3>Desglose</h3>
        <div className="desglose-table">
          <div className="desglose-row">
            <span>Base imponible</span>
            <span>{formatearMoneda(desglose.baseImponible)}</span>
          </div>
          <div className="desglose-row">
            <span>IVA (21%)</span>
            <span>{formatearMoneda(desglose.iva)}</span>
          </div>
          {desglose.aplicaRetencion && (
            <div className="desglose-row desglose-retencion">
              <span>Retención IRPF ({desglose.porcentajeRetencion}%)</span>
              <span>-{formatearMoneda(desglose.retencionIRPF)}</span>
            </div>
          )}
          <div className="desglose-row desglose-total">
            <span>Total</span>
            <span>{formatearMoneda(desglose.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {error && <p className="error-message mb-4">{error}</p>}

      {!esNumerado && (
        <button className="primary" onClick={handleGenerarPDF}>
          Generar PDF y numerar
        </button>
      )}
    </div>
  )
}
