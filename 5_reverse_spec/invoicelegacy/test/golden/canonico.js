// canonico.js - formato estable del master y comparacion en profundidad (NO es codigo de produccion).
//
// Formato: JSON con claves ORDENADAS alfabeticamente en todos los niveles, sangria de
// 2 espacios, un salto de linea final, numeros con TODOS sus decimales (String(n), que
// es la representacion exacta mas corta de la coma flotante) y el cero negativo escrito
// como -0 (JSON.stringify lo pierde). NaN e infinitos no se admiten.

function serializar(valor, nivel) {
  nivel = nivel || 0;
  var sangria = new Array(nivel + 1).join('  ');
  var interior = new Array(nivel + 2).join('  ');
  if (valor === null) return 'null';
  if (typeof valor === 'number') {
    if (!isFinite(valor)) throw new Error('El master no admite NaN ni infinitos: ' + valor);
    return Object.is(valor, -0) ? '-0' : String(valor);
  }
  if (typeof valor === 'string') return JSON.stringify(valor);
  if (typeof valor === 'boolean') return String(valor);
  if (valor === undefined) throw new Error('El master no admite undefined');
  if (Array.isArray(valor)) {
    if (valor.length === 0) return '[]';
    return '[\n' + valor.map(function (v) { return interior + serializar(v, nivel + 1); }).join(',\n') + '\n' + sangria + ']';
  }
  var claves = Object.keys(valor).sort();
  if (claves.length === 0) return '{}';
  return '{\n' + claves.map(function (k) { return interior + JSON.stringify(k) + ': ' + serializar(valor[k], nivel + 1); }).join(',\n') + '\n' + sangria + '}';
}

function aTexto(valor) { return serializar(valor, 0) + '\n'; }

// lee un master (JSON valido, incluido -0)
function deTexto(texto) { return JSON.parse(texto); }

function mostrar(v) {
  if (v === undefined) return '(no existe)';
  if (typeof v === 'number' && Object.is(v, -0)) return '-0';
  return JSON.stringify(v);
}

// Devuelve la lista de diferencias entre esperado (master) y obtenido (regenerado),
// cada una con su ruta exacta: p. ej. "casos.G05.salida.factura.base"
function diferencias(esperado, obtenido, ruta, acumulado) {
  acumulado = acumulado || [];
  ruta = ruta || '';
  var te = Array.isArray(esperado) ? 'array' : esperado === null ? 'null' : typeof esperado;
  var to = Array.isArray(obtenido) ? 'array' : obtenido === null ? 'null' : typeof obtenido;
  if (te !== to) {
    acumulado.push({ ruta: ruta, esperado: esperado, obtenido: obtenido });
    return acumulado;
  }
  if (te === 'array') {
    var n = Math.max(esperado.length, obtenido.length);
    for (var i = 0; i < n; i++) diferencias(esperado[i], obtenido[i], ruta + '[' + i + ']', acumulado);
    return acumulado;
  }
  if (te === 'object') {
    var claves = {};
    Object.keys(esperado).forEach(function (k) { claves[k] = true; });
    Object.keys(obtenido).forEach(function (k) { claves[k] = true; });
    Object.keys(claves).sort().forEach(function (k) {
      diferencias(esperado[k], obtenido[k], ruta ? ruta + '.' + k : k, acumulado);
    });
    return acumulado;
  }
  if (te === 'number') {
    if (!Object.is(esperado, obtenido)) acumulado.push({ ruta: ruta, esperado: esperado, obtenido: obtenido });
    return acumulado;
  }
  if (esperado !== obtenido) acumulado.push({ ruta: ruta, esperado: esperado, obtenido: obtenido });
  return acumulado;
}

// "casos.G05.salida.factura.base" -> "Caso G05, campo salida.factura.base"
function describir(d) {
  var m = /^casos\.([^.]+)\.(.*)$/.exec(d.ruta);
  var donde = m ? 'Caso ' + m[1] + ', campo ' + m[2] : 'Campo ' + d.ruta;
  return donde + ': esperado ' + mostrar(d.esperado) + ', obtenido ' + mostrar(d.obtenido);
}

module.exports = { aTexto: aTexto, deTexto: deTexto, diferencias: diferencias, describir: describir };
