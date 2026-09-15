import test from 'node:test';
import assert from 'node:assert/strict';

import { nuevaBD } from './helpers.js';
import { crearCategoria, crearPlato } from '../src/catalogo.js';
import { sembrarMesas, confirmarPedido, ErrorPedido } from '../src/pedidos.js';
import {
  avanzarEstado,
  cancelarPedido,
  listarActivosDelDia,
  listarHistoricoDelDia,
  ESTADO_EN_PREPARACION,
  ESTADO_SERVIDO,
  ESTADO_RECIBIDO,
} from '../src/cocina.js';
import { crearEmisorSSE, EVENTO_PEDIDO_NUEVO, EVENTO_PEDIDO_ACTUALIZADO } from '../src/sse.js';

// Emisor de pruebas que no publica en el bus global (aísla los tests).
function emisorNulo() {
  return { publicar() {} };
}

// Prepara una BD con una mesa y un plato activo, y confirma un pedido.
function bdConPedido(precio = 250) {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const cat = crearCategoria(db, { nombre: 'Desayunos' });
  const plato = crearPlato(db, {
    categoriaId: cat.id,
    nombre: 'Tostada',
    precioCentimos: precio,
    sinAlergenos: true,
    alergenos: [],
  });
  const conf = confirmarPedido(
    db,
    { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 2, nota: 'sin sal' }] },
    { emisor: emisorNulo() }
  );
  return { db, mesa, plato, conf };
}

// --- Task 2.1: avance de estado con transiciones estrictas ---

test('panel-cocina :: De recibido a en preparación', () => {
  const { db, conf } = bdConPedido();
  const r = avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor: emisorNulo() });
  assert.equal(r.estado, ESTADO_EN_PREPARACION);
  const fila = db.prepare('SELECT estado, preparado_en FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, ESTADO_EN_PREPARACION);
  assert.ok(fila.preparado_en, 'sella preparado_en');
});

test('panel-cocina :: De en preparación a servido', () => {
  const { db, conf } = bdConPedido();
  avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor: emisorNulo() });
  const r = avanzarEstado(db, conf.numeroPedido, ESTADO_SERVIDO, { emisor: emisorNulo() });
  assert.equal(r.estado, ESTADO_SERVIDO);
  const fila = db.prepare('SELECT estado, servido_en FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, ESTADO_SERVIDO);
  assert.ok(fila.servido_en, 'sella servido_en');
});

test('panel-cocina :: No se permite saltar estados', () => {
  const { db, conf } = bdConPedido();
  assert.throws(
    () => avanzarEstado(db, conf.numeroPedido, ESTADO_SERVIDO, { emisor: emisorNulo() }),
    ErrorPedido
  );
  const fila = db.prepare('SELECT estado FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, ESTADO_RECIBIDO, 'conserva su estado recibido');
});

test('panel-cocina :: No se permite retroceder de estado', () => {
  const { db, conf } = bdConPedido();
  avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor: emisorNulo() });
  assert.throws(
    () => avanzarEstado(db, conf.numeroPedido, ESTADO_RECIBIDO, { emisor: emisorNulo() }),
    ErrorPedido
  );
  const fila = db.prepare('SELECT estado FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, ESTADO_EN_PREPARACION, 'conserva en_preparacion');
});

// --- Task 2.2: cancelación solo en recibido ---

test('panel-cocina :: Cancelar un pedido recién recibido', () => {
  const { db, conf } = bdConPedido();
  const r = cancelarPedido(db, conf.numeroPedido, { emisor: emisorNulo() });
  assert.equal(r.estado, 'cancelado');
  const fila = db.prepare('SELECT estado, cancelado_en FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, 'cancelado');
  assert.ok(fila.cancelado_en, 'registra el momento de la cancelación');
  // No se borra: el pedido sigue existiendo.
  assert.ok(fila, 'el pedido cancelado se conserva');
});

test('panel-cocina :: No se cancela un pedido en preparación', () => {
  const { db, conf } = bdConPedido();
  avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor: emisorNulo() });
  assert.throws(() => cancelarPedido(db, conf.numeroPedido, { emisor: emisorNulo() }), ErrorPedido);
  const fila = db.prepare('SELECT estado FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, ESTADO_EN_PREPARACION);
});

test('panel-cocina :: No se cancela un pedido servido', () => {
  const { db, conf } = bdConPedido();
  avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor: emisorNulo() });
  avanzarEstado(db, conf.numeroPedido, ESTADO_SERVIDO, { emisor: emisorNulo() });
  assert.throws(() => cancelarPedido(db, conf.numeroPedido, { emisor: emisorNulo() }), ErrorPedido);
  const fila = db.prepare('SELECT estado FROM pedidos WHERE numero_pedido = ?').get(conf.numeroPedido);
  assert.equal(fila.estado, ESTADO_SERVIDO);
});

// --- Task 2.3: vista activa del día e histórico del día ---

test('panel-cocina :: Pedidos del día ordenados del más antiguo al más reciente', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const cat = crearCategoria(db, { nombre: 'C' });
  const plato = crearPlato(db, { categoriaId: cat.id, nombre: 'P', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  const a = confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] }, { emisor: emisorNulo() });
  const b = confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] }, { emisor: emisorNulo() });
  // Fuerza creado_en distinto: el primero, más antiguo.
  db.prepare('UPDATE pedidos SET creado_en = ? WHERE numero_pedido = ?').run('2000-01-01T10:00:00.000Z', a.numeroPedido);
  db.prepare('UPDATE pedidos SET creado_en = ? WHERE numero_pedido = ?').run('2000-01-01T11:00:00.000Z', b.numeroPedido);
  const activos = listarActivosDelDia(db, { referencia: new Date('2000-01-01T12:00:00.000Z') });
  assert.deepEqual(activos.map((p) => p.numeroPedido), [a.numeroPedido, b.numeroPedido]);
});

test('panel-cocina :: Detalle de cada pedido en la vista activa', () => {
  const { db, mesa } = bdConPedido();
  const activos = listarActivosDelDia(db);
  assert.equal(activos.length, 1);
  const p = activos[0];
  assert.equal(p.mesa, mesa.numero, 'incluye la mesa');
  assert.equal(p.estado, ESTADO_RECIBIDO, 'incluye el estado');
  assert.ok(p.creadoEn, 'incluye creado_en para el tiempo transcurrido');
  assert.equal(p.lineas.length, 1);
  assert.equal(p.lineas[0].nombre, 'Tostada');
  assert.equal(p.lineas[0].cantidad, 2);
  assert.equal(p.lineas[0].nota, 'sin sal', 'incluye la nota del cliente');
});

test('panel-cocina :: Solo pedidos del día', () => {
  const { db, conf } = bdConPedido();
  // Envejecer el pedido a ayer: no debe aparecer en la vista activa de hoy.
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  db.prepare('UPDATE pedidos SET creado_en = ? WHERE numero_pedido = ?').run(ayer.toISOString(), conf.numeroPedido);
  const activos = listarActivosDelDia(db);
  assert.equal(activos.length, 0, 'los pedidos de días anteriores no salen');
});

test('panel-cocina :: Un pedido servido pasa al histórico', () => {
  const { db, conf } = bdConPedido();
  avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor: emisorNulo() });
  avanzarEstado(db, conf.numeroPedido, ESTADO_SERVIDO, { emisor: emisorNulo() });
  assert.equal(listarActivosDelDia(db).length, 0, 'sale de la vista activa');
  const hist = listarHistoricoDelDia(db);
  assert.equal(hist.length, 1);
  assert.equal(hist[0].estado, ESTADO_SERVIDO);
});

test('panel-cocina :: Un pedido cancelado pasa al histórico', () => {
  const { db, conf } = bdConPedido();
  cancelarPedido(db, conf.numeroPedido, { emisor: emisorNulo() });
  assert.equal(listarActivosDelDia(db).length, 0, 'sale de la vista activa');
  const hist = listarHistoricoDelDia(db);
  assert.equal(hist.length, 1);
  assert.equal(hist[0].estado, 'cancelado');
});

test('panel-cocina :: Consultar el histórico del día', () => {
  const { db, conf, mesa } = bdConPedido();
  cancelarPedido(db, conf.numeroPedido, { emisor: emisorNulo() });
  const hist = listarHistoricoDelDia(db);
  const p = hist[0];
  assert.equal(p.mesa, mesa.numero, 'incluye la mesa');
  assert.equal(p.estado, 'cancelado', 'incluye el estado final');
  assert.equal(p.lineas[0].nombre, 'Tostada', 'incluye los platos con cantidades');
  assert.equal(p.lineas[0].cantidad, 2);
});

// --- Task 3.1: emisor SSE en memoria ---

test('panel-cocina :: el emisor SSE difunde y da de baja suscriptores', () => {
  const emisor = crearEmisorSSE();
  const recibidos = [];
  const escritorFalso = { write: (trozo) => recibidos.push(trozo) };
  const baja = emisor.suscribir(escritorFalso);
  emisor.publicar('pedido-nuevo', { numeroPedido: 7 });
  const evento = recibidos.find((t) => t.includes('event: pedido-nuevo'));
  assert.ok(evento, 'recibe el evento con nombre event:');
  assert.match(evento, /data: \{"numeroPedido":7\}/, 'incluye el data: en JSON');
  // Tras darse de baja, deja de recibir.
  const antes = recibidos.length;
  baja();
  emisor.publicar('pedido-nuevo', { numeroPedido: 8 });
  assert.equal(recibidos.length, antes, 'no recibe eventos tras la baja');
  emisor.cerrar();
});

// --- Task 3.2: las operaciones de dominio publican eventos ---

test('panel-cocina :: confirmar un pedido publica pedido-nuevo', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const cat = crearCategoria(db, { nombre: 'C' });
  const plato = crearPlato(db, { categoriaId: cat.id, nombre: 'P', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  const publicados = [];
  const emisor = { publicar: (evento, datos) => publicados.push({ evento, datos }) };
  confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] }, { emisor });
  assert.equal(publicados.length, 1);
  assert.equal(publicados[0].evento, EVENTO_PEDIDO_NUEVO);
  assert.equal(publicados[0].datos.mesa, mesa.numero);
});

test('panel-cocina :: avanzar y cancelar publican pedido-actualizado', () => {
  const { db, conf } = bdConPedido();
  const publicados = [];
  const emisor = { publicar: (evento, datos) => publicados.push({ evento, datos }) };
  avanzarEstado(db, conf.numeroPedido, ESTADO_EN_PREPARACION, { emisor });
  assert.equal(publicados.at(-1).evento, EVENTO_PEDIDO_ACTUALIZADO);

  const { db: db2, conf: conf2 } = bdConPedido();
  const publicados2 = [];
  const emisor2 = { publicar: (evento, datos) => publicados2.push({ evento, datos }) };
  cancelarPedido(db2, conf2.numeroPedido, { emisor: emisor2 });
  assert.equal(publicados2.at(-1).evento, EVENTO_PEDIDO_ACTUALIZADO);
});
