import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { levantarApp } from './helpers.js';
import { crearCategoria, crearPlato } from '../src/catalogo.js';

// Un PNG mínimo válido (1x1) en base64.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64'
);

test('carta-publica :: una foto existente se sirve como estático con caché', async (t) => {
  const dirFotos = fs.mkdtempSync(path.join(os.tmpdir(), 'cartaya-fotos-'));
  t.after(() => fs.rmSync(dirFotos, { recursive: true, force: true }));

  const nombreFoto = 'plato.png';
  fs.writeFileSync(path.join(dirFotos, nombreFoto), PNG_1x1);

  const app = await levantarApp({ fotosDir: dirFotos });
  t.after(() => app.cerrar());

  const res = await app.pedir('GET', `/fotos/${nombreFoto}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /image\/png/);
  // Cabecera de caché presente.
  assert.match(res.headers.get('cache-control') ?? '', /max-age=\d+/);
  const cuerpo = Buffer.from(await res.arrayBuffer());
  assert.equal(cuerpo.length, PNG_1x1.length);
});

test('carta-publica :: la respuesta de la carta no embebe binarios de imagen', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());

  const cat = crearCategoria(app.db, { nombre: 'Desayunos' });
  crearPlato(app.db, {
    categoriaId: cat.id,
    nombre: 'Tostada',
    precioCentimos: 250,
    fotoRuta: 'tostada.jpg',
    sinAlergenos: true,
    alergenos: [],
  });

  const res = await app.pedir('GET', '/api/carta');
  const texto = await res.text();
  // La respuesta es JSON de texto: la foto es una ruta, no un binario/base64.
  const carta = JSON.parse(texto);
  const plato = carta.categorias[0].platos[0];
  assert.equal(plato.foto, '/fotos/tostada.jpg');
  // No debe haber data URIs ni binarios embebidos.
  assert.doesNotMatch(texto, /data:image\//);
  assert.doesNotMatch(texto, /base64/i);
});
