import { useState, useEffect } from 'react'
import type { Perfil } from '../../types'
import { cargarPerfil, guardarPerfil, esPerfilCompleto, validarLogo } from '../../services/perfil'

const perfilVacio: Perfil = {
  nombre: '',
  nif: '',
  direccion: '',
  telefono: '',
  email: '',
  logo: '',
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil>(perfilVacio)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState('')

  useEffect(() => {
    const guardado = cargarPerfil()
    if (guardado) {
      setPerfil(guardado)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setPerfil((prev) => ({ ...prev, [name]: value }))
    setMensaje('')
    setError('')
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLogoError('')
    const file = e.target.files?.[0]
    if (!file) return

    const resultado = await validarLogo(file)
    if (!resultado.valido) {
      setLogoError(resultado.error ?? 'Error al cargar el logo')
      return
    }

    setPerfil((prev) => ({ ...prev, logo: resultado.dataUrl ?? '' }))
    setMensaje('')
  }

  function handleGuardar() {
    setError('')
    setMensaje('')

    if (!perfil.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!perfil.nif.trim()) {
      setError('El NIF es obligatorio')
      return
    }
    if (!perfil.direccion.trim()) {
      setError('La dirección es obligatoria')
      return
    }
    if (!perfil.telefono.trim()) {
      setError('El teléfono es obligatorio')
      return
    }
    if (!perfil.email.trim()) {
      setError('El email es obligatorio')
      return
    }
    if (!perfil.logo.trim()) {
      setError('El logo es obligatorio')
      return
    }

    guardarPerfil(perfil)
    setMensaje('Perfil guardado correctamente')
  }

  const completo = esPerfilCompleto(perfil)

  return (
    <div>
      <h1>Mi Perfil</h1>
      <p className="text-secondary mb-6">
        Datos del freelance que aparecerán en los presupuestos.
      </p>

      {!completo && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span>El perfil está incompleto. Rellena todos los campos para poder generar presupuestos.</span>
        </div>
      )}

      <div className="card">
        <div className="form-group">
          <label htmlFor="nombre">Nombre / Razón social</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={perfil.nombre}
            onChange={handleChange}
            placeholder="Tu nombre o razón social"
          />
        </div>

        <div className="form-group">
          <label htmlFor="nif">NIF</label>
          <input
            id="nif"
            name="nif"
            type="text"
            value={perfil.nif}
            onChange={handleChange}
            placeholder="12345678A"
          />
        </div>

        <div className="form-group">
          <label htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            value={perfil.direccion}
            onChange={handleChange}
            placeholder="Calle, número, ciudad, CP"
          />
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={perfil.telefono}
            onChange={handleChange}
            placeholder="600 000 000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={perfil.email}
            onChange={handleChange}
            placeholder="tu@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="logo">Logo (PNG o JPG, máx. 2MB)</label>
          <input
            id="logo"
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleLogoChange}
          />
          {logoError && <p className="error-message">{logoError}</p>}
          {perfil.logo && (
            <div className="perfil-logo-preview">
              <img
                src={perfil.logo}
                alt="Logo preview"
              />
            </div>
          )}
        </div>

        {error && <p className="error-message mb-4">{error}</p>}
        {mensaje && <div className="success-message mb-4">{mensaje}</div>}

        <button className="primary" onClick={handleGuardar}>
          Guardar perfil
        </button>
      </div>
    </div>
  )
}
