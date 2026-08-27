import { NavLink, Outlet, Link } from 'react-router-dom'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-inner">
          <Link to="/" className="layout-brand">
            PresupuestosPro
          </Link>
          <nav className="layout-nav" aria-label="Navegación principal">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Inicio
            </NavLink>
            <NavLink to="/presupuestos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Presupuestos
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Clientes
            </NavLink>
            <NavLink to="/catalogo" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Catálogo
            </NavLink>
            <NavLink to="/perfil" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Perfil
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
