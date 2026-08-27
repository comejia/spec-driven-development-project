import { Link } from 'react-router-dom'
import { cargarPresupuestos } from '../../services/presupuestos'
import { cargarClientes } from '../../services/clientes'
import { cargarCatalogo } from '../../services/catalogo'
import { cargarPerfil, esPerfilCompleto } from '../../services/perfil'

export default function InicioPage() {
  const presupuestos = cargarPresupuestos()
  const clientes = cargarClientes()
  const catalogo = cargarCatalogo()
  const perfil = cargarPerfil()
  const perfilCompleto = esPerfilCompleto(perfil)

  const borradores = presupuestos.filter((p) => p.estado === 'borrador').length
  const numerados = presupuestos.filter((p) => p.estado === 'numerado').length
  const totalPresupuestos = presupuestos.length
  const totalClientes = clientes.length
  const totalServicios = catalogo.length

  const hayDatos = totalPresupuestos > 0 || totalClientes > 0 || totalServicios > 0

  return (
    <div className="inicio-page">
      <h1>Inicio</h1>

      {/* T008: Aviso de perfil incompleto */}
      {!perfilCompleto && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span>
            Completa tu perfil para poder generar PDFs.{' '}
            <Link to="/perfil" className="alert-link">Ir al perfil</Link>
          </span>
        </div>
      )}

      {/* T007: Estado vacío */}
      {!hayDatos && (
        <div className="inicio-bienvenida card">
          <h2>¡Bienvenido a PresupuestosPro!</h2>
          <p>
            Tu herramienta para crear presupuestos profesionales.
            Empieza configurando tu perfil y añadiendo tus primeros clientes y servicios.
          </p>
          <div className="inicio-pasos">
            <p><strong>Para empezar:</strong></p>
            <ol>
              <li>Configura tu <Link to="/perfil">perfil profesional</Link></li>
              <li>Añade tus <Link to="/clientes">clientes</Link></li>
              <li>Define tu <Link to="/catalogo">catálogo de servicios</Link></li>
              <li>Crea tu primer <Link to="/presupuestos">presupuesto</Link></li>
            </ol>
          </div>
        </div>
      )}

      {/* T006: Resumen de actividad */}
      {hayDatos && (
        <div className="inicio-resumen">
          <h2>Resumen de actividad</h2>
          <div className="inicio-stats">
            <div className="inicio-stat card">
              <span className="inicio-stat-numero">{totalPresupuestos}</span>
              <span className="inicio-stat-label">Presupuestos</span>
              <span className="inicio-stat-detalle">
                {borradores} borrador{borradores !== 1 ? 'es' : ''} · {numerados} numerado{numerados !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="inicio-stat card">
              <span className="inicio-stat-numero">{totalClientes}</span>
              <span className="inicio-stat-label">Clientes</span>
            </div>
            <div className="inicio-stat card">
              <span className="inicio-stat-numero">{totalServicios}</span>
              <span className="inicio-stat-label">Servicios en catálogo</span>
            </div>
          </div>
        </div>
      )}

      {/* T006: Accesos directos */}
      <div className="inicio-accesos">
        <h2>Accesos directos</h2>
        <div className="inicio-accesos-grid">
          <Link to="/presupuestos" className="inicio-acceso card">
            <span className="inicio-acceso-icono">📄</span>
            <span className="inicio-acceso-titulo">Presupuestos</span>
            <span className="inicio-acceso-desc">Crear y gestionar presupuestos</span>
          </Link>
          <Link to="/clientes" className="inicio-acceso card">
            <span className="inicio-acceso-icono">👥</span>
            <span className="inicio-acceso-titulo">Clientes</span>
            <span className="inicio-acceso-desc">Gestionar tu cartera de clientes</span>
          </Link>
          <Link to="/catalogo" className="inicio-acceso card">
            <span className="inicio-acceso-icono">🗂️</span>
            <span className="inicio-acceso-titulo">Catálogo</span>
            <span className="inicio-acceso-desc">Servicios y precios</span>
          </Link>
          <Link to="/perfil" className="inicio-acceso card">
            <span className="inicio-acceso-icono">👤</span>
            <span className="inicio-acceso-titulo">Perfil</span>
            <span className="inicio-acceso-desc">Datos profesionales y logo</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
