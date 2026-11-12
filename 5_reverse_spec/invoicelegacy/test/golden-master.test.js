// Golden master del flujo central de negocio: emitir una factura (alta manual y remesa).
// ---------------------------------------------------------------------------
// Regenera la salida COMPLETA de un juego fijo de 12 casos (test/golden/casos.js) ejecutando
// el codigo real, y la compara en profundidad con test/golden/master.json. El mensaje de
// fallo indica el caso y el campo exactos. El master solo se regenera con una decision de
// negocio documentada (test/golden/LEEME.md); este test NUNCA escribe el master.
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var before = test.before;
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var flujo = require('./golden/flujo');
var canonico = require('./golden/canonico');
var casos = require('./golden/casos');

var RUTA_MASTER = path.join(__dirname, 'golden', 'master.json');

describe('golden master del flujo de emisión de facturas', function () {
  var textoMaster;
  var master;
  var obtenido;

  before(async function () {
    textoMaster = fs.readFileSync(RUTA_MASTER, 'utf8');
    master = canonico.deTexto(textoMaster);
    obtenido = await flujo.generar();
  });

  it('el master está en formato canónico (claves ordenadas, sangría de 2, decimales completos): no se ha editado a mano', function () {
    assert.equal(canonico.aTexto(master), textoMaster);
  });

  it('el master contiene exactamente los 12 casos del juego fijo', function () {
    var ids = casos.ALTAS.map(function (c) { return c.id; }).concat(casos.REMESAS.map(function (c) { return c.id; }));
    assert.equal(ids.length, 12);
    assert.deepEqual(Object.keys(master.casos).sort(), ids.slice().sort());
  });

  it('el entorno del master es TZ=Europe/Madrid y reloj 2026-11-11 10:00', function () {
    assert.deepEqual(master.meta.entorno, { tz: 'Europe/Madrid', fechaSistema: '2026-11-11T10:00:00' });
  });

  it('regenerar la salida del flujo es determinista (dos ejecuciones seguidas dan lo mismo)', async function () {
    var otra = await flujo.generar();
    assert.equal(canonico.aTexto(otra), canonico.aTexto(obtenido));
  });

  it('CONGELA comportamiento actual: la salida regenerada coincide campo a campo con el master', function () {
    var dif = canonico.diferencias(master, obtenido);
    assert.equal(dif.length, 0, '\n' + dif.slice(0, 25).map(canonico.describir).join('\n') +
      (dif.length > 25 ? '\n... y ' + (dif.length - 25) + ' diferencias más' : '') +
      '\nSi el cambio está decidido y documentado por el negocio, regenerar según test/golden/LEEME.md');
  });

  it('el detector funciona: una modificación de un solo decimal se señala con su caso y su campo', function () {
    var copia = canonico.deTexto(canonico.aTexto(obtenido));
    copia.casos.G05.salida.factura.base = 980.02;
    var dif = canonico.diferencias(master, copia).map(canonico.describir);
    assert.deepEqual(dif, ['Caso G05, campo salida.factura.base: esperado 980.01, obtenido 980.02']);
  });
});
