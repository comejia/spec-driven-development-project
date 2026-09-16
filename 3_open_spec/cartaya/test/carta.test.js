import test from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp, nuevaBD } from './helpers.js';
import { formatearPrecioEuros } from '../src/carta.js';
import {
  crearCategoria,
  crearPlato,
  archivarPlato,
  archivarCategoria,
  reordenarCategorias,
  reordenarPlatos,
} from '../src/catalogo.js';

// Utilidad: siembra una carta mínima con una categoría y un plato válido.
function sembrarBasico(db) {
  const cat = crearCategoria(db, { nombre: 'Desayunos' });
  const plato = crearPlato(db, {
    categoriaId: cat.id,
    nombre: 'Tostada con tomate',
    precioCentimos: 250,
    descripcion: 'Pan de pueblo con tomate y AOVE',
    sinAlergenos: false,
    alergenos: ['gluten'],
  });
  return { cat, plato };
}

// --- Requirement: Acceso público sin identificación ---

test('carta-publica :: Consulta anónima de la carta', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  sembrarBasico(app.db);
  // Sin sesión ni cabeceras de autenticación.
  const res = await app.pedir('GET', '/api/carta');
  assert.equal(res.status, 200);
  const carta = await res.json();
  assert.equal(carta.categorias.length, 1);
  assert.equal(carta.categorias[0].nombre, 'Desayunos');
});

// --- Requirement: Platos activos con orden manual dentro de la categoría ---

test('carta-publica :: La carta no registra al cliente', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  sembrarBasico(app.db);
  // Consultar la carta no crea sesión ni pide datos: no debe emitir set-cookie
  // de sesión ni exigir cabeceras de identificación.
  const res = await app.pedir('GET', '/api/carta');
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('set-cookie');
  assert.equal(setCookie, null, 'la carta pública no debe crear cookie de sesión');
});

test('carta-publica :: Se muestran todos los platos activos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const cat = crearCategoria(app.db, { nombre: 'Raciones' });
  for (const nombre of ['Croquetas', 'Tortilla', 'Ensaladilla']) {
    crearPlato(app.db, {
      categoriaId: cat.id,
      nombre,
      precioCentimos: 500,
      sinAlergenos: true,
      alergenos: [],
    });
  }
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias[0].platos.length, 3);
});

// --- Requirement: exclusiones (task 2.2) ---

test('carta-publica :: Un plato archivado no aparece', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const { plato } = sembrarBasico(app.db);
  crearPlato(app.db, {
    categoriaId: plato.categoria_id,
    nombre: 'Otro plato',
    precioCentimos: 300,
    sinAlergenos: true,
    alergenos: [],
  });
  archivarPlato(app.db, plato.id);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  const nombres = carta.categorias[0].platos.map((p) => p.nombre);
  assert.deepEqual(nombres, ['Otro plato']);
});

test('carta-publica :: Categoría sin platos activos no se muestra', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const cat = crearCategoria(app.db, { nombre: 'Vacía' });
  const plato = crearPlato(app.db, {
    categoriaId: cat.id,
    nombre: 'Único',
    precioCentimos: 300,
    sinAlergenos: true,
    alergenos: [],
  });
  archivarPlato(app.db, plato.id);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias.length, 0);
});

test('carta-publica :: Categoría archivada oculta sus platos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const { cat } = sembrarBasico(app.db); // categoría con un plato activo
  archivarCategoria(app.db, cat.id);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias.length, 0);
});

// --- Requirement: orden manual (task 2.3) ---

test('carta-publica :: Categorías en el orden definido por el dueño', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const nombres = ['Desayunos', 'Bocadillos', 'Raciones', 'Bebidas', 'Postres'];
  const ids = nombres.map((n) => {
    const c = crearCategoria(db, { nombre: n });
    crearPlato(db, {
      categoriaId: c.id,
      nombre: `plato-${n}`,
      precioCentimos: 200,
      sinAlergenos: true,
      alergenos: [],
    });
    return c.id;
  });
  reordenarCategorias(db, ids); // el orden definido por el dueño
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.deepEqual(
    carta.categorias.map((c) => c.nombre),
    nombres
  );
});

test('carta-publica :: Orden manual de los platos', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const cat = crearCategoria(db, { nombre: 'Bebidas' });
  const a = crearPlato(db, { categoriaId: cat.id, nombre: 'Café', precioCentimos: 120, sinAlergenos: true, alergenos: [] });
  const b = crearPlato(db, { categoriaId: cat.id, nombre: 'Zumo', precioCentimos: 200, sinAlergenos: true, alergenos: [] });
  const c = crearPlato(db, { categoriaId: cat.id, nombre: 'Agua', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  reordenarPlatos(db, cat.id, [c.id, a.id, b.id]); // Agua, Café, Zumo
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.deepEqual(
    carta.categorias[0].platos.map((p) => p.nombre),
    ['Agua', 'Café', 'Zumo']
  );
});

// --- Requirement: Información obligatoria por plato + alérgenos (task 2.4) ---

test('carta-publica :: Plato con todos sus datos y foto', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const cat = crearCategoria(db, { nombre: 'Desayunos' });
  crearPlato(db, {
    categoriaId: cat.id,
    nombre: 'Tostada',
    precioCentimos: 250,
    descripcion: 'Con tomate',
    fotoRuta: 'tostada.jpg',
    sinAlergenos: false,
    alergenos: ['gluten'],
  });
  const p = (await (await app.pedir('GET', '/api/carta')).json()).categorias[0].platos[0];
  assert.equal(p.nombre, 'Tostada');
  assert.equal(p.precio, formatearPrecioEuros(250)); // euros con IVA, formato es-ES
  assert.equal(p.descripcion, 'Con tomate');
  assert.equal(p.foto, '/fotos/tostada.jpg');
});

test('carta-publica :: Plato sin foto', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const cat = crearCategoria(db, { nombre: 'Desayunos' });
  crearPlato(db, { categoriaId: cat.id, nombre: 'Café', precioCentimos: 120, sinAlergenos: true, alergenos: [] });
  const p = (await (await app.pedir('GET', '/api/carta')).json()).categorias[0].platos[0];
  assert.equal(p.foto, null); // ausencia válida, sin hueco roto
  assert.equal(p.nombre, 'Café');
  assert.equal(p.precio, formatearPrecioEuros(120));
});

test('carta-publica :: Plato con alérgenos', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const cat = crearCategoria(db, { nombre: 'Raciones' });
  crearPlato(db, {
    categoriaId: cat.id,
    nombre: 'Croquetas',
    precioCentimos: 600,
    sinAlergenos: false,
    alergenos: ['gluten', 'lacteos'],
  });
  const p = (await (await app.pedir('GET', '/api/carta')).json()).categorias[0].platos[0];
  assert.equal(p.sinAlergenos, false);
  assert.deepEqual(p.alergenos.sort(), ['gluten', 'lacteos']);
});

test('carta-publica :: Plato sin alérgenos', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const cat = crearCategoria(db, { nombre: 'Bebidas' });
  crearPlato(db, { categoriaId: cat.id, nombre: 'Agua', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  const p = (await (await app.pedir('GET', '/api/carta')).json()).categorias[0].platos[0];
  assert.equal(p.sinAlergenos, true);
  assert.deepEqual(p.alergenos, []);
});

test('carta-publica :: Nunca se omite la información de alérgenos', async (t) => {
  const db = nuevaBD();
  const app = await levantarApp({ db });
  t.after(() => app.cerrar());
  const cat = crearCategoria(db, { nombre: 'Mixta' });
  crearPlato(db, { categoriaId: cat.id, nombre: 'Con', precioCentimos: 300, sinAlergenos: false, alergenos: ['soja'] });
  crearPlato(db, { categoriaId: cat.id, nombre: 'Sin', precioCentimos: 300, sinAlergenos: true, alergenos: [] });
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  for (const p of carta.categorias[0].platos) {
    // Cada plato lleva SIEMPRE información: o sinAlergenos=true o lista no vacía.
    const tieneInfo = p.sinAlergenos === true || (Array.isArray(p.alergenos) && p.alergenos.length > 0);
    assert.ok(tieneInfo, `el plato ${p.nombre} no declara alérgenos`);
  }
});
