import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { inicializarEsquema } from '../src/db.js';
import { crearCategoria, crearPlato, archivarPlato, archivarCategoria } from '../src/catalogo.js';
import {
  sembrarMesas,
  resolverMesaPorToken,
  platoActivo,
  prepararPedido,
  confirmarPedido,
  obtenerPedidoPorNumero,
  listarMesas,
} from '../src/pedidos.js';

function nuevaBD() {
  const db = new Database(':memory:');
  inicializarEsquema(db);
  return db;
}

function tablas(db) {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all()
    .map((f) => f.name);
}

// Prepara una carta mínima con una categoría y un plato activo. Devuelve { cat, plato }.
function cartaConUnPlato(db, { precio = 250, nombre = 'Tostada' } = {}) {
  const cat = crearCategoria(db, { nombre: `Categoría de ${nombre}` });
  const plato = crearPlato(db, {
    categoriaId: cat.id,
    nombre,
    precioCentimos: precio,
    sinAlergenos: true,
    alergenos: [],
  });
  return { cat, plato };
}

// --- Task 1.1: esquema de pedidos ---

test('pedidos-mesa :: el esquema crea las tablas mesas, pedidos y lineas_pedido', () => {
  const db = nuevaBD();
  const nombres = tablas(db);
  assert.ok(nombres.includes('mesas'), 'falta la tabla mesas');
  assert.ok(nombres.includes('pedidos'), 'falta la tabla pedidos');
  assert.ok(nombres.includes('lineas_pedido'), 'falta la tabla lineas_pedido');
  db.close();
});

test('pedidos-mesa :: inicializar el esquema con tablas de pedidos es idempotente', () => {
  const db = nuevaBD();
  assert.doesNotThrow(() => inicializarEsquema(db));
  assert.doesNotThrow(() => inicializarEsquema(db));
  db.close();
});

// --- Task 1.2: siembra idempotente de mesas ---

test('pedidos-mesa :: la siembra de mesas es idempotente y genera tokens únicos', () => {
  const db = nuevaBD();
  const primera = sembrarMesas(db, [1, 2, 3]);
  assert.equal(primera.length, 3);
  // Ejecutar de nuevo no duplica mesas.
  const segunda = sembrarMesas(db, [1, 2, 3]);
  assert.equal(segunda.length, 3);
  // Todos los tokens son únicos.
  const tokens = new Set(segunda.map((m) => m.token));
  assert.equal(tokens.size, 3, 'cada mesa debe tener un token único');
  db.close();
});

// --- Task 2.1: resolver mesa por token ---

test('pedidos-mesa :: Código de mesa desconocido', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  assert.ok(resolverMesaPorToken(db, mesa.token), 'un token válido resuelve la mesa');
  assert.equal(resolverMesaPorToken(db, 'token-inexistente'), null);
  assert.equal(resolverMesaPorToken(db, null), null);
  db.close();
});

// --- Task 2.2: plato activo ---

test('pedidos-mesa :: un plato de categoría archivada cuenta como inactivo', () => {
  const db = nuevaBD();
  const { cat, plato } = cartaConUnPlato(db);
  assert.equal(platoActivo(db, plato.id), true);
  // Archivar el plato lo desactiva.
  archivarPlato(db, plato.id);
  assert.equal(platoActivo(db, plato.id), false);

  // Un plato activo cuya categoría se archiva también queda inactivo.
  const { cat: cat2, plato: plato2 } = cartaConUnPlato(db, { nombre: 'Café', precio: 120 });
  assert.equal(platoActivo(db, plato2.id), true);
  archivarCategoria(db, cat2.id);
  assert.equal(platoActivo(db, plato2.id), false);
  db.close();
});

// --- Task 2.3: prepararPedido ---

test('pedidos-mesa :: Añadir un plato al pedido', () => {
  const db = nuevaBD();
  const { plato } = cartaConUnPlato(db, { precio: 250 });
  const resumen = prepararPedido(db, { lineas: [{ platoId: plato.id, cantidad: 2 }] });
  assert.equal(resumen.lineas.length, 1);
  assert.equal(resumen.lineas[0].cantidad, 2);
  assert.equal(resumen.totalCentimos, 500, 'total = 2 x 250 céntimos');
  db.close();
});

test('pedidos-mesa :: Cantidad debe ser un entero mayor que 0', () => {
  const db = nuevaBD();
  const { plato } = cartaConUnPlato(db);
  for (const cantidad of [0, -1, 1.5]) {
    assert.throws(
      () => prepararPedido(db, { lineas: [{ platoId: plato.id, cantidad }] }),
      /entero mayor que 0/,
      `cantidad ${cantidad} debería rechazarse`
    );
  }
  db.close();
});

test('pedidos-mesa :: Nota demasiado larga', () => {
  const db = nuevaBD();
  const { plato } = cartaConUnPlato(db);
  const nota = 'x'.repeat(141);
  assert.throws(
    () => prepararPedido(db, { lineas: [{ platoId: plato.id, cantidad: 1, nota }] }),
    /140 caracteres/
  );
  db.close();
});

test('pedidos-mesa :: Nota opcional', () => {
  const db = nuevaBD();
  const { plato } = cartaConUnPlato(db);
  const resumen = prepararPedido(db, { lineas: [{ platoId: plato.id, cantidad: 1 }] });
  assert.equal(resumen.lineas[0].nota, null, 'la línea sin nota se acepta con nota null');
  db.close();
});

test('pedidos-mesa :: Añadir una nota a una línea', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato } = cartaConUnPlato(db, { precio: 250 });
  // La nota se conserva en el resumen y en el pedido confirmado.
  const resumen = prepararPedido(db, { lineas: [{ platoId: plato.id, cantidad: 1, nota: 'sin cebolla' }] });
  assert.equal(resumen.lineas[0].nota, 'sin cebolla');
  const conf = confirmarPedido(db, {
    token: mesa.token,
    lineas: [{ platoId: plato.id, cantidad: 1, nota: 'sin cebolla' }],
  });
  const pedido = obtenerPedidoPorNumero(db, conf.numeroPedido);
  assert.equal(pedido.lineas[0].nota, 'sin cebolla', 'la nota se conserva en el pedido confirmado');
  db.close();
});

test('pedidos-mesa :: Retirar una línea del pedido', () => {
  const db = nuevaBD();
  const { plato: uno } = cartaConUnPlato(db, { nombre: 'Tostada', precio: 250 });
  const { plato: dos } = cartaConUnPlato(db, { nombre: 'Café', precio: 120 });
  // Con dos líneas el total suma ambas.
  const conDos = prepararPedido(db, {
    lineas: [{ platoId: uno.id, cantidad: 1 }, { platoId: dos.id, cantidad: 1 }],
  });
  assert.equal(conDos.totalCentimos, 370);
  // Al retirar una línea (el cliente la quita de su selección), el total se recalcula sin ella.
  const conUna = prepararPedido(db, { lineas: [{ platoId: uno.id, cantidad: 1 }] });
  assert.equal(conUna.lineas.length, 1);
  assert.equal(conUna.totalCentimos, 250, 'el total se recalcula sin la línea retirada');
  db.close();
});

// --- Task 2.4: confirmarPedido ---

test('pedidos-mesa :: Confirmación visible para el cliente', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato } = cartaConUnPlato(db, { precio: 250 });
  const conf = confirmarPedido(db, {
    token: mesa.token,
    lineas: [{ platoId: plato.id, cantidad: 2, nota: 'sin sal' }],
  });
  assert.ok(Number.isInteger(conf.numeroPedido) && conf.numeroPedido > 0);
  assert.equal(conf.estado, 'recibido');
  assert.equal(conf.totalCentimos, 500);
  db.close();
});

test('pedidos-mesa :: Un plato se archiva mientras el cliente decide', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato: activo } = cartaConUnPlato(db, { nombre: 'Tostada', precio: 250 });
  const { plato: aArchivar } = cartaConUnPlato(db, { nombre: 'Zumo', precio: 300 });
  // El cliente añadió ambos, pero uno se archiva antes de confirmar.
  archivarPlato(db, aArchivar.id);
  const conf = confirmarPedido(db, {
    token: mesa.token,
    lineas: [
      { platoId: activo.id, cantidad: 1 },
      { platoId: aArchivar.id, cantidad: 1 },
    ],
  });
  assert.equal(conf.lineasRetiradas.length, 1, 'se retira el plato inactivo');
  assert.equal(conf.lineasRetiradas[0].platoId, aArchivar.id);
  assert.equal(conf.totalCentimos, 250, 'el total se recalcula sin el plato retirado');
  db.close();
});

test('pedidos-mesa :: Todas las líneas retiradas por platos inactivos', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato } = cartaConUnPlato(db);
  archivarPlato(db, plato.id);
  assert.throws(
    () => confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] }),
    /vacío/
  );
  db.close();
});

test('pedidos-mesa :: No se confirma un pedido vacío', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  assert.throws(
    () => confirmarPedido(db, { token: mesa.token, lineas: [] }),
    /vacío/
  );
  db.close();
});

// --- Task 2.5: consultar estado por número ---

test('pedidos-mesa :: Consultar el estado del pedido', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato } = cartaConUnPlato(db, { precio: 250 });
  const conf = confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] });
  const pedido = obtenerPedidoPorNumero(db, conf.numeroPedido);
  assert.ok(pedido, 'el pedido debe existir');
  assert.equal(pedido.estado, 'recibido');
  assert.equal(pedido.lineas.length, 1);
  assert.equal(obtenerPedidoPorNumero(db, 9999), null, 'un número inexistente devuelve null');
  db.close();
});

// --- Task 2.6: varios pedidos por mesa ---

test('pedidos-mesa :: Segundo pedido de la misma mesa', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato } = cartaConUnPlato(db, { precio: 250 });
  const primero = confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] });
  const segundo = confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 3 }] });
  assert.notEqual(primero.numeroPedido, segundo.numeroPedido, 'números de pedido distintos');
  // Son pedidos independientes: dos filas en la tabla pedidos para la misma mesa.
  const cuenta = db.prepare('SELECT COUNT(*) AS n FROM pedidos WHERE mesa_id = ?').get(mesa.id).n;
  assert.equal(cuenta, 2);
  db.close();
});

// --- Task 2.7: privacidad por diseño (sin datos personales) ---

test('pedidos-mesa :: El pedido no recoge datos personales', () => {
  const db = nuevaBD();
  const [mesa] = sembrarMesas(db, [1]);
  const { plato } = cartaConUnPlato(db, { precio: 250 });
  const conf = confirmarPedido(db, { token: mesa.token, lineas: [{ platoId: plato.id, cantidad: 1 }] });

  // La tabla pedidos solo referencia la mesa; no hay columnas de datos personales.
  const columnas = db.prepare('PRAGMA table_info(pedidos)').all().map((c) => c.name);
  assert.ok(columnas.includes('mesa_id'), 'el pedido se asocia a la mesa');
  for (const prohibida of ['cliente', 'email', 'telefono', 'nombre_cliente', 'usuario']) {
    assert.ok(!columnas.includes(prohibida), `no debe existir la columna ${prohibida}`);
  }
  // El pedido guardado no expone identidad de persona.
  const pedido = obtenerPedidoPorNumero(db, conf.numeroPedido);
  assert.ok(!('cliente' in pedido) && !('email' in pedido) && !('telefono' in pedido));
  db.close();
});

// --- Task 6.2: listar mesas (dominio) ---

test('pedidos-mesa :: listarMesas devuelve las mesas sembradas con su token', () => {
  const db = nuevaBD();
  sembrarMesas(db, [1, 2, 3]);
  const mesas = listarMesas(db);
  assert.equal(mesas.length, 3);
  for (const m of mesas) {
    assert.ok(m.numero, 'cada mesa tiene número visible');
    assert.match(m.token, /^[0-9a-f]+$/, 'cada mesa tiene un token opaco');
  }
  db.close();
});
