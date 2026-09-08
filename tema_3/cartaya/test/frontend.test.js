import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { levantarApp } from './helpers.js';
import { crearCategoria, crearPlato } from '../src/catalogo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');

// --- Task 4.1: el build genera estáticos y Express los sirve ---

test('frontend :: el build genera index.html y assets en frontend/dist', () => {
  const dist = path.join(raiz, 'frontend', 'dist');
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'falta index.html del build');
  const assets = fs.readdirSync(path.join(dist, 'assets'));
  assert.ok(assets.some((f) => f.endsWith('.js')), 'falta bundle JS');
  assert.ok(assets.some((f) => f.endsWith('.css')), 'falta hoja de estilos');
});

test('frontend :: Express sirve la carta pública en la raíz', async (t) => {
  const staticsDir = path.join(raiz, 'frontend', 'dist');
  const app = await levantarApp({ staticsDir });
  t.after(() => app.cerrar());
  const res = await app.pedir('GET', '/');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /id="root"/);
});

// --- Task 4.2: la vista consume el contrato de /api/carta ---
// Verificamos el contrato de datos que la vista Carta.jsx consume:
// foto null cuando no hay foto, y sinAlergenos=true para la indicación "sin alérgenos".

test('frontend :: el contrato de la carta cubre caso sin foto y sin alérgenos', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());
  const cat = crearCategoria(app.db, { nombre: 'Bebidas' });
  crearPlato(app.db, { categoriaId: cat.id, nombre: 'Agua', precioCentimos: 100, sinAlergenos: true, alergenos: [] });
  const carta = await (await app.pedir('GET', '/api/carta')).json();
  const p = carta.categorias[0].platos[0];
  assert.equal(p.foto, null); // la vista no pinta <img> (sin hueco roto)
  assert.equal(p.sinAlergenos, true); // la vista muestra "Sin alérgenos"
  assert.ok('precio' in p); // precio con IVA formateado
});

// --- Task 4.3: estilos accesibles (contraste alto, tipografía, toque grande) ---

test('frontend :: la vista pública muestra "Sin alérgenos" y etiqueta las alérgenos', () => {
  const carta = fs.readFileSync(path.join(raiz, 'frontend', 'src', 'Carta.jsx'), 'utf8');
  assert.match(carta, /Sin alérgenos/, 'debe existir la indicación explícita "Sin alérgenos"');
  assert.match(carta, /Contiene:/, 'debe listar los alérgenos presentes');
});

test('carta-publica :: Carta legible a contraluz', () => {
  const css = fs.readFileSync(path.join(raiz, 'frontend', 'src', 'estilos.css'), 'utf8');
  // Tipografía base grande (>=18px).
  assert.match(css, /--tam-base:\s*18px/);
  // Objetivo táctil mínimo 48px.
  assert.match(css, /--toque-min:\s*48px/);
  // Foco visible para accesibilidad de teclado.
  assert.match(css, /:focus-visible/);
  // Contraste alto: texto oscuro sobre fondo claro.
  assert.match(css, /--color-texto:\s*#1a1a1a/);
  assert.match(css, /--color-fondo:\s*#fffdf8/);
});

// --- Task 4.4: la administración invoca la API de administración ---

test('catalogo-admin :: Administrar desde el móvil', () => {
  const admin = fs.readFileSync(path.join(raiz, 'frontend', 'src', 'Admin.jsx'), 'utf8');
  assert.match(admin, /\/api\/login/, 'debe autenticar por sesión');
  assert.match(admin, /\/api\/admin\/categorias/, 'debe gestionar categorías vía API admin');
  assert.match(admin, /\/api\/admin\/platos/, 'debe gestionar platos vía API admin');
  assert.match(admin, /archivar/, 'debe permitir archivar');
  assert.match(admin, /\/foto/, 'debe permitir subir foto a un plato');
  assert.match(admin, /type="file"/, 'debe ofrecer un control de subida de foto');
  assert.match(admin, /categorias\/reordenar/, 'debe permitir reordenar categorías');
  assert.match(admin, /platos\/reordenar/, 'debe permitir reordenar platos');
  assert.match(admin, /'PUT'/, 'debe permitir editar (PUT) categorías y platos');
  assert.match(admin, />Editar</, 'debe ofrecer un control de edición');
  // Controles cómodos para pantalla táctil: botones e inputs con toque mínimo (definido en CSS).
  const css = fs.readFileSync(path.join(raiz, 'frontend', 'src', 'estilos.css'), 'utf8');
  assert.match(css, /button[^{]*\{[^}]*min-height:\s*var\(--toque-min\)/s);
});
