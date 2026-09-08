import React from 'react';
import { createRoot } from 'react-dom/client';
import Carta from './Carta.jsx';
import Admin from './Admin.jsx';
import './estilos.css';

// Enrutado mínimo sin dependencias: /admin muestra la administración,
// cualquier otra ruta muestra la carta pública.
function App() {
  const esAdmin = window.location.pathname.startsWith('/admin');
  return esAdmin ? <Admin /> : <Carta />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
