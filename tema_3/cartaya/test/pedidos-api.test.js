import test from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp } from './helpers.js';
import { crearCategoria, crearPlato, archivarPlato } from '../src/catalogo.js';
import { sembrarMesas } from '../src/pedidos.js';

// Prepara una app con una mesa sembrada y una carta con un plato activo.
async function appConMesaYPlato(t, { precio = 250 } = {}) {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const [mesa] = sembrarMesas(app.db, [1]);
  const cat = crearCategoria(app.db, { nombre: 'Desayunos' });
  const plato = crearPlato(app.db, {
    categoriaId: cat.id,
    nombre: 'Tostada',
    precioCentimos: precio,
    sinAlergenos: true,
    alergenos: [],
  });
  return { app, mesa, cat, plato };
}

// --- Task 3.1: GET /api/mesa/:token ---

test('pedidos-mesa :: Abrir la carta con la mesa identificada', async (t) => {
  const { app, mesa } = await appConMesaYPlato(t);
  const res = await app.pedir('GET', `/api/mesa/${mesa.token}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.numero, mesa.numero);
});

test('pedidos-mesa :: Código de mesa desconocido (API)', async (t) => {
  const { app } = await appConMesaYPlato(t);
  const res = await app.pedir('GET', '/api/mesa/token-inexistente');
  assert.equal(res.status, 404);
});

// --- Task 3.2: POST /api/pedidos/preparar ---

test('pedidos-mesa :: Revisar el resumen antes de enviar', async (t) => {
  const { app, plato } = await appConMesaYPlato(t, { precio: 250 });
  // Un segundo plato que se archiva para comprobar el aviso de retirada.
  const cat2 = crearCategoria(app.db, { nombre: 'Zumos' });
  const zumo = crearPlato(app.db, { categoriaId: cat2.id, nombre: 'Zumo', precioCentimos: 300, sinAlergenos: true, alergenos: [] });
  archivarPlato(app.db, zumo.id);

  const res = await app.pedir('POST', '/api/pedidos/preparar', {
    body: { lineas: [{ platoId: plato.id, cantidad: 2 }, { platoId: zumo.id, cantidad: 1 }] },
  });
  assert.equal(res.status, 200);
  const resumen = await res.json();
  assert.equal(resumen.totalCentimos, 500, 'total con IVA de 2 x 250');
  assert.ok(resumen.total.includes('€') || resumen.total.includes('EUR'), 'total formateado en euros');
  assert.equal(resumen.lineasRetiradas.length, 1, 'refleja la línea retirada por plato inactivo');
});

// --- Task 3.3: POST /api/pedidos ---

test('pedidos-mesa :: Confirmar sin datos personales', async (t) => {
  const { app, mesa, plato } = await appConMesaYPlato(t);
  const res = await app.pedir('POST', '/api/pedidos', {
    body: { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] },
  });
  assert.equal(res.status, 201);
  const conf = await res.json();
  assert.ok(conf.numeroPedido > 0);
  assert.equal(conf.estado, 'recibido');
  // La respuesta no incluye ningún dato personal.
  assert.ok(!('cliente' in conf) && !('email' in conf) && !('telefono' in conf));
});

test('pedidos-mesa :: No se confirma un pedido vacío (API)', async (t) => {
  const { app, mesa } = await appConMesaYPlato(t);
  const res = await app.pedir('POST', '/api/pedidos', {
    body: { token: mesa.token, lineas: [] },
  });
  assert.equal(res.status, 422);
});

test('pedidos-mesa :: Confirmar con mesa inválida se rechaza', async (t) => {
  const { app, plato } = await appConMesaYPlato(t);
  const res = await app.pedir('POST', '/api/pedidos', {
    body: { token: 'no-existe', lineas: [{ platoId: plato.id, cantidad: 1 }] },
  });
  assert.equal(res.status, 422);
});

// --- Task 3.4: GET /api/pedidos/:numeroPedido ---

test('pedidos-mesa :: Consultar el estado del pedido (API)', async (t) => {
  const { app, mesa, plato } = await appConMesaYPlato(t);
  const conf = await (await app.pedir('POST', '/api/pedidos', {
    body: { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] },
  })).json();
  const res = await app.pedir('GET', `/api/pedidos/${conf.numeroPedido}`);
  assert.equal(res.status, 200);
  const pedido = await res.json();
  assert.equal(pedido.numeroPedido, conf.numeroPedido);
  assert.equal(pedido.estado, 'recibido');
  // Un número inexistente responde 404.
  const noExiste = await app.pedir('GET', '/api/pedidos/999999');
  assert.equal(noExiste.status, 404);
});

// --- Task 3.5: endpoints públicos y alcance del pedido ---

test('pedidos-mesa :: El pedido no gestiona el pago ni extras', async (t) => {
  const { app, mesa, plato } = await appConMesaYPlato(t);
  // Los endpoints de pedido son PÚBLICOS: funcionan sin iniciar sesión.
  const resumen = await app.pedir('POST', '/api/pedidos/preparar', {
    body: { lineas: [{ platoId: plato.id, cantidad: 1 }] },
  });
  assert.equal(resumen.status, 200, 'preparar es público (no exige sesión)');
  const conf = await app.pedir('POST', '/api/pedidos', {
    body: { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] },
  });
  assert.equal(conf.status, 201, 'confirmar es público (no exige sesión)');
  const cuerpo = await conf.json();
  // El pedido no expone pago, propina, división de cuenta, camarero ni para llevar.
  for (const campo of ['pago', 'propina', 'dividir', 'camarero', 'paraLlevar']) {
    assert.ok(!(campo in cuerpo), `el pedido no debe exponer ${campo}`);
  }
});

// --- Task 6.1: GET /api/admin/mesas (visualización de mesas con QR) ---

test('pedidos-mesa :: Ver las mesas con su QR', async (t) => {
  const { app } = await appConMesaYPlato(t);
  // Se siembran dos mesas más para tener varias.
  sembrarMesas(app.db, [2, 3]);
  await app.login();
  const res = await app.pedir('GET', '/api/admin/mesas');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.mesas), 'devuelve la lista de mesas');
  assert.ok(body.mesas.length >= 1);
  // Cada mesa incluye número y token (para construir el QR /?mesa=<token>).
  for (const m of body.mesas) {
    assert.ok(m.numero);
    assert.ok(m.token);
  }
});

test('pedidos-mesa :: La visualización de mesas requiere sesión', async (t) => {
  const { app } = await appConMesaYPlato(t);
  // Sin login: se deniega y no se exponen tokens.
  const res = await app.pedir('GET', '/api/admin/mesas');
  assert.equal(res.status, 401);
});
