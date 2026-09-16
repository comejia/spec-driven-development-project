import { useState, useEffect } from 'react'
import type { Cliente, TipoCliente } from '../../types'
import { cargarClientes, crearCliente, editarCliente } from '../../services/clientes'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [nombre, setNombre] = useState('')
  const [nifCif, setNifCif] = useState('')
  const [direccion, setDireccion] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tipo, setTipo] = useState<TipoCliente>('empresa_autonomo')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setClientes(cargarClientes())
  }, [])

  function resetForm() {
    setNombre('')
    setNifCif('')
    setDireccion('')
    setEmail('')
    setTelefono('')
    setTipo('empresa_autonomo')
    setEditandoId(null)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!direccion.trim()) {
      setError('La dirección es obligatoria')
      return
    }
    if (!email.trim()) {
      setError('El email es obligatorio')
      return
    }
    if (!telefono.trim()) {
      setError('El teléfono es obligatorio')
      return
    }

    const data = {
      nombre: nombre.trim(),
      nifCif: nifCif.trim(),
      direccion: direccion.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      tipo,
    }

    if (editandoId) {
      editarCliente(editandoId, data)
    } else {
      crearCliente(data)
    }

    setClientes(cargarClientes())
    resetForm()
  }

  function handleEditar(cliente: Cliente) {
    setNombre(cliente.nombre)
    setNifCif(cliente.nifCif)
    setDireccion(cliente.direccion)
    setEmail(cliente.email)
    setTelefono(cliente.telefono)
    setTipo(cliente.tipo)
    setEditandoId(cliente.id)
    setError('')
  }

  function handleCancelar() {
    resetForm()
  }

  return (
    <div>
      <h1>Clientes</h1>
      <p className="text-secondary mb-6">
        Gestiona tu cartera de clientes.
      </p>

      <div className="card mb-6">
        <form onSubmit={handleSubmit}>
          <h3>
            {editandoId ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>

          <div className="form-group">
            <label htmlFor="cliente-nombre">Nombre *</label>
            <input
              id="cliente-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente-nifcif">NIF/CIF (opcional)</label>
            <input
              id="cliente-nifcif"
              type="text"
              value={nifCif}
              onChange={(e) => setNifCif(e.target.value)}
              placeholder="B12345678"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente-direccion">Dirección *</label>
            <input
              id="cliente-direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección completa"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente-email">Email *</label>
            <input
              id="cliente-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente-telefono">Teléfono *</label>
            <input
              id="cliente-telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="600 000 000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente-tipo">Tipo de cliente</label>
            <select
              id="cliente-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCliente)}
            >
              <option value="empresa_autonomo">Empresa / Autónomo</option>
              <option value="particular">Particular</option>
            </select>
          </div>

          {error && <p className="error-message mb-4">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="primary">
              {editandoId ? 'Guardar cambios' : 'Añadir cliente'}
            </button>
            {editandoId && (
              <button type="button" className="secondary" onClick={handleCancelar}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {clientes.length === 0 ? (
        <p className="text-muted" style={{ fontStyle: 'italic' }}>
          No hay clientes registrados
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>NIF/CIF</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nombre}</td>
                <td>{cliente.nifCif || '—'}</td>
                <td>{cliente.email}</td>
                <td>{cliente.tipo === 'empresa_autonomo' ? 'Empresa/Autónomo' : 'Particular'}</td>
                <td>
                  <button className="secondary" onClick={() => handleEditar(cliente)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
