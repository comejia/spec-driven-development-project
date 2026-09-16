import test from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp } from './helpers.js';
import { crearEmisorSSE } from '../src/sse.js';
import { crearCategoria, crearPlato } from '../src/catalogo.js';
import { sembrarMesas } from '../src/pedidos.js';

// Levanta la app con un emisor SSE aislado por test.
async function appCocina(t) {
  const emisor = crearEmisorSSE();
  const app = await levantarApp({ emisor });
  t.after(() => {
    app.cerrar();
    emisor.cerrar();
  });
  const [mesa] = sembrarMesas(app.db, [1]);
  const cat = crearCategoria(app.db, { nombre: 'Desayunos' });
  const plato = crearPlato(app.db, {
    categoriaId: cat.id,
    nombre: 'Tostada',
    precioCentimos: 250,
    sinAlergenos: true,
    alergenos: [],
  });
  return { app, mesa, plato, emisor };
}

async function confirmar(app, mesa, plato, cantidad = 1) {
  const res = await app.pedir('POST', '/api/pedidos', {
    body: { token: mesa.token, lineas: [{ platoId: plato.id, cantidad }] },
  });
  return res.json();
}

// --- Task 4.1: GET pedidos del día e histórico (sesión requerida) ---

test('panel-cocina :: El panel requiere sesión', async (t) => {
  const { app } = await appCocina(t);
  for (const ruta of ['/api/admin/cocina/pedidos', '/api/admin/cocina/historico', '/api/admin/cocina/stream']) {
    const res = await app.pedir('GET', ruta);
    assert.equal(res.status, 401, `${ruta} debe exigir sesión`);
  }
});

test('panel-cocina :: Acceso con sesión válida', async (t) => {
  const { app, mesa, plato } = await appCocina(t);
  await confirmar(app, mesa, plato);
  await app.login();
  const res = await app.pedir('GET', '/api/admin/cocina/pedidos');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.pedidos));
  assert.equal(body.pedidos.length, 1);
  assert.equal(body.pedidos[0].mesa, mesa.numero);
});

// --- Task 4.2: avanzar y cancelar por API ---

test('panel-cocina :: avanzar estado válido responde 200 con el nuevo estado', async (t) => {
  const { app, mesa, plato } = await appCocina(t);
  const conf = await confirmar(app, mesa, plato);
  await app.login();
  const res = await app.pedir('POST', `/api/admin/cocina/pedidos/${conf.numeroPedido}/avanzar`, {
    body: { estado: 'en_preparacion' },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.estado, 'en_preparacion');
});

test('panel-cocina :: un salto de estado responde 422 sin cambiar el estado', async (t) => {
  const { app, mesa, plato } = await appCocina(t);
  const conf = await confirmar(app, mesa, plato);
  await app.login();
  const res = await app.pedir('POST', `/api/admin/cocina/pedidos/${conf.numeroPedido}/avanzar`, {
    body: { estado: 'servido' },
  });
  assert.equal(res.status, 422);
  // El estado no cambió.
  const fila = app.db.prepare('SELECT estado FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, 'recibido');
});

test('panel-cocina :: cancelar fuera de recibido responde 422 sin cambiar el estado', async (t) => {
  const { app, mesa, plato } = await appCocina(t);
  const conf = await confirmar(app, mesa, plato);
  await app.login();
  await app.pedir('POST', `/api/admin/cocina/pedidos/${conf.numeroPedido}/avanzar`, {
    body: { estado: 'en_preparacion' },
  });
  const res = await app.pedir('POST', `/api/admin/cocina/pedidos/${conf.numeroPedido}/cancelar`);
  assert.equal(res.status, 422);
  const fila = app.db.prepare('SELECT estado FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, 'en_preparacion');
});

// --- Task 4.3: stream SSE ---

// Lee del stream SSE hasta encontrar `subcadena` o agotar el tiempo.
async function leerHasta(res, subcadena, ms = 2000) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acumulado = '';
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    const { value, done } = await reader.read();
    if (done) break;
    acumulado += decoder.decode(value, { stream: true });
    if (acumulado.includes(subcadena)) {
      reader.cancel().catch(() => {});
      return acumulado;
    }
  }
  reader.cancel().catch(() => {});
  return acumulado;
}

test('panel-cocina :: Un pedido nuevo aparece solo', async (t) => {
  const { app, mesa, plato } = await appCocina(t);
  await app.login();
  // Abre el stream y espera a estar suscrito antes de confirmar.
  const stream = await app.pedir('GET', '/api/admin/cocina/stream', { headers: { accept: 'text/event-stream' } });
  assert.equal(stream.status, 200);
  assert.match(stream.headers.get('content-type'), /text\/event-stream/);
  await new Promise((r) => setTimeout(r, 50));
  await confirmar(app, mesa, plato);
  const recibido = await leerHasta(stream, 'pedido-nuevo');
  assert.match(recibido, /event: pedido-nuevo/);
});

test('panel-cocina :: Un cambio de estado se refleja en vivo', async (t) => {
  const { app, mesa, plato } = await appCocina(t);
  const conf = await confirmar(app, mesa, plato);
  await app.login();
  const stream = await app.pedir('GET', '/api/admin/cocina/stream', { headers: { accept: 'text/event-stream' } });
  await new Promise((r) => setTimeout(r, 50));
  await app.pedir('POST', `/api/admin/cocina/pedidos/${conf.numeroPedido}/avanzar`, {
    body: { estado: 'en_preparacion' },
  });
  const recibido = await leerHasta(stream, 'pedido-actualizado');
  assert.match(recibido, /event: pedido-actualizado/);
});
