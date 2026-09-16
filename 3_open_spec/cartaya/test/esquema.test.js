import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { inicializarEsquema } from '../src/db.js';

function tablas(db) {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all()
    .map((f) => f.name);
}

test('esquema: sobre una BD vacía se crean las tablas', () => {
  const db = new Database(':memory:');
  inicializarEsquema(db);
  const nombres = tablas(db);
  assert.ok(nombres.includes('categorias'), 'falta la tabla categorias');
  assert.ok(nombres.includes('platos'), 'falta la tabla platos');
  assert.ok(nombres.includes('platos_alergenos'), 'falta la tabla platos_alergenos');
  db.close();
});

test('esquema: volver a ejecutar la inicialización es idempotente y no falla', () => {
  const db = new Database(':memory:');
  inicializarEsquema(db);
  // Segunda (y tercera) ejecución sobre la misma BD no debe lanzar.
  assert.doesNotThrow(() => inicializarEsquema(db));
  assert.doesNotThrow(() => inicializarEsquema(db));
  // Las tablas siguen existiendo exactamente igual (orden alfabético).
  assert.deepEqual(tablas(db), [
    'categorias',
    'lineas_pedido',
    'mesas',
    'pedidos',
    'platos',
    'platos_alergenos',
  ]);
  db.close();
});

function columnasPedidos(db) {
  return db.prepare('PRAGMA table_info(pedidos)').all().map((c) => c.name);
}

test('panel-cocina :: el esquema de pedidos incluye las marcas de estado de cocina', () => {
  const db = new Database(':memory:');
  inicializarEsquema(db);
  const columnas = columnasPedidos(db);
  for (const columna of ['preparado_en', 'servido_en', 'cancelado_en']) {
    assert.ok(columnas.includes(columna), `falta la columna ${columna} en pedidos`);
  }
  db.close();
});

test('panel-cocina :: la migración de columnas de estado es idempotente', () => {
  const db = new Database(':memory:');
  inicializarEsquema(db);
  // Reejecutar la inicialización (que incluye la migración) no falla ni duplica.
  assert.doesNotThrow(() => inicializarEsquema(db));
  const columnas = columnasPedidos(db);
  // Cada columna aparece exactamente una vez.
  for (const columna of ['preparado_en', 'servido_en', 'cancelado_en']) {
    assert.equal(
      columnas.filter((c) => c === columna).length,
      1,
      `la columna ${columna} no debe duplicarse`
    );
  }
  db.close();
});
