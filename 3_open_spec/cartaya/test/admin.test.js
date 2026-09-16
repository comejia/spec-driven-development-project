import test from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp } from './helpers.js';

// Helpers de peticiones admin (asumen sesión ya iniciada salvo indicación).
async function crearCategoria(app, nombre) {
  const res = await app.pedir('POST', '/api/admin/categorias', { body: { nombre } });
  return res;
}
async function crearPlato(app, cuerpo) {
  return app.pedir('POST', '/api/admin/platos', { body: cuerpo });
}

// --- Requirement: Acceso a la administración protegido por sesión (task 3.1) ---

test('catalogo-admin :: Acceso sin sesión', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  // Sin login: cualquier operación admin se rechaza.
  const res = await app.pedir('POST', '/api/admin/categorias', { body: { nombre: 'Postres' } });
  assert.equal(res.status, 401);
});

test('catalogo-admin :: Acceso con sesión válida', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const login = await app.login();
  assert.equal(login.status, 200);
  const res = await crearCategoria(app, 'Postres');
  assert.equal(res.status, 201);
});

// --- Requirement: Gestión de categorías (task 3.2) ---

test('catalogo-admin :: Crear una categoría', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const res = await crearCategoria(app, 'Postres');
  assert.equal(res.status, 201);
  const cat = await res.json();
  assert.equal(cat.nombre, 'Postres');
  assert.ok(cat.id > 0);
});

test('catalogo-admin :: Reordenar categorías', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const a = await (await crearCategoria(app, 'Bebidas')).json();
  const b = await (await crearCategoria(app, 'Postres')).json();
  // Añade un plato a cada una para que aparezcan en la carta.
  await crearPlato(app, { categoriaId: a.id, nombre: 'Agua', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  await crearPlato(app, { categoriaId: b.id, nombre: 'Flan', precioCentimos: 250, sinAlergenos: true, alergenos: [] });

  const res = await app.pedir('POST', '/api/admin/categorias/reordenar', { body: { ids: [b.id, a.id] } });
  assert.equal(res.status, 200);

  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.deepEqual(carta.categorias.map((c) => c.nombre), ['Postres', 'Bebidas']);
});

test('catalogo-admin :: Nombre de categoría duplicado', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  assert.equal((await crearCategoria(app, 'Postres')).status, 201);
  // Mismo nombre con distinta capitalización y espacios sobrantes.
  const dup = await crearCategoria(app, '  postres  ');
  assert.equal(dup.status, 422);
});

// --- Requirement: Gestión de platos (task 3.3) ---

test('catalogo-admin :: El catálogo de administración muestra categorías sin platos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  // Categoría recién creada, todavía sin platos.
  await crearCategoria(app, 'Vacía');

  // En el catálogo de administración SÍ aparece (para poder añadirle platos).
  const cat = await (await app.pedir('GET', '/api/admin/catalogo')).json();
  assert.equal(cat.categorias.length, 1);
  assert.equal(cat.categorias[0].nombre, 'Vacía');
  assert.deepEqual(cat.categorias[0].platos, []);

  // En la carta pública NO aparece (regla de categorías vacías ocultas).
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias.length, 0);
});

test('catalogo-admin :: El catálogo de administración requiere sesión', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const res = await app.pedir('GET', '/api/admin/catalogo');
  assert.equal(res.status, 401);
});

async function categoriaBase(app, nombre = 'Desayunos') {
  return (await crearCategoria(app, nombre)).json();
}

test('catalogo-admin :: Crear un plato', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  const res = await crearPlato(app, {
    categoriaId: cat.id,
    nombre: 'Tostada con tomate',
    precioCentimos: 250,
    descripcion: 'Con AOVE',
    sinAlergenos: false,
    alergenos: ['gluten'],
  });
  assert.equal(res.status, 201);
  // Aparece en la carta pública.
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias[0].platos[0].nombre, 'Tostada con tomate');
});

test('catalogo-admin :: Editar el precio de un plato', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  const plato = await (await crearPlato(app, {
    categoriaId: cat.id, nombre: 'Café', precioCentimos: 120, sinAlergenos: true, alergenos: [],
  })).json();
  const res = await app.pedir('PUT', `/api/admin/platos/${plato.id}`, { body: { precioCentimos: 150 } });
  assert.equal(res.status, 200);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias[0].platos[0].precioCentimos, 150);
});

test('catalogo-admin :: Precio obligatorio y mayor que 0', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  for (const precio of [0, -100]) {
    const res = await crearPlato(app, { categoriaId: cat.id, nombre: `p${precio}`, precioCentimos: precio, sinAlergenos: true, alergenos: [] });
    assert.equal(res.status, 422, `precio ${precio} debería rechazarse`);
  }
});

test('catalogo-admin :: Descripción opcional con longitud máxima', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  // Sin descripción: se acepta.
  const sinDesc = await crearPlato(app, { categoriaId: cat.id, nombre: 'Sin desc', precioCentimos: 200, sinAlergenos: true, alergenos: [] });
  assert.equal(sinDesc.status, 201);
  // Descripción de 201 caracteres: se rechaza.
  const larga = 'x'.repeat(201);
  const res = await crearPlato(app, { categoriaId: cat.id, nombre: 'Larga', precioCentimos: 200, descripcion: larga, sinAlergenos: true, alergenos: [] });
  assert.equal(res.status, 422);
});

test('catalogo-admin :: Nombre de plato duplicado en la categoría', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  assert.equal((await crearPlato(app, { categoriaId: cat.id, nombre: 'Tostada', precioCentimos: 250, sinAlergenos: true, alergenos: [] })).status, 201);
  const dup = await crearPlato(app, { categoriaId: cat.id, nombre: '  tostada ', precioCentimos: 300, sinAlergenos: true, alergenos: [] });
  assert.equal(dup.status, 422);
});

test('catalogo-admin :: Declarar plato sin alérgenos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  const res = await crearPlato(app, { categoriaId: cat.id, nombre: 'Agua', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  assert.equal(res.status, 201);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias[0].platos[0].sinAlergenos, true);
});

test('catalogo-admin :: Un plato debe declarar alérgenos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  // Estado "sin información": ni sinAlergenos ni lista.
  const res = await crearPlato(app, { categoriaId: cat.id, nombre: 'Ambiguo', precioCentimos: 200 });
  assert.equal(res.status, 422);
});

// --- Requirement: Archivado en lugar de borrado (task 3.4) ---

test('catalogo-admin :: Archivar un plato', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  const plato = await (await crearPlato(app, { categoriaId: cat.id, nombre: 'Tostada', precioCentimos: 250, sinAlergenos: true, alergenos: [] })).json();
  await crearPlato(app, { categoriaId: cat.id, nombre: 'Café', precioCentimos: 120, sinAlergenos: true, alergenos: [] });
  const res = await app.pedir('POST', `/api/admin/platos/${plato.id}/archivar`);
  assert.equal(res.status, 200);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.deepEqual(carta.categorias[0].platos.map((p) => p.nombre), ['Café']);
});

test('catalogo-admin :: Archivar una categoría oculta sus platos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  await crearPlato(app, { categoriaId: cat.id, nombre: 'Tostada', precioCentimos: 250, sinAlergenos: true, alergenos: [] });
  const res = await app.pedir('POST', `/api/admin/categorias/${cat.id}/archivar`);
  assert.equal(res.status, 200);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.equal(carta.categorias.length, 0);
});

test('catalogo-admin :: El elemento archivado se conserva', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app);
  const plato = await (await crearPlato(app, { categoriaId: cat.id, nombre: 'Tostada', precioCentimos: 250, sinAlergenos: true, alergenos: [] })).json();
  await app.pedir('POST', `/api/admin/platos/${plato.id}/archivar`);
  // Se conserva en la BD (consulta directa): el registro sigue existiendo.
  const fila = app.db.prepare('SELECT id, archivado_en FROM platos WHERE id = ?').get(plato.id);
  assert.ok(fila, 'el plato archivado debe conservarse');
  assert.ok(fila.archivado_en, 'debe tener timestamp de archivado');
});

test('catalogo-admin :: Editar el nombre de una categoría vía API', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await (await crearCategoria(app, 'Desayuno')).json();
  const res = await app.pedir('PUT', `/api/admin/categorias/${cat.id}`, { body: { nombre: 'Desayunos' } });
  assert.equal(res.status, 200);
  const actualizada = await res.json();
  assert.equal(actualizada.nombre, 'Desayunos');
});

test('catalogo-admin :: Reordenar platos vía API', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  await app.login();
  const cat = await categoriaBase(app, 'Bebidas');
  const a = await (await crearPlato(app, { categoriaId: cat.id, nombre: 'Café', precioCentimos: 120, sinAlergenos: true, alergenos: [] })).json();
  const b = await (await crearPlato(app, { categoriaId: cat.id, nombre: 'Agua', precioCentimos: 100, sinAlergenos: true, alergenos: [] })).json();
  const res = await app.pedir('POST', '/api/admin/platos/reordenar', { body: { categoriaId: cat.id, ids: [b.id, a.id] } });
  assert.equal(res.status, 200);
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  assert.deepEqual(carta.categorias[0].platos.map((p) => p.nombre), ['Agua', 'Café']);
});
