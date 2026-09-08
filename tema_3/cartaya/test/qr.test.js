import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';

import { generarMatrizQR, generarQRSvg } from '../frontend/src/qr.js';

// Rasteriza la matriz de módulos a un buffer RGBA (con quiet zone) para poder
// decodificarlo con jsQR, igual que lo haría la cámara de un móvil.
function matrizARGBA(modules, size, escala = 8, quiet = 4) {
  const dim = (size + quiet * 2) * escala;
  const data = new Uint8ClampedArray(dim * dim * 4);
  // Fondo blanco.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!modules[r][c]) continue;
      const x0 = (c + quiet) * escala;
      const y0 = (r + quiet) * escala;
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const idx = ((y0 + dy) * dim + (x0 + dx)) * 4;
          data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 255;
        }
      }
    }
  }
  return { data, dim };
}

// --- Task 6.4: el QR generado se DECODIFICA (prueba objetiva de que se lee) ---

test('pedidos-mesa :: el QR generado se decodifica correctamente', () => {
  const url = 'http://localhost:3000/?mesa=73863f45edef2cc772dcb9803f5da4d3';
  const { size, modules } = generarMatrizQR(url);
  const { data, dim } = matrizARGBA(modules, size);
  const resultado = jsQR(data, dim, dim);
  assert.ok(resultado, 'jsQR debe poder leer el QR generado');
  assert.equal(resultado.data, url, 'el contenido decodificado coincide con la URL de la mesa');
});

test('pedidos-mesa :: distintos tokens producen QR que decodifican a su propia URL', () => {
  for (const token of ['aaa111', 'bbb222', 'deadbeefcafe0001']) {
    const url = `https://cartaya.example/?mesa=${token}`;
    const { size, modules } = generarMatrizQR(url);
    const { data, dim } = matrizARGBA(modules, size);
    const resultado = jsQR(data, dim, dim);
    assert.ok(resultado, `debe leer el QR de ${token}`);
    assert.equal(resultado.data, url);
  }
});

// --- Task 6.4: salida SVG imprimible ---

test('pedidos-mesa :: el generador de QR produce un SVG imprimible no vacío', () => {
  const svg = generarQRSvg('https://cartaya.example/?mesa=abc123', 200);
  assert.match(svg, /^<svg[\s\S]*<\/svg>\s*$/, 'salida SVG bien formada');
  assert.match(svg, /<path/, 'contiene los módulos dibujados como path');
  assert.match(svg, /shape-rendering="crispEdges"/, 'se renderiza sin suavizado (nítido)');
  assert.ok(svg.length > 100, 'el SVG no está vacío');
});

test('pedidos-mesa :: distintos tokens producen QR distintos', () => {
  const a = generarQRSvg('https://cartaya.example/?mesa=aaa');
  const b = generarQRSvg('https://cartaya.example/?mesa=bbb');
  assert.notEqual(a, b, 'cada token genera un QR diferente');
});
