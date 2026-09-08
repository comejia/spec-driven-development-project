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
  // Las tablas siguen existiendo exactamente igual.
  assert.deepEqual(tablas(db), ['categorias', 'platos', 'platos_alergenos']);
  db.close();
});
