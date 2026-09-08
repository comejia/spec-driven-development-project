import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALERGENOS_UE,
  esAlergenoValido,
  validarDeclaracionAlergenos,
} from '../src/alergenos.js';

test('alérgenos: el catálogo UE tiene exactamente 14 alérgenos', () => {
  assert.equal(ALERGENOS_UE.length, 14);
  assert.equal(new Set(ALERGENOS_UE).size, 14, 'no debe haber duplicados');
});

test('alérgenos: estado válido "sin alérgenos" (sin filas) se acepta', () => {
  const r = validarDeclaracionAlergenos({ sinAlergenos: true, alergenos: [] });
  assert.equal(r.ok, true);
});

test('alérgenos: estado válido con >=1 alérgeno se acepta', () => {
  const r = validarDeclaracionAlergenos({ sinAlergenos: false, alergenos: ['gluten', 'lacteos'] });
  assert.equal(r.ok, true);
});

test('alérgenos: estado "sin información" se rechaza', () => {
  // Ni declaración explícita de ausencia ni lista de alérgenos.
  const r = validarDeclaracionAlergenos({ sinAlergenos: undefined, alergenos: [] });
  assert.equal(r.ok, false);
});

test('alérgenos: sin_alergenos=false pero lista vacía se rechaza', () => {
  const r = validarDeclaracionAlergenos({ sinAlergenos: false, alergenos: [] });
  assert.equal(r.ok, false);
});

test('alérgenos: sin_alergenos=true con alérgenos declarados se rechaza (incoherente)', () => {
  const r = validarDeclaracionAlergenos({ sinAlergenos: true, alergenos: ['gluten'] });
  assert.equal(r.ok, false);
});

test('alérgenos: un código fuera del catálogo UE se rechaza', () => {
  assert.equal(esAlergenoValido('gluten'), true);
  assert.equal(esAlergenoValido('inexistente'), false);
  const r = validarDeclaracionAlergenos({ sinAlergenos: false, alergenos: ['inexistente'] });
  assert.equal(r.ok, false);
});
