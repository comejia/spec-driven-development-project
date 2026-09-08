import React from 'react';
import { createRoot } from 'react-dom/client';
import Carta from './Carta.jsx';
import Admin from './Admin.jsx';
import Pedido from './Pedido.jsx';
import './estilos.css';

// Enrutado mínimo sin dependencias:
//  - /admin muestra la administración.
//  - Con ?mesa=<token> (QR de la mesa) se activa el modo pedido.
//  - Cualquier otro caso muestra la carta pública de solo consulta.
function App() {
  const esAdmin = window.location.pathname.startsWith('/admin');
  if (esAdmin) return <Admin />;
  const token = new URLSearchParams(window.location.search).get('mesa');
  return token ? <Pedido token={token} /> : <Carta />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
