import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import InicioPage from './components/Inicio/InicioPage'
import PerfilPage from './components/Perfil/PerfilPage'
import CatalogoPage from './components/Catalogo/CatalogoPage'
import ClientesPage from './components/Clientes/ClientesPage'
import PresupuestosPage from './components/Presupuestos/PresupuestosPage'
import PresupuestoEditor from './components/Presupuestos/PresupuestoEditor'
import './styles/global.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<InicioPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="presupuestos" element={<PresupuestosPage />} />
          <Route path="presupuestos/:id" element={<PresupuestoEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
