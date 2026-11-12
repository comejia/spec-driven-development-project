// Tests de caracterizacion de db.js (esquema + datos semilla) y de la
// configuracion / dependencias que el reconocimiento marca como zonas sensibles.
// ---------------------------------------------------------------------------
// TODO se ejecuta sobre una BD TEMPORAL (ver ayudas/sandbox.js): la base real
// datos/gesfact.db no se abre nunca. Referencias: A-01, A-11, A-17, A-20, A-32,
// A-47, A-48, A-49, A-52, A-57, A-58 y reglas-de-negocio.md §12.
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var before = test.before;
var after = test.after;
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var sandbox = require('./ayudas/sandbox');
var calculo = require('../services/calculo');
var util = require('../lib/util');
var config = require('../config');

describe('db.js: esquema y datos semilla en una BD nueva (A-17)', function () {
  var dir;
  before(function () { dir = sandbox.prepararBd(sandbox.crearCarpeta()); });
  after(function () { sandbox.borrarCarpeta(dir); });

  it('CONGELA comportamiento actual: A-17 una BD nueva se rellena sola con la semilla (6/8/4/9/28) y contadores FA 108 y RE 1', async function () {
    // Anomalía A-17 / O4: arrancar desde otra carpeta crea y siembra una BD paralela
    var conteos = {};
    for (var t of ['clientes', 'articulos', 'contratos', 'facturas', 'lineas']) {
      conteos[t] = (await sandbox.consultar(dir, 'SELECT COUNT(*) AS n FROM ' + t))[0].n;
    }
    assert.deepEqual(conteos, { clientes: 6, articulos: 8, contratos: 4, facturas: 9, lineas: 28 });
    assert.deepEqual(await sandbox.consultar(dir, 'SELECT serie, anyo, ultimo FROM contadores ORDER BY serie'), [
      { serie: 'FA', anyo: 2026, ultimo: 108 },
      { serie: 'RE', anyo: 2026, ultimo: 1 }
    ]);
  });

  it('las seis tablas del esquema y sus columnas', async function () {
    var tablas = (await sandbox.consultar(dir, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map(function (x) { return x.name; });
    assert.deepEqual(tablas, ['articulos', 'clientes', 'contadores', 'contratos', 'facturas', 'lineas']);
    var colsFacturas = (await sandbox.consultar(dir, "PRAGMA table_info(facturas)")).map(function (c) { return c.name + ':' + c.type + (c.notnull ? ':NN' : '') + (c.dflt_value ? ':' + c.dflt_value : ''); });
    assert.deepEqual(colsFacturas, [
      'id:INTEGER', 'numero:TEXT:NN', 'serie:TEXT:NN:\'FA\'', 'cliente_id:INTEGER:NN', 'fecha:TEXT:NN', 'vencimiento:TEXT',
      'base:REAL:NN', 'iva:REAL:NN', 'recargo:REAL:NN:0', 'total:REAL:NN', 'estado:TEXT:NN:\'emitida\'', 'rectifica_a:TEXT', 'observaciones:TEXT'
    ]);
  });

  it('CONGELA comportamiento actual: A-11 facturas.numero no tiene restricción de unicidad (se puede grabar un número repetido)', async function () {
    // Anomalía A-11 (parte determinista; la carrera real entre dos grabaciones simultáneas no es reproducible)
    var r = sandbox.ejecutarCodigo("var db = require(REPO + '/db'); db.inicializar(function () { db.run(\"INSERT INTO facturas (numero,serie,cliente_id,fecha,base,iva,total) VALUES ('FA-2026-000101','FA',1,'2026-06-01',1,0.21,1.21)\", function (e) { console.log(e ? 'ERROR ' + e : 'GRABADO'); process.exit(0); }); });", { dir: dir });
    assert.equal(r.stdout.trim(), 'GRABADO');
    var n = (await sandbox.consultar(dir, "SELECT COUNT(*) AS n FROM facturas WHERE numero = 'FA-2026-000101'"))[0].n;
    assert.equal(n, 2);
  });

  it('CONGELA comportamiento actual: A-52 sin integridad referencial (foreign_keys = 0): se graba una línea huérfana', async function () {
    // Anomalía A-52
    var fk = await sandbox.consultar(dir, 'PRAGMA foreign_keys');
    assert.equal(fk[0].foreign_keys, 0);
    await sandbox.ejecutarSql(dir, ["INSERT INTO lineas (factura_id,descripcion,cantidad,precio,tipo_iva,base,cuota_iva) VALUES (99999,'huerfana',1,1,21,1,0.21)"]);
    var huerfanas = await sandbox.consultar(dir, 'SELECT COUNT(*) AS n FROM lineas WHERE factura_id NOT IN (SELECT id FROM facturas)');
    assert.equal(huerfanas[0].n, 1);
  });

  it('db.js no vuelve a sembrar una BD que ya tiene clientes', async function () {
    var antes = (await sandbox.consultar(dir, 'SELECT COUNT(*) AS n FROM clientes'))[0].n;
    var r = sandbox.ejecutarCodigo("var db = require(REPO + '/db'); db.inicializar(function (e) { process.exit(e ? 1 : 0); });", { dir: dir });
    assert.equal(r.status, 0);
    assert.equal((await sandbox.consultar(dir, 'SELECT COUNT(*) AS n FROM clientes'))[0].n, antes);
  });
});

describe('BD semilla frente al código actual (A-01, A-32, H-01, H-02)', function () {
  var dir;
  before(function () { dir = sandbox.prepararBd(sandbox.crearCarpeta()); });
  after(function () { sandbox.borrarCarpeta(dir); });

  it('CONGELA comportamiento actual: A-32 / H-02 exactamente 7 de las 28 líneas de la semilla no se reproducen con calcularLinea', async function () {
    var lineas = await sandbox.consultar(dir,
      'SELECT l.*, f.numero, cl.recargo_equivalencia AS rec FROM lineas l JOIN facturas f ON f.id = l.factura_id JOIN clientes cl ON cl.id = f.cliente_id ORDER BY l.id');
    assert.equal(lineas.length, 28);
    var distintas = [];
    lineas.forEach(function (l) {
      var x = calculo.calcularLinea(l.cantidad, l.precio, l.tipo_iva, l.rec);
      if (x.base !== l.base || x.cuotaIva !== l.cuota_iva || x.cuotaRecargo !== l.cuota_recargo) {
        distintas.push([l.numero, l.descripcion, l.base, x.base, l.cuota_iva, x.cuotaIva]);
      }
    });
    assert.deepEqual(distintas, [
      ['FA-2026-000102', 'Portes y manipulación', 1.9, 1.92, 0.4, 0.4],
      ['FA-2026-000103', 'Portes y manipulación', 5.5, 5.52, 1.15, 1.16],
      ['FA-2026-000105', 'Portes y manipulación', 17.2, 17.22, 3.61, 3.62],
      ['FA-2026-000106', 'Café en grano natural 1kg', 11.61, 11.59, 1.16, 1.16],
      ['RE-2026-000001', 'Rectificación: Café en grano natural 1kg', -11.61, -11.59, -1.16, -1.16],
      ['FA-2026-000107', 'Café en grano natural 1kg', 11.61, 11.59, 1.16, 1.16],
      ['FA-2026-000108', 'Vaso caña 20cl (caja 72)', 14.15, 14.26, 2.97, 2.99]
    ]);
  });

  it('CONGELA comportamiento actual: A-01 / H-01 6 de las 9 cabeceras de la semilla no suman sus líneas (y 3 sí)', async function () {
    var filas = await sandbox.consultar(dir,
      'SELECT f.numero, f.base, f.iva, f.recargo, f.total, SUM(l.base) AS sb, SUM(l.cuota_iva) AS si, SUM(l.cuota_recargo) AS sr ' +
      'FROM facturas f JOIN lineas l ON l.factura_id = f.id GROUP BY f.id ORDER BY f.id');
    var resumen = filas.map(function (f) {
      var sb = util.redondear2(f.sb), si = util.redondear2(f.si), sr = util.redondear2(f.sr);
      var cuadra = f.base === sb && f.iva === si && f.recargo === sr && f.total === util.redondear2(sb + si + sr);
      return [f.numero, cuadra ? 'cuadra' : 'DESCUADRA', f.iva, si, f.total, util.redondear2(sb + si + sr)];
    });
    assert.deepEqual(resumen, [
      ['FA-2026-000101', 'DESCUADRA', 27.97, 24.27, 161.17, 157.47],
      ['FA-2026-000102', 'cuadra', 24.28, 24.28, 145.89, 145.89],
      ['FA-2026-000103', 'cuadra', 210, 210, 1210, 1210],
      ['FA-2026-000104', 'cuadra', 6.09, 6.09, 159.15, 159.15],
      ['FA-2026-000105', 'DESCUADRA', 468.63, 339.02, 2756.38, 2674.52],
      ['FA-2026-000106', 'DESCUADRA', 20.62, 20.06, 122.23, 121.67],
      ['RE-2026-000001', 'DESCUADRA', -20.62, -20.06, -122.23, -121.67],
      ['FA-2026-000107', 'DESCUADRA', 20.62, 20.06, 122.23, 121.67],
      ['FA-2026-000108', 'DESCUADRA', 26.19, 24.26, 154.24, 152.31]
    ]);
  });

  it('estados de la semilla (AD-10): 4 cobradas FA, 3 emitidas FA, 1 emitida RE, 1 rectificada FA', async function () {
    var filas = await sandbox.consultar(dir, 'SELECT estado, serie, COUNT(*) AS n, SUM(total) AS t FROM facturas GROUP BY estado, serie ORDER BY estado, serie');
    assert.deepEqual(filas.map(function (f) { return [f.estado, f.serie, f.n, util.redondear2(f.t)]; }), [
      ['cobrada', 'FA', 4, 1676.21],
      ['emitida', 'FA', 3, 3032.85],
      ['emitida', 'RE', 1, -122.23],
      ['rectificada', 'FA', 1, 122.23]
    ]);
  });

  it('contratos de la semilla (AD-09): cuotas 90 / 145 / 60 / 90, el 3 de baja 2025-09-15 y el 4 de alta 2026-02-15', async function () {
    var c = await sandbox.consultar(dir, 'SELECT id, cliente_id, cuota, tipo_iva, fecha_alta, fecha_baja FROM contratos ORDER BY id');
    assert.deepEqual(c, [
      { id: 1, cliente_id: 1, cuota: 90, tipo_iva: 21, fecha_alta: '2024-03-01', fecha_baja: null },
      { id: 2, cliente_id: 3, cuota: 145, tipo_iva: 21, fecha_alta: '2023-01-15', fecha_baja: null },
      { id: 3, cliente_id: 5, cuota: 60, tipo_iva: 21, fecha_alta: '2025-06-16', fecha_baja: '2025-09-15' },
      { id: 4, cliente_id: 6, cuota: 90, tipo_iva: 21, fecha_alta: '2026-02-15', fecha_baja: null }
    ]);
  });
});

describe('código de producción: propiedades estáticas', function () {
  var raiz = path.resolve(__dirname, '..');
  function fuentes() {
    var ficheros = ['server.js', 'db.js', 'config.js'];
    ['routes', 'services', 'lib', 'scripts'].forEach(function (d) {
      fs.readdirSync(path.join(raiz, d)).forEach(function (f) { if (/\.js$/.test(f)) ficheros.push(d + '/' + f); });
    });
    return ficheros;
  }

  it('CONGELA comportamiento actual: A-20 ningún fichero del producto contiene DELETE (las facturas no se borran nunca)', function () {
    // Anomalía A-20 (regla protegida). Búsqueda sobre el código ejecutable, sin comentarios de línea.
    fuentes().forEach(function (f) {
      var sinComentarios = fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      assert.ok(!/\bDELETE\b/i.test(sinComentarios), f + ' contiene DELETE');
      assert.ok(!/\.delete\s*\(/.test(sinComentarios), f + ' contiene un router.delete');
    });
  });

  it('CONGELA comportamiento actual: A-57 / A-58 package.json no declara engines y las dependencias usan rangos ^', function () {
    var pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
    assert.equal(pkg.engines, undefined);
    assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['body-parser', 'ejs', 'express', 'sqlite3']);
    Object.keys(pkg.dependencies).forEach(function (d) { assert.match(pkg.dependencies[d], /^\^/, d); });
  });

  it('el script start sigue siendo node server.js', function () {
    var pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts.start, 'node server.js');
    assert.equal(pkg.name, 'gesfact');
    assert.equal(pkg.version, '2.4.0');
  });
});

describe('config.js (criticidad ALTA): valores que condicionan el cálculo', function () {
  it('constantes funcionales: puerto, BD relativa, IVA y plazo por defecto', function () {
    assert.equal(config.PUERTO, 3000);
    assert.equal(config.RUTA_BD, './datos/gesfact.db');
    assert.equal(config.IVA_DEFECTO, 21);
    assert.equal(config.VENCIMIENTO_DIAS, 30);
  });

  it('datos de la empresa que se imprimen en la factura', function () {
    assert.equal(config.EMPRESA.nombre, 'Suministros Hidalgo, S.L.');
    assert.deepEqual(Object.keys(config.EMPRESA).sort(), ['cp', 'direccion', 'email', 'nif', 'nombre', 'poblacion', 'registro', 'telefono']);
  });

  it('CONGELA comportamiento actual: A-49 el teléfono de la empresa impreso en las facturas lleva el marcador XXX', function () {
    assert.equal(config.EMPRESA.telefono, '925 511 XXX');
  });

  it('CONGELA comportamiento actual: A-47 la clave SMTP y la clave de la gestoría están en claro en config.js (no se reproducen aquí)', function () {
    assert.equal(typeof config.SMTP.clave, 'string');
    assert.ok(config.SMTP.clave.length > 0);
    assert.equal(typeof config.CLAVE_EXPORT_GESTORIA, 'string');
    assert.ok(config.CLAVE_EXPORT_GESTORIA.length > 0);
    var fuente = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
    assert.ok(fuente.indexOf(config.SMTP.clave) >= 0);
    assert.ok(fuente.indexOf(config.CLAVE_EXPORT_GESTORIA) >= 0);
  });

  it('SMTP: servidor y puerto', function () {
    assert.equal(config.SMTP.host, 'smtp.arsys.es');
    assert.equal(config.SMTP.puerto, 465);
  });
});

describe('services/email.js (A-48)', function () {
  it('CONGELA comportamiento actual: A-48 enviarFactura solo escribe un aviso en consola y llama a cb(null)', function () {
    var email = require('../services/email');
    var salida = [];
    var logOriginal = console.log;
    console.log = function () { salida.push(Array.prototype.slice.call(arguments).join(' ')); };
    var llamadas = [];
    try {
      email.enviarFactura({ numero: 'FA-2026-000109' }, { email: 'a@b.es' }, function (e) { llamadas.push(e); });
      email.enviarFactura({ numero: 'FA-2026-000110' }, {}, function (e) { llamadas.push(e); });
    } finally { console.log = logOriginal; }
    assert.deepEqual(salida, [
      '[email] AVISO: envio desactivado. Factura FA-2026-000109 pendiente de enviar a mano a a@b.es',
      '[email] AVISO: envio desactivado. Factura FA-2026-000110 pendiente de enviar a mano a (sin email)'
    ]);
    assert.deepEqual(llamadas, [null, null]);
    assert.deepEqual(Object.keys(email), ['enviarFactura']);
  });
});
