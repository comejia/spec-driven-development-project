import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { levantarApp } from './helpers.js';
import { crearCategoria, crearPlato } from '../src/catalogo.js';

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64'
);

function nuevoDirFotos(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartaya-up-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

async function platoDePrueba(app) {
  const cat = crearCategoria(app.db, { nombre: 'Desayunos' });
  return crearPlato(app.db, {
    categoriaId: cat.id, nombre: 'Tostada', precioCentimos: 250, sinAlergenos: true, alergenos: [],
  });
}

async function subirFoto(app, platoId, { buffer, filename, type }) {
  const form = new FormData();
  form.append('foto', new Blob([buffer], { type }), filename);
  return app.pedir('POST', `/api/admin/platos/${platoId}/foto`, { body: form, raw: true });
}

// --- Requirement: Subida de fotos con límite de tamaño (task 3.5) ---

test('catalogo-admin :: Subir una foto válida', async (t) => {
  const dirFotos = nuevoDirFotos(t);
  const app = await levantarApp({ fotosDir: dirFotos });
  t.after(() => app.cerrar());
  await app.login();
  const plato = await platoDePrueba(app);

  const res = await subirFoto(app, plato.id, { buffer: PNG_1x1, filename: 'foto.png', type: 'image/png' });
  assert.equal(res.status, 200);

  // La carta pública muestra la foto en ese plato.
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  const foto = carta.categorias[0].platos[0].foto;
  assert.ok(foto && foto.startsWith('/fotos/'), 'la carta debe referenciar la foto');

  // El fichero existe en disco.
  const nombre = foto.replace('/fotos/', '');
  assert.ok(fs.existsSync(path.join(dirFotos, nombre)));
});

test('catalogo-admin :: Subir la foto de un plato desde la administración', async (t) => {
  const dirFotos = nuevoDirFotos(t);
  const app = await levantarApp({ fotosDir: dirFotos });
  t.after(() => app.cerrar());
  await app.login();
  const plato = await platoDePrueba(app);

  // La vista de administración envía la foto a la subida de administración.
  const res = await subirFoto(app, plato.id, { buffer: PNG_1x1, filename: 'foto.png', type: 'image/png' });
  assert.equal(res.status, 200);

  // La foto queda asociada al plato y se muestra en la carta pública.
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  const foto = carta.categorias[0].platos[0].foto;
  assert.ok(foto && foto.startsWith('/fotos/'), 'la foto debe quedar asociada al plato');
});

test('catalogo-admin :: Rechazar una foto demasiado grande', async (t) => {
  const dirFotos = nuevoDirFotos(t);
  const app = await levantarApp({ fotosDir: dirFotos });
  t.after(() => app.cerrar());
  await app.login();
  const plato = await platoDePrueba(app);

  // 5 MB + 1 byte.
  const grande = Buffer.alloc(5 * 1024 * 1024 + 1, 0x89);
  const res = await subirFoto(app, plato.id, { buffer: grande, filename: 'grande.png', type: 'image/png' });
  assert.equal(res.status, 413);
});

test('catalogo-admin :: Rechazar un formato de foto no admitido', async (t) => {
  const dirFotos = nuevoDirFotos(t);
  const app = await levantarApp({ fotosDir: dirFotos });
  t.after(() => app.cerrar());
  await app.login();
  const plato = await platoDePrueba(app);

  const res = await subirFoto(app, plato.id, {
    buffer: Buffer.from('GIF89a'), filename: 'animado.gif', type: 'image/gif',
  });
  assert.equal(res.status, 415);
});
