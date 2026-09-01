import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Presupuesto, Cliente } from '../../types'
import { cargarPresupuestos, editarNumerado } from '../../services/presupuestos'
import { generarDocumentoPDF } from '../../services/pdf'
import { exportarTodoZip } from '../../services/exportacion'
import { cargarClientes } from '../../services/clientes'
import { isoAEspanol } from '../../utils/dates'

export default function PresupuestosPage() {
  const navigate = useNavigate()
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [exportando, setExportando] = useState(false)
  const [progreso, setProgreso] = useState<{ generados: number; total: number } | null>(null)
  const [avisoExportacion, setAvisoExportacion] = useState<string | null>(null)

  useEffect(() => {
    setPresupuestos(cargarPresupuestos())
    setClientes(cargarClientes())
  }, [])

  function getNombreCliente(clienteId: string, snapshot: Cliente | null): string {
    if (snapshot) return snapshot.nombre
    const cliente = clientes.find((c) => c.id === clienteId)
    return cliente?.nombre ?? 'Cliente desconocido'
  }

  function handleNuevo() {
    navigate('/presupuestos/nuevo')
  }

  function handleEditar(id: string) {
    navigate(`/presupuestos/${id}`)
  }

  function handleEditarNumerado(id: string) {
    const nuevoBorrador = editarNumerado(id)
    setPresupuestos(cargarPresupuestos())
    navigate(`/presupuestos/${nuevoBorrador.id}`)
  }

  function handleDescargarPDF(presupuesto: Presupuesto) {
    generarDocumentoPDF(presupuesto)
  }

  async function handleExportar() {
    if (exportando) return
    setAvisoExportacion(null)
    setExportando(true)
    setProgreso({ generados: 0, total: numerados.length })
    try {
      const resultado = await exportarTodoZip((generados, total) =>
        setProgreso({ generados, total }),
      )
      if (!resultado.ok) {
        setAvisoExportacion(resultado.mensaje ?? 'No se pudo completar la exportación.')
      }
    } catch {
      setAvisoExportacion('No se pudo completar la exportación.')
    } finally {
      setExportando(false)
      setProgreso(null)
    }
  }

  const borradores = presupuestos.filter((p) => p.estado === 'borrador')
  const numerados = presupuestos.filter((p) => p.estado === 'numerado')

  return (
    <div>
      <div className="page-header">
        <h1>Presupuestos</h1>
        <div className="form-actions">
          <button
            className="secondary"
            onClick={handleExportar}
            disabled={exportando}
            title={numerados.length === 0 ? 'No hay nada que exportar' : undefined}
          >
            {exportando ? 'Exportando…' : 'Exportar todo (.zip)'}
          </button>
          <button className="primary" onClick={handleNuevo}>
            Nuevo presupuesto
          </button>
        </div>
      </div>

      {progreso && (
        <div className="export-progress" role="status" aria-live="polite">
          <div className="export-progress-bar">
            <div
              className="export-progress-fill"
              style={{
                width: progreso.total > 0 ? `${(progreso.generados / progreso.total) * 100}%` : '0%',
              }}
            />
          </div>
          <span className="export-progress-text">
            {progreso.generados} de {progreso.total}
          </span>
        </div>
      )}

      {avisoExportacion && (
        <p className="export-aviso" role="alert">
          {avisoExportacion}
        </p>
      )}

      {/* Borradores */}
      <section className="mb-6">
        <h2>
          Borradores
          {borradores.length > 0 && (
            <span className="badge badge-borrador" style={{ marginLeft: 'var(--space-2)', verticalAlign: 'middle' }}>
              {borradores.length}
            </span>
          )}
        </h2>
        {borradores.length === 0 ? (
          <p className="text-muted" style={{ fontStyle: 'italic' }}>
            No hay borradores
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Líneas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {borradores.map((p) => (
                <tr key={p.id}>
                  <td><span className="badge badge-borrador">Borrador</span></td>
                  <td>{getNombreCliente(p.clienteId, p.clienteSnapshot)}</td>
                  <td>{p.lineas.length}</td>
                  <td>
                    <button className="secondary" onClick={() => handleEditar(p.id)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Numerados */}
      <section>
        <h2>
          Numerados
          {numerados.length > 0 && (
            <span className="badge badge-numerado" style={{ marginLeft: 'var(--space-2)', verticalAlign: 'middle' }}>
              {numerados.length}
            </span>
          )}
        </h2>
        {numerados.length === 0 ? (
          <p className="text-muted" style={{ fontStyle: 'italic' }}>
            No hay presupuestos numerados
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Número</th>
                <th>Cliente</th>
                <th>Fecha emisión</th>
                <th>Líneas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {numerados.map((p) => (
                <tr key={p.id}>
                  <td><span className="badge badge-numerado">Numerado</span></td>
                  <td className="font-semibold">{p.numero}</td>
                  <td>{getNombreCliente(p.clienteId, p.clienteSnapshot)}</td>
                  <td>{p.fechaEmision ? isoAEspanol(p.fechaEmision) : '—'}</td>
                  <td>{p.lineas.length}</td>
                  <td>
                    <div className="form-actions">
                      <button className="primary" onClick={() => handleDescargarPDF(p)}>
                        Descargar PDF
                      </button>
                      <button className="secondary" onClick={() => handleEditarNumerado(p.id)}>
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
