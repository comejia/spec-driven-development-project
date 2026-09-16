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

// --- Task 5.1: enrutado /cocina y exigencia de sesión ---

test('panel-cocina :: la ruta /cocina renderiza el panel (frontend)', () => {
  const main = leer('main.jsx');
  assert.match(main, /startsWith\('\/cocina'\)/, 'main.jsx enruta /cocina');
  assert.match(main, /<Cocina \/>/, 'renderiza el componente Cocina');
});

test('panel-cocina :: El panel requiere sesión (frontend)', () => {
  const cocina = leer('Cocina.jsx');
  // Sin sesión (la carga responde 401) se muestra el Login; con sesión, el Panel.
  assert.match(cocina, /function Login/, 'incluye una pantalla de acceso');
  assert.match(cocina, /\/api\/login/, 'inicia sesión con la contraseña de establecimiento');
  assert.match(cocina, /r\.ok/, 'considera autenticado según la respuesta de la API');
});

// --- Task 5.2: vista activa, acciones y histórico ---

test('panel-cocina :: Detalle de cada pedido en la vista activa (frontend)', () => {
  const cocina = leer('Cocina.jsx');
  assert.match(cocina, /\/api\/admin\/cocina\/pedidos/, 'carga la vista activa del día');
  assert.match(cocina, /pedido\.mesa/, 'muestra la mesa');
  assert.match(cocina, /cocina-pedido__cantidad/, 'muestra las cantidades');
  assert.match(cocina, /l\.nota/, 'muestra las notas del cliente');
  assert.match(cocina, /tiempoTranscurrido/, 'muestra el tiempo transcurrido');
  assert.match(cocina, /ETIQUETA_ESTADO/, 'muestra el estado');
});

test('panel-cocina :: Cancelar un pedido recién recibido (frontend)', () => {
  const cocina = leer('Cocina.jsx');
  // El botón de cancelar solo se muestra cuando el pedido está en 'recibido'.
  assert.match(
    cocina,
    /pedido\.estado === 'recibido' &&[\s\S]*?Cancelar/,
    'el botón Cancelar solo aparece en estado recibido'
  );
  assert.match(cocina, /\/cancelar/, 'usa el endpoint de cancelación');
});

test('panel-cocina :: Consultar el histórico del día (frontend)', () => {
  const cocina = leer('Cocina.jsx');
  assert.match(cocina, /\/api\/admin\/cocina\/historico/, 'carga el histórico del día');
  assert.match(cocina, /Histórico del día/, 'muestra la sección de histórico');
});

// --- Task 5.3: actualización en vivo por SSE ---

test('panel-cocina :: Un pedido nuevo aparece solo (frontend)', () => {
  const cocina = leer('Cocina.jsx');
  assert.match(cocina, /new EventSource\('\/api\/admin\/cocina\/stream'\)/, 'se suscribe al stream SSE');
  assert.match(cocina, /addEventListener\('pedido-nuevo'/, 'reacciona a pedido-nuevo');
  assert.match(cocina, /setAviso/, 'muestra un aviso simple al llegar un pedido');
});

test('panel-cocina :: Un cambio de estado se refleja en vivo (frontend)', () => {
  const cocina = leer('Cocina.jsx');
  assert.match(cocina, /addEventListener\('pedido-actualizado'/, 'reacciona a pedido-actualizado');
  // No hay recarga de página: se vuelve a pedir el estado por la API.
  assert.doesNotMatch(cocina, /location\.reload/, 'no recarga la página');
});

// --- Task 5.4: estilos accesibles del panel ---

test('panel-cocina :: el panel tiene estilos accesibles y táctiles (frontend)', () => {
  const css = fs.readFileSync(path.join(src, 'estilos.css'), 'utf8');
  assert.match(css, /\.cocina\b/, 'define estilos del panel de cocina');
  assert.match(
    css,
    /\.cocina-pedido__acciones button \{[^}]*min-height:\s*var\(--toque-min\)/s,
    'los botones de acción respetan el objetivo táctil mínimo'
  );
});

// --- Task 6.2: alcance del panel (fuera de alcance) ---

test('panel-cocina :: El panel no incluye funciones fuera de alcance', () => {
  const cocina = leer('Cocina.jsx');
  // No hay métricas/estadísticas, impresión de tickets, turnos/empleados ni
  // sonido configurable: solo un aviso visual simple.
  assert.doesNotMatch(cocina, /estad[íi]stica|m[ée]trica/i, 'sin métricas ni estadísticas');
  assert.doesNotMatch(cocina, /imprimir|ticket|window\.print/i, 'sin impresión de tickets');
  assert.doesNotMatch(cocina, /turno|empleado/i, 'sin gestión de turnos ni empleados');
  assert.doesNotMatch(cocina, /new Audio|\.play\(\)|audio/i, 'sin notificaciones sonoras configurables');
});
