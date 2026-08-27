import { useState, useEffect } from 'react'
import type { Servicio } from '../../types'
import { cargarCatalogo, crearServicio, editarServicio, eliminarServicio } from '../../services/catalogo'
import { formatearMoneda } from '../../utils/currency'

export default function CatalogoPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setServicios(cargarCatalogo())
  }, [])

  function resetForm() {
    setNombre('')
    setPrecio('')
    setEditandoId(null)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const nombreTrim = nombre.trim()
    if (!nombreTrim) {
      setError('El nombre es obligatorio')
      return
    }

    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      setError('El precio debe ser un número mayor que 0')
      return
    }

    if (editandoId) {
      const resultado = editarServicio(editandoId, nombreTrim, precioNum)
      if (!resultado.ok) {
        setError(resultado.error ?? 'Error al editar')
        return
      }
    } else {
      const resultado = crearServicio(nombreTrim, precioNum)
      if (!resultado.ok) {
        setError(resultado.error ?? 'Error al crear')
        return
      }
    }

    setServicios(cargarCatalogo())
    resetForm()
  }

  function handleEditar(servicio: Servicio) {
    setNombre(servicio.nombre)
    setPrecio(String(servicio.precio))
    setEditandoId(servicio.id)
    setError('')
  }

  function handleEliminar(id: string) {
    eliminarServicio(id)
    setServicios(cargarCatalogo())
    if (editandoId === id) {
      resetForm()
    }
  }

  function handleCancelar() {
    resetForm()
  }

  return (
    <div>
      <h1>Catálogo de Servicios</h1>
      <p className="text-secondary mb-6">
        Servicios predefinidos para añadir rápidamente a los presupuestos.
      </p>

      <div className="card mb-6">
        <form onSubmit={handleSubmit}>
          <h3>
            {editandoId ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>

          <div className="form-group">
            <label htmlFor="servicio-nombre">Nombre del servicio</label>
            <input
              id="servicio-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Diseño de logotipo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="servicio-precio">Precio (€, base imponible)</label>
            <input
              id="servicio-precio"
              type="number"
              step="0.01"
              min="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="100.00"
            />
          </div>

          {error && <p className="error-message mb-4">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="primary">
              {editandoId ? 'Guardar cambios' : 'Añadir servicio'}
            </button>
            {editandoId && (
              <button type="button" className="secondary" onClick={handleCancelar}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {servicios.length === 0 ? (
        <p className="text-muted" style={{ fontStyle: 'italic' }}>
          No hay servicios en el catálogo
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((servicio) => (
              <tr key={servicio.id}>
                <td>{servicio.nombre}</td>
                <td>{formatearMoneda(servicio.precio)}</td>
                <td>
                  <div className="form-actions">
                    <button className="secondary" onClick={() => handleEditar(servicio)}>
                      Editar
                    </button>
                    <button className="danger" onClick={() => handleEliminar(servicio.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
