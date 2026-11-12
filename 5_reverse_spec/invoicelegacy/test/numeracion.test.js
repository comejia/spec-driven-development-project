// Tests de caracterizacion de lib/numeracion.js (modulo de criticidad ALTA)
// ---------------------------------------------------------------------------
// numeracion.js necesita la BD, asi que se ejecuta en un proceso hijo con una BD
// temporal y un reloj fijo (ver ayudas/sandbox.js y ayudas/preload-fecha.js).
// Referencias: RN-35..RN-40 y registro-de-anomalias.md (A-10, A-11, A-12, A-19, A-72).
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var assert = require('node:assert/strict');
var sandbox = require('./ayudas/sandbox');

// pide n numeros por serie, en el orden dado, y devuelve secuencia + contadores
function numerar(series, fecha) {
  var codigo =
    "var num = require(REPO + '/lib/numeracion');" +
    "var db = require(REPO + '/db');" +
    "var pend = " + JSON.stringify(series) + ", seq = [];" +
    "db.inicializar(function () { (function sig() {" +
    "  if (!pend.length) return db.all('SELECT serie, anyo, ultimo FROM contadores ORDER BY serie, anyo', function (e, f) {" +
    "    console.log('@@' + JSON.stringify({ seq: seq, contadores: f })); process.exit(0); });" +
    "  num.siguienteNumero(pend.shift(), function (err, n) { seq.push(err ? 'ERR ' + err : n); sig(); });" +
    "})(); });";
  var r = sandbox.ejecutarCodigo(codigo, { fecha: fecha });
  sandbox.borrarCarpeta(r.dir);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.split('@@')[1]);
}

function formatear(args) {
  var codigo = "var num = require(REPO + '/lib/numeracion'); console.log(JSON.stringify(" + JSON.stringify(args) + ".map(function (a) { try { return num.formatear(a[0], a[1], a[2]); } catch (e) { return 'ERR ' + e; } })));";
  var r = sandbox.ejecutarCodigo(codigo);
  sandbox.borrarCarpeta(r.dir);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

describe('formatear (RN-35)', function () {
  it('SERIE-AAAA-NNNNNN con 6 cifras: el siguiente a FA 2026/108 es FA-2026-000109', function () {
    assert.deepEqual(formatear([['FA', 2026, 109], ['FA', 2026, 1], ['RE', 2026, 12]]), ['FA-2026-000109', 'FA-2026-000001', 'RE-2026-000012']);
  });

  it('frontera de los 6 dígitos: 999.999 / 1.000.000 (crece a 7 cifras sin truncar)', function () {
    assert.deepEqual(formatear([['FA', 2026, 99999], ['FA', 2026, 999999], ['FA', 2026, 1000000]]), ['FA-2026-099999', 'FA-2026-999999', 'FA-2026-1000000']);
  });

  it('cero, texto numérico, decimales, negativos, nulos y vacíos (sin validar)', function () {
    assert.deepEqual(
      formatear([['FA', 2026, 0], ['FA', 2026, '7'], ['FA', 2026, 1.5], ['FA', 2026, -5], ['FA', 2026, null], ['', 0, 3], ['fa', 99, 123456]]),
      ['FA-2026-000000', 'FA-2026-000007', 'FA-2026-0001.5', 'FA-2026-0000-5', 'FA-2026-00null', '-0-000003', 'fa-99-123456']);
  });
});

describe('siguienteNumero (RN-36..RN-40)', function () {
  it('RN-35/RN-36: sobre la semilla (FA 108, RE 1) da FA-2026-000109, 110 y RE-2026-000002', function () {
    var r = numerar(['FA', 'FA', 'RE'], '2026-11-11T10:00:00');
    assert.deepEqual(r.seq, ['FA-2026-000109', 'FA-2026-000110', 'RE-2026-000002']);
    assert.deepEqual(r.contadores, [{ serie: 'FA', anyo: 2026, ultimo: 110 }, { serie: 'RE', anyo: 2026, ultimo: 2 }]);
  });

  it('RN-36: año nuevo — el contador se abre a 0 y el primer número es el 1 (el de 2026 no se toca)', function () {
    var r = numerar(['FA', 'FA', 'RE'], '2027-03-01T10:00:00');
    assert.deepEqual(r.seq, ['FA-2027-000001', 'FA-2027-000002', 'RE-2027-000001']);
    assert.deepEqual(r.contadores, [
      { serie: 'FA', anyo: 2026, ultimo: 108 }, { serie: 'FA', anyo: 2027, ultimo: 2 },
      { serie: 'RE', anyo: 2026, ultimo: 1 }, { serie: 'RE', anyo: 2027, ultimo: 1 }
    ]);
  });

  it('frontera de año del reloj: 31-dic 23:59:59 sigue en 2026 / 1-ene 00:00:00 ya es 2027', function () {
    assert.deepEqual(numerar(['FA'], '2026-12-31T23:59:59').seq, ['FA-2026-000109']);
    assert.deepEqual(numerar(['FA'], '2027-01-01T00:00:00').seq, ['FA-2027-000001']);
  });

  it('frontera de año con la hora local: 23:30 UTC del 31-dic es 00:30 del 1-ene en Madrid → año 2027', function () {
    assert.deepEqual(numerar(['FA'], '2026-12-31T23:30:00Z').seq, ['FA-2027-000001']);
  });

  it('CONGELA comportamiento actual: A-10 / RN-37 el año del número es el del reloj del sistema, aunque exista un contador de un año posterior', function () {
    // Anomalía A-10. Con el reloj en 2025 se abre FA/2025 desde 0 aunque FA/2026 vaya por 108.
    var r = numerar(['FA', 'FA'], '2025-06-01T10:00:00');
    assert.deepEqual(r.seq, ['FA-2025-000001', 'FA-2025-000002']);
    assert.deepEqual(r.contadores.filter(function (c) { return c.serie === 'FA'; }), [
      { serie: 'FA', anyo: 2025, ultimo: 2 }, { serie: 'FA', anyo: 2026, ultimo: 108 }
    ]);
  });

  it('CONGELA comportamiento actual: A-12 / RN-38 cada llamada consume un número aunque no se grabe ninguna factura (hueco)', function () {
    // Anomalía A-12: siguienteNumero incrementa el contador antes del INSERT de la factura.
    // Aquí no se graba ninguna factura: la 109 queda reservada y la siguiente es la 110.
    var r = numerar(['FA', 'FA'], '2026-11-11T10:00:00');
    assert.deepEqual(r.seq, ['FA-2026-000109', 'FA-2026-000110']);
    assert.equal(r.contadores[0].ultimo, 110);
  });

  it('CONGELA comportamiento actual: A-72 cualquier serie es válida y abre su propio contador (no hay lista de series)', function () {
    // Anomalía A-72 (nueva). RN-40 dice que hay dos series, pero el código no lo comprueba.
    var r = numerar(['XX', 'XX', 'fa', ''], '2026-11-11T10:00:00');
    assert.deepEqual(r.seq, ['XX-2026-000001', 'XX-2026-000002', 'fa-2026-000001', '-2026-000001']);
    assert.deepEqual(r.contadores.map(function (c) { return c.serie + ':' + c.ultimo; }), [':1', 'FA:108', 'RE:1', 'XX:2', 'fa:1']);
  });

  it('CONGELA comportamiento actual: A-19 formato SERIE-AAAA-NNNNNN y contador propio por serie (FA y RE) y año', function () {
    // Anomalía A-19 (regla protegida, requisito legal de la inspección de 2020)
    var r = numerar(['FA', 'RE', 'FA', 'RE'], '2026-11-11T10:00:00');
    assert.deepEqual(r.seq, ['FA-2026-000109', 'RE-2026-000002', 'FA-2026-000110', 'RE-2026-000003']);
    r.seq.forEach(function (n) { assert.match(n, /^(FA|RE)-\d{4}-\d{6}$/); });
    assert.deepEqual(r.contadores, [{ serie: 'FA', anyo: 2026, ultimo: 110 }, { serie: 'RE', anyo: 2026, ultimo: 3 }]);
  });

  it('A-19: el número no depende de la fecha de la factura (no se recibe), solo de la serie y del reloj', function () {
    // La firma es siguienteNumero(serie, cb): no hay forma de pasar la fecha de la factura
    var r = sandbox.ejecutarCodigo("var num = require(REPO + '/lib/numeracion'); console.log(num.siguienteNumero.length, JSON.stringify(Object.keys(num)));");
    sandbox.borrarCarpeta(r.dir);
    assert.equal(r.stdout.trim(), '2 ["siguienteNumero","formatear"]');
  });
});
