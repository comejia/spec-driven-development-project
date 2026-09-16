import test from 'node:test';
import assert from 'node:assert/strict';

// Test de humo: confirma que el runner descubre y ejecuta los tests.
test('humo: el runner de tests funciona', () => {
  assert.equal(1 + 1, 2);
});
