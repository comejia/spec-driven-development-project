import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { levantarApp } from './helpers.js';
import { crearCategoria, crearPlato } from '../src/catalogo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');

// Perfil 4G de gama media (conservador): ~1.6 Mbps efectivos de bajada,
// ~150 ms de latencia. Presupuesto total del escenario: < 2000 ms.
const ANCHO_BANDA_BPS = 1.6 * 1000 * 1000; // bits/segundo
const LATENCIA_MS = 150; // ida y vuelta típica en 4G
const PRESUPUESTO_MS = 2000;

function bytesDeCadena(s) {
  return Buffer.byteLength(s, 'utf8');
}

// Estima el tiempo de transferencia de un payload sobre el perfil 4G.
function msTransferencia(bytes) {
  const bits = bytes * 8;
  return (bits / ANCHO_BANDA_BPS) * 1000;
}

test('carta-publica :: Tiempo de carga aceptable', async (t) => {
  const app = await levantarApp();
  t.after(() => app.cerrar());

  // Siembra una carta realista para una cafetería: 6 categorías x ~8 platos.
  const categorias = ['Desayunos', 'Bocadillos', 'Raciones', 'Bebidas', 'Postres', 'Cafés'];
  for (const nombre of categorias) {
    const cat = crearCategoria(app.db, { nombre });
    for (let i = 0; i < 8; i++) {
      crearPlato(app.db, {
        categoriaId: cat.id,
        nombre: `${nombre} plato ${i}`,
        precioCentimos: 250 + i * 25,
        descripcion: 'Descripción breve del plato para la carta de la cafetería.',
        sinAlergenos: i % 2 === 0,
        alergenos: i % 2 === 0 ? [] : ['gluten', 'lacteos'],
      });
    }
  }

  // 1) El JSON de la carta se genera y sirve rápido en el servidor.
  const t0 = performance.now();
  const res = await app.pedir('GET', '/api/carta');
  const texto = await res.text();
  const servidorMs = performance.now() - t0;
  assert.equal(res.status, 200);

  // 2) El HTML + bundle del frontend son ligeros (se sirven como estáticos con caché).
  const dist = path.join(raiz, 'frontend', 'dist');
  const assets = fs.readdirSync(path.join(dist, 'assets'));
  const jsFile = assets.find((f) => f.endsWith('.js'));
  const cssFile = assets.find((f) => f.endsWith('.css'));
  const bytesHtml = fs.statSync(path.join(dist, 'index.html')).size;
  const bytesJs = fs.statSync(path.join(dist, 'assets', jsFile)).size;
  const bytesCss = fs.statSync(path.join(dist, 'assets', cssFile)).size;
  const bytesCarta = bytesDeCadena(texto);

  // Presupuesto de tiempo estimado en 4G de gama media:
  // latencia (2 idas y vueltas: HTML y luego API+assets en paralelo, aproximado
  // de forma conservadora como 3 tramos de latencia) + transferencia de todo el payload.
  const totalBytes = bytesHtml + bytesJs + bytesCss + bytesCarta;
  const estimado4gMs = LATENCIA_MS * 3 + msTransferencia(totalBytes) + servidorMs;

  // Diagnóstico visible en la salida del test.
  console.log(
    `[carga] servidor=${servidorMs.toFixed(1)}ms bytes(html=${bytesHtml}, js=${bytesJs}, css=${bytesCss}, carta=${bytesCarta}) estimado4G=${estimado4gMs.toFixed(0)}ms`
  );

  assert.ok(
    estimado4gMs < PRESUPUESTO_MS,
    `estimación 4G ${estimado4gMs.toFixed(0)}ms debe ser < ${PRESUPUESTO_MS}ms`
  );
});
