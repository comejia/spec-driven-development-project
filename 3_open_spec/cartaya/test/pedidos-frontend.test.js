import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');
const src = path.join(raiz, 'frontend', 'src');

function leer(archivo) {
  return fs.readFileSync(path.join(src, archivo), 'utf8');
}

// --- Task 4.1: el token de mesa en la URL activa el modo pedido ---

test('pedidos-mesa :: la carta se abre con la mesa identificada por su token (frontend)', () => {
  const main = leer('main.jsx');
  // Se detecta el parámetro de mesa en la URL y se enruta a Pedido.
  assert.match(main, /URLSearchParams|location\.search/, 'debe leer el token de mesa de la URL');
  assert.match(main, /Pedido/, 'debe renderizar el componente Pedido en modo pedido');
  const pedido = leer('Pedido.jsx');
  assert.match(pedido, /\/api\/mesa\//, 'debe resolver la mesa vía GET /api/mesa/:token');
});

test('pedidos-mesa :: sin token de mesa la carta se comporta como consulta (frontend)', () => {
  const main = leer('main.jsx');
  // Sin token, se renderiza la Carta pública de solo lectura.
  assert.match(main, /token \? <Pedido[^>]*\/> : <Carta \/>/s, 'sin token debe mostrar la Carta pública');
});

// --- Task 4.2: control de cantidad (entero > 0) y nota con tope 140 ---

test('pedidos-mesa :: la UI impide cantidad 0/negativa y notas > 140 (frontend)', () => {
  const pedido = leer('Pedido.jsx');
  // Cantidad: input numérico con mínimo 1 y validación de entero > 0.
  assert.match(pedido, /min="1"/, 'la cantidad mínima es 1');
  assert.match(pedido, /Number\.isInteger\(n\)\s*\|\|\s*n\s*<=\s*0/, 'rechaza cantidades no enteras o <= 0');
  // Nota: tope de 140 caracteres.
  assert.match(pedido, /MAX_NOTA\s*=\s*140/, 'define el tope de 140 caracteres');
  assert.match(pedido, /maxLength=\{MAX_NOTA\}/, 'el campo de nota limita a 140 caracteres');
  assert.match(pedido, /slice\(0, MAX_NOTA\)/, 'trunca la nota al máximo');
});

// --- Task 4.3: pantalla de resumen con total y aviso de retirada ---

test('pedidos-mesa :: el resumen muestra el total y el aviso de retirada (frontend)', () => {
  const pedido = leer('Pedido.jsx');
  assert.match(pedido, /\/api\/pedidos\/preparar/, 'el resumen usa POST /api/pedidos/preparar');
  assert.match(pedido, /resumen\.total/, 'muestra el total en euros');
  assert.match(pedido, /lineasRetiradas/, 'muestra el aviso de líneas retiradas');
});

// --- Task 4.4: confirmación con número de pedido y estado, sin datos personales ---

test('pedidos-mesa :: tras confirmar se muestra número y estado sin datos personales (frontend)', () => {
  const pedido = leer('Pedido.jsx');
  assert.match(pedido, /method: 'POST'[\s\S]*\/api\/pedidos'/, 'confirma con POST /api/pedidos');
  assert.match(pedido, /numeroPedido/, 'muestra el número de pedido');
  assert.match(pedido, /confirmacion\.estado/, 'muestra el estado del pedido');
  // No hay campos de datos personales en el flujo (privacidad por diseño).
  assert.doesNotMatch(pedido, /type="email"/, 'no debe pedir email');
  assert.doesNotMatch(pedido, /type="tel"/, 'no debe pedir teléfono');
});

// --- Task 4.5: accesibilidad de las vistas de pedido ---

test('pedidos-mesa :: los controles de pedido son accesibles y táctiles (frontend)', () => {
  const css = fs.readFileSync(path.join(src, 'estilos.css'), 'utf8');
  // Reutiliza los tokens de accesibilidad existentes.
  assert.match(css, /--tam-base:\s*18px/, 'tipografía base grande');
  assert.match(css, /--toque-min:\s*48px/, 'objetivo táctil mínimo de 48px');
  // Los botones e inputs de pedido heredan el tamaño táctil mínimo.
  assert.match(css, /button[^{]*\{[^}]*min-height:\s*var\(--toque-min\)/s, 'botones con toque mínimo');
  assert.match(css, /input, select, textarea \{[^}]*min-height:\s*var\(--toque-min\)/s, 'campos con toque mínimo');
  // Contador de nota con aria-live para lectores de pantalla.
  const pedido = leer('Pedido.jsx');
  assert.match(pedido, /aria-live="polite"/, 'el contador y la confirmación anuncian cambios');
});

// --- Task 6.3 / 6.5: sección de mesas con QR en /admin ---

test('pedidos-mesa :: la administración muestra las mesas con su QR (frontend)', () => {
  const admin = leer('Admin.jsx');
  // Consume el endpoint de mesas y genera el QR en cliente.
  assert.match(admin, /\/api\/admin\/mesas/, 'pide las mesas a /api/admin/mesas');
  assert.match(admin, /generarQRSvg/, 'genera el QR en el cliente');
  assert.match(admin, /\?mesa=/, 'el enlace del QR apunta al pedido de la mesa');
  assert.match(admin, /window\.location\.origin/, 'usa la URL absoluta del propio sitio');
  assert.match(admin, /<SeccionMesas \/>/, 'la vista de administración incluye la sección de mesas');
});

test('pedidos-mesa :: la sección de mesas tiene estilos accesibles e imprimibles (frontend)', () => {
  const css = fs.readFileSync(path.join(src, 'estilos.css'), 'utf8');
  // El QR tiene un tamaño suficiente para escanear/imprimir y se renderiza nítido.
  assert.match(css, /\.mesa__qr svg \{[^}]*width:\s*200px/s, 'el QR tiene tamaño imprimible');
  assert.match(css, /\.mesa__qr svg \{[^}]*shape-rendering:\s*crispEdges/s, 'el QR se renderiza sin suavizado (nítido)');
});

// --- Task 6.7: administración organizada en pestañas Carta / Mesas ---

test('pedidos-mesa :: Carta activa por defecto', () => {
  const admin = leer('Admin.jsx');
  // La pestaña activa arranca en 'carta'.
  assert.match(admin, /useState\('carta'\)/, "la pestaña activa por defecto es 'carta'");
  // El contenido de cada pestaña solo se muestra cuando está activa.
  assert.match(admin, /pestana === 'mesas' && <SeccionMesas \/>/, 'las mesas se muestran solo en su pestaña');
  assert.match(admin, /pestana === 'carta' &&/, 'la carta se muestra solo en su pestaña');
});

test('pedidos-mesa :: Cambiar a la pestaña Mesas', () => {
  const admin = leer('Admin.jsx');
  assert.match(admin, /role="tablist"/, 'hay una barra de pestañas');
  assert.match(admin, /setPestana\('carta'\)/, 'control de la pestaña Carta');
  assert.match(admin, /setPestana\('mesas'\)/, 'control de la pestaña Mesas');
});

test('pedidos-mesa :: El QR enlaza al pedido de la mesa', () => {
  // El QR de cada mesa se genera a partir del enlace de pedido /?mesa=<token>,
  // de modo que al escanearlo se abre la carta con esa mesa identificada.
  const admin = leer('Admin.jsx');
  assert.match(
    admin,
    /generarQRSvg\(\s*enlace/,
    'el QR se genera a partir del enlace de la mesa'
  );
  assert.match(
    admin,
    /const enlace = `\$\{window\.location\.origin\}\/\?mesa=\$\{m\.token\}`/,
    'el enlace codificado es /?mesa=<token> del propio sitio'
  );
});
