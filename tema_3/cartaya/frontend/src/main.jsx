import React from 'react';
import { createRoot } from 'react-dom/client';
import Carta from './Carta.jsx';
import Admin from './Admin.jsx';
import Cocina from './Cocina.jsx';
import Pedido from './Pedido.jsx';
import './estilos.css';

// Enrutado mínimo sin dependencias:
//  - /admin muestra la administración.
//  - /cocina muestra el panel de cocina (tras la sesión de establecimiento).
//  - Con ?mesa=<token> (QR de la mesa) se activa el modo pedido.
//  - Cualquier otro caso muestra la carta pública de solo consulta.
function App() {
  const ruta = window.location.pathname;
  if (ruta.startsWith('/admin')) return <Admin />;
  if (ruta.startsWith('/cocina')) return <Cocina />;
  const token = new URLSearchParams(window.location.search).get('mesa');
  return token ? <Pedido token={token} /> : <Carta />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
