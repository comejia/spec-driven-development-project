// Generación de códigos QR usando la librería `qrcode` (probada y conforme a
// ISO/IEC 18004). La codificación —Reed-Solomon, información de formato con BCH,
// enmascarado, versiones— la resuelve la librería, que produce QR que los
// lectores de móvil leen.

import QRCode from 'qrcode';

/**
 * Devuelve la matriz de módulos (0/1) del QR para un texto dado.
 * @returns {{ size:number, modules:number[][] }}
 */
export function generarMatrizQR(texto) {
  const qr = QRCode.create(String(texto), { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data; // Uint8Array size*size (1 = oscuro)
  const modules = [];
  for (let r = 0; r < size; r++) {
    const fila = new Array(size);
    for (let c = 0; c < size; c++) fila[c] = data[r * size + c] ? 1 : 0;
    modules.push(fila);
  }
  return { size, modules };
}

/**
 * Devuelve el QR como cadena SVG imprimible y nítida. La librería lo dibuja como
 * un único `<path>` con `shape-rendering="crispEdges"`, de modo que no se ve
 * borroso ni pixelado al escalarlo (a diferencia de dibujarlo con muchos
 * rectángulos, que deja bordes suavizados). `anchoPx` fija el tamaño en píxeles.
 */
export function generarQRSvg(texto, anchoPx = 200) {
  // toString con callback es síncrono en el renderer SVG: devuelve el string.
  let svg = '';
  QRCode.toString(
    String(texto),
    { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: anchoPx },
    (err, cadena) => {
      if (err) throw err;
      svg = cadena;
    }
  );
  return svg;
}
