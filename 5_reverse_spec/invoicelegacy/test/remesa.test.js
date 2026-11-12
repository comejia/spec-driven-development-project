// Tests de caracterizacion de scripts/remesa_mensual.js (criticidad ALTA)
// ---------------------------------------------------------------------------
// La remesa es un script con process.exit y sin exports, asi que se ejecuta TAL
// CUAL (el fichero real) como proceso hijo, con cwd = carpeta temporal (BD nueva
// con la semilla), TZ=Europe/Madrid y el reloj fijo. Para montar los casos se
// reemplazan los contratos de la BD TEMPORAL. La BD real no se toca.
// Referencias: RN-19..RN-26, contradicciones 01, 02, 05, 08, 10 y anomalias
// A-03, A-04, A-05, A-10, A-23, A-27, A-30, A-31, A-36, A-38, A-42, A-70, A-71.
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var before = test.before;
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var sandbox = require('./ayudas/sandbox');
var calculo = require('../services/calculo');

var SCRIPT = path.join(sandbox.RAIZ, 'scripts', 'remesa_mensual.js');

// Ejecuta la remesa de `mes`. contratos: null = los de la semilla; si no, lista de
// [cliente_id, concepto, cuota, tipo_iva, fecha_alta, fecha_baja]. Devuelve facturas+linea.
async function remesa(mes, contratos, opciones) {
  opciones = opciones || {};
  var dir = sandbox.prepararBd(sandbox.crearCarpeta());
  var sql = [];
  if (contratos) {
    sql.push('DELETE FROM contratos');
    contratos.forEach(function (c) {
      sql.push(['INSERT INTO contratos (cliente_id,concepto,cuota,tipo_iva,fecha_alta,fecha_baja) VALUES (?,?,?,?,?,?)', c]);
    });
  }
  (opciones.sql || []).forEach(function (s) { sql.push(s); });
  if (sql.length) await sandbox.ejecutarSql(dir, sql);
  var veces = opciones.veces || 1;
  var r;
  for (var i = 0; i < veces; i++) {
    r = sandbox.lanzar({ dir: dir, script: SCRIPT, args: mes === undefined ? [] : [].concat(mes), fecha: opciones.fecha, tz: opciones.tz });
  }
  var facturas = await sandbox.consultar(dir,
    'SELECT f.numero, f.serie, f.cliente_id, f.fecha, f.vencimiento, f.base, f.iva, f.recargo, f.total, f.estado, f.rectifica_a, f.observaciones, ' +
    'l.descripcion, l.cantidad, l.precio, l.tipo_iva, l.base AS lbase, l.cuota_iva, l.cuota_recargo ' +
    'FROM facturas f LEFT JOIN lineas l ON l.factura_id = f.id WHERE f.id > 9 ORDER BY f.id, l.id');
  var contadores = await sandbox.consultar(dir, 'SELECT serie, anyo, ultimo FROM contadores ORDER BY serie, anyo');
  var resultado = { dir: dir, status: r.status, stdout: r.stdout, stderr: r.stderr, facturas: facturas, contadores: contadores };
  if (!opciones.conservar) sandbox.borrarCarpeta(dir);
  return resultado;
}

// resumen compacto: [descripcion, precio de línea, base, iva, recargo, total]
function resumen(f) { return [f.descripcion, f.precio, f.base, f.iva, f.recargo, f.total]; }
function porConcepto(r) {
  var m = {};
  r.facturas.forEach(function (f) { m[f.descripcion.replace(/ \(.*\)$/, '')] = f; });
  return m;
}

describe('remesa: qué contratos entran (RN-19) con los contratos de la semilla', function () {
  it('RN-19: febrero de 2026 factura los contratos 1, 2 y 4 (el 3 está de baja desde 2025-09-15)', async function () {
    var r = await remesa('2026-02');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout,
      '  FA-2026-000109  Cafetería La Parada, S.C.  108.90 eur\n' +
      '  FA-2026-000110  Restaurante Casa Ubaldo, S.L.  175.45 eur\n' +
      '  FA-2026-000111  Bar Nuevo Siglo  54.45 eur\n' +
      'Remesa 2026-02 terminada: 3 facturas.\n');
    assert.deepEqual(r.facturas.map(resumen), [
      ['Alquiler máquina de café Futurmat F3 (febrero 2026)', 90, 90, 18.9, 0, 108.9],
      ['Mantenimiento cámaras frigoríficas (febrero 2026)', 145, 145, 30.45, 0, 175.45],
      ['Alquiler máquina de café Futurmat F3 (14 dias)', 45, 45, 9.45, 0, 54.45]
    ]);
  });

  it('RN-19/RN-20: septiembre de 2025 incluye el contrato 3 (baja 15-sep, 15 días de 30 → 30,00)', async function () {
    var r = await remesa('2025-09');
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.facturas.map(resumen), [
      ['Alquiler máquina de café Futurmat F3 (septiembre 2025)', 90, 90, 18.9, 0, 108.9],
      ['Mantenimiento cámaras frigoríficas (septiembre 2025)', 145, 145, 30.45, 0, 175.45],
      ['Alquiler lavavasos barra piscina (15 dias)', 30, 30, 6.3, 0, 36.3]
    ]);
  });

  it('RN-19: el contrato 3 entra en el mes de su baja (sep-2025) y ya no en el siguiente (oct-2025)', async function () {
    var r = await remesa('2025-10');
    assert.deepEqual(r.facturas.map(function (f) { return f.cliente_id; }), [1, 3]);
  });

  it('RN-19: el contrato 3 no entra antes de su alta (mayo-2025) y sí el mes del alta (junio-2025, 16→30 = 15 días)', async function () {
    var antes = await remesa('2025-05');
    assert.deepEqual(antes.facturas.map(function (f) { return f.cliente_id; }), [1, 3]);
    var alta = await remesa('2025-06');
    assert.deepEqual(alta.facturas.map(function (f) { return [f.cliente_id, f.descripcion, f.base]; }), [
      [1, 'Alquiler máquina de café Futurmat F3 (junio 2025)', 90],
      [3, 'Mantenimiento cámaras frigoríficas (junio 2025)', 145],
      [5, 'Alquiler lavavasos barra piscina (15 dias)', 30]
    ]);
  });

  it('RN-20: contrato 2 (145 €, alta 2023-01-15) en enero de 2023 → 17 días de 31 = 79,52', async function () {
    var r = await remesa('2023-01');
    assert.deepEqual(r.facturas.map(resumen), [['Mantenimiento cámaras frigoríficas (17 dias)', 79.52, 79.52, 16.7, 0, 96.22]]);
  });

  it('sin contratos vigentes: mensaje y salida con código 0, sin facturas ni contadores nuevos', async function () {
    var r = await remesa('2022-12');
    assert.equal(r.status, 0);
    assert.equal(r.stdout, 'No hay contratos que facturar en 2022-12\n');
    assert.deepEqual(r.facturas, []);
    assert.deepEqual(r.contadores, [{ serie: 'FA', anyo: 2026, ultimo: 108 }, { serie: 'RE', anyo: 2026, ultimo: 1 }]);
  });
});

describe('remesa: fronteras de alta y baja dentro del mes (RN-20, RN-21, A-30, A-31) — febrero de 2026 (28 días)', function () {
  // [cliente, concepto, cuota, iva, alta, baja]
  var contratos = [
    [1, 'alta-dia-1', 90, 21, '2026-02-01', null],
    [1, 'alta-ultimo-dia', 90, 21, '2026-02-28', null],
    [1, 'alta-dia-siguiente', 90, 21, '2026-03-01', null],
    [1, 'baja-ultimo-dia', 60, 21, '2025-01-01', '2026-02-28'],
    [1, 'baja-dia-27', 60, 21, '2025-01-01', '2026-02-27'],
    [1, 'baja-dia-1', 90, 21, '2025-01-01', '2026-02-01'],
    [1, 'baja-mes-anterior', 90, 21, '2025-01-01', '2026-01-31'],
    [1, 'alta-igual-baja', 90, 21, '2026-02-10', '2026-02-10'],
    [1, 'alta15-baja20', 90, 21, '2026-02-15', '2026-02-20'],
    [1, 'baja-anterior-al-alta', 90, 21, '2026-02-20', '2026-02-10'],
    [1, 'alta-dia-15', 90, 21, '2026-02-15', null],
    [1, 'todo-febrero-100', 100, 21, '2025-01-01', '2026-02-28']
  ];
  var r;
  var f;
  before(async function () {
    r = await remesa('2026-02', contratos);
    assert.equal(r.status, 0, r.stderr);
    f = porConcepto(r);
  });

  it('alta el día 1 → mes completo (90,00, sufijo con el nombre del mes y el año)', function () {
    assert.deepEqual(resumen(f['alta-dia-1']).slice(0, 2), ['alta-dia-1 (febrero 2026)', 90]);
    assert.equal(f['alta-dia-1'].total, 108.9);
  });

  it('CONGELA comportamiento actual: A-31 alta el último día (28) → 1 día = 90/28 = 3,21 («1 dias»)', function () {
    assert.deepEqual(resumen(f['alta-ultimo-dia']), ['alta-ultimo-dia (1 dias)', 3.21, 3.21, 0.67, 0, 3.88]);
  });

  it('CONGELA comportamiento actual: A-31 alta el día siguiente al mes (1-mar) → no entra', function () {
    assert.equal(f['alta-dia-siguiente'], undefined);
  });

  it('baja el último día (28) → mes completo (60,00); baja el 27 → 27/28 = 57,86', function () {
    assert.deepEqual(resumen(f['baja-ultimo-dia']), ['baja-ultimo-dia (febrero 2026)', 60, 60, 12.6, 0, 72.6]);
    assert.deepEqual(resumen(f['baja-dia-27']), ['baja-dia-27 (27 dias)', 57.86, 57.86, 12.15, 0, 70.01]);
  });

  it('CONGELA comportamiento actual: A-31 baja el día 1 → 1 día (3,21); baja el último día del mes anterior → no entra', function () {
    assert.deepEqual(resumen(f['baja-dia-1']), ['baja-dia-1 (1 dias)', 3.21, 3.21, 0.67, 0, 3.88]);
    assert.equal(f['baja-mes-anterior'], undefined);
  });

  it('alta y baja el mismo día → 1 día (3,21)', function () {
    assert.deepEqual(resumen(f['alta-igual-baja']), ['alta-igual-baja (1 dias)', 3.21, 3.21, 0.67, 0, 3.88]);
  });

  it('CONGELA comportamiento actual: A-30 alta 15 y baja 20 de febrero → 6 días de 28 = 19,29', function () {
    // Anomalía A-30. La pantalla de baja daría 60,00 (1→20): ver contradicción 01 más abajo
    assert.deepEqual(resumen(f['alta15-baja20']), ['alta15-baja20 (6 dias)', 19.29, 19.29, 4.05, 0, 23.34]);
  });

  it('CONGELA comportamiento actual: A-30 baja anterior al alta → línea de -28,93 (días: -9) y factura negativa', function () {
    assert.deepEqual(resumen(f['baja-anterior-al-alta']), ['baja-anterior-al-alta (-9 dias)', -28.93, -28.93, -6.08, 0, -35.01]);
  });

  it('RN-20: alta el 15 → 14 días de 28 = 45,00', function () {
    assert.deepEqual(resumen(f['alta-dia-15']), ['alta-dia-15 (14 dias)', 45, 45, 9.45, 0, 54.45]);
  });

  it('las facturas se numeran correlativamente en el orden de los contratos y llevan la misma observación', function () {
    assert.deepEqual(r.facturas.map(function (x) { return x.numero; }), [
      'FA-2026-000109', 'FA-2026-000110', 'FA-2026-000111', 'FA-2026-000112', 'FA-2026-000113', 'FA-2026-000114',
      'FA-2026-000115', 'FA-2026-000116', 'FA-2026-000117', 'FA-2026-000118'
    ]);
    r.facturas.forEach(function (x) { assert.equal(x.observaciones, 'Remesa febrero 2026'); });
    assert.deepEqual(r.contadores[0], { serie: 'FA', anyo: 2026, ultimo: 118 });
  });
});

describe('remesa: meses de 30, 31 y 29 días', function () {
  it('RN-20: julio (31 días) — alta el 16 → 16/31 = 46,45; alta el 31 → 1/31 de 100 = 3,23', async function () {
    var r = await remesa('2026-07', [
      [1, 'alta-16', 90, 21, '2026-07-16', null],
      [1, 'alta-31', 100, 21, '2026-07-31', null],
      [1, 'completo', 90, 21, '2020-01-01', null]
    ]);
    var f = porConcepto(r);
    assert.deepEqual(resumen(f['alta-16']), ['alta-16 (16 dias)', 46.45, 46.45, 9.75, 0, 56.2]);
    assert.deepEqual(resumen(f['alta-31']), ['alta-31 (1 dias)', 3.23, 3.23, 0.68, 0, 3.91]);
    assert.deepEqual(resumen(f['completo']), ['completo (julio 2026)', 90, 90, 18.9, 0, 108.9]);
  });

  it('RN-18/RN-26: baja el 15-mar de 145 € (31 días) → 15/31 = 70,16 en la remesa (la pantalla de baja da 72,50)', async function () {
    var r = await remesa('2026-03', [[1, 'baja-15', 145, 21, '2023-01-15', '2026-03-15']]);
    assert.deepEqual(resumen(r.facturas[0]), ['baja-15 (15 dias)', 70.16, 70.16, 14.73, 0, 84.89]);
  });

  it('febrero bisiesto 2024 (29 días): completo = 90,00; alta el 15 → 15/29 = 46,55', async function () {
    var r = await remesa('2024-02', [
      [1, 'completo', 90, 21, '2020-01-01', null],
      [1, 'alta-15', 90, 21, '2024-02-15', null]
    ]);
    var f = porConcepto(r);
    assert.deepEqual(resumen(f['completo']), ['completo (febrero 2024)', 90, 90, 18.9, 0, 108.9]);
    assert.deepEqual(resumen(f['alta-15']), ['alta-15 (15 dias)', 46.55, 46.55, 9.78, 0, 56.33]);
    assert.equal(f['completo'].fecha, '2024-02-29');
  });

  it('abril (30 días): alta el 16 → 15/30 = 45,00', async function () {
    var r = await remesa('2026-04', [[1, 'alta-16', 90, 21, '2026-04-16', null]]);
    assert.deepEqual(resumen(r.facturas[0]), ['alta-16 (15 dias)', 45, 45, 9.45, 0, 54.45]);
    assert.equal(r.facturas[0].fecha, '2026-04-30');
  });
});

describe('remesa: forma de la factura (RN-22, RN-23)', function () {
  it('RN-22/RN-23: una factura con una línea de cantidad 1, estado emitida, fecha = último día del mes, vencimiento = +30', async function () {
    var r = await remesa('2026-05', [[1, 'Alquiler', 90, 21, '2024-03-01', null]]);
    assert.deepEqual(r.facturas, [{
      numero: 'FA-2026-000109', serie: 'FA', cliente_id: 1, fecha: '2026-05-31', vencimiento: '2026-06-30',
      base: 90, iva: 18.9, recargo: 0, total: 108.9, estado: 'emitida', rectifica_a: null, observaciones: 'Remesa mayo 2026',
      descripcion: 'Alquiler (mayo 2026)', cantidad: 1, precio: 90, tipo_iva: 21, lbase: 90, cuota_iva: 18.9, cuota_recargo: 0
    }]);
  });

  it('RN-23: vencimiento con los días de pago del cliente (60) — 2026-12-31 + 60 = 2027-03-01', async function () {
    var r = await remesa('2026-12', [[3, 'Mantenimiento', 145, 21, '2023-01-15', null]], { fecha: '2027-01-01T09:00:00' });
    assert.equal(r.facturas[0].vencimiento, '2027-03-01');
  });

  it('RN-03 en la remesa: el recargo del cliente se aplica (cliente 2, base 100, IVA 21 → recargo 5,20)', async function () {
    var r = await remesa('2026-07', [[2, 'Cuota', 100, 21, '2020-01-01', null]]);
    assert.deepEqual(resumen(r.facturas[0]), ['Cuota (julio 2026)', 100, 100, 21, 5.2, 126.2]);
  });

  it('dos contratos del mismo cliente → dos facturas (una por contrato)', async function () {
    var r = await remesa('2026-07', [[1, 'A', 90, 21, '2020-01-01', null], [1, 'B', 10, 10, '2020-01-01', null]]);
    assert.deepEqual(r.facturas.map(function (f) { return [f.numero, f.cliente_id, f.total]; }), [
      ['FA-2026-000109', 1, 108.9], ['FA-2026-000110', 1, 11]
    ]);
  });

  it('cuota cero y cuota negativa se facturan tal cual', async function () {
    var cero = await remesa('2026-07', [[1, 'cero', 0, 21, '2020-01-01', null]]);
    assert.deepEqual(resumen(cero.facturas[0]), ['cero (julio 2026)', 0, 0, 0, 0, 0]);
    var neg = await remesa('2026-07', [[1, 'neg', -90, 21, '2020-01-01', null]]);
    assert.deepEqual(resumen(neg.facturas[0]), ['neg (julio 2026)', -90, -90, -18.9, 0, -108.9]);
  });
});

describe('remesa: descuento por volumen (RN-25, A-27)', function () {
  it('frontera de 1.000 €: 999,99 / 1.000,00 / 1.000,01 en cuota mensual', async function () {
    var r = await remesa('2026-07', [
      [1, 'debajo', 999.99, 21, '2020-01-01', null],
      [1, 'exacto', 1000, 21, '2020-01-01', null],
      [1, 'encima', 1000.01, 21, '2020-01-01', null]
    ]);
    var f = porConcepto(r);
    assert.deepEqual(resumen(f['debajo']), ['debajo (julio 2026)', 999.99, 999.99, 210, 0, 1209.99]);
    assert.deepEqual(resumen(f['exacto']), ['exacto (julio 2026)', 1000, 1000, 210, 0, 1210]);
    assert.deepEqual(resumen(f['encima']), ['encima (julio 2026)', 980.01, 980.01, 205.8, 0, 1185.81]);
  });

  it('CONGELA comportamiento actual: A-27 una cuota de 1.500 € recibe el 2 % sin constancia en las observaciones (1.470,00)', async function () {
    // Anomalía A-27 / contradicción 10. El alta manual sí escribe «Descuento volumen N% aplicado».
    var r = await remesa('2026-07', [[1, 'Alquiler caro', 1500, 21, '2020-01-01', null]]);
    assert.deepEqual(resumen(r.facturas[0]), ['Alquiler caro (julio 2026)', 1470, 1470, 308.7, 0, 1778.7]);
    assert.equal(r.facturas[0].observaciones, 'Remesa julio 2026');
    assert.ok(r.facturas[0].observaciones.indexOf('Descuento') < 0);
  });

  it('A-27 con 5.000,01 € → 5 % (precio 4.750,01) y con recargo en un cliente marcado', async function () {
    var r = await remesa('2026-07', [[1, 'grande', 5000.01, 21, '2020-01-01', null], [2, 'grande-recargo', 1500, 21, '2020-01-01', null]]);
    var f = porConcepto(r);
    assert.deepEqual(resumen(f['grande']), ['grande (julio 2026)', 4750.01, 4750.01, 997.5, 0, 5747.51]);
    assert.deepEqual(resumen(f['grande-recargo']), ['grande-recargo (julio 2026)', 1470, 1470, 308.7, 76.44, 1855.14]);
  });
});

describe('remesa: anomalías', function () {
  it('CONGELA comportamiento actual: A-03 lanzar la remesa dos veces genera facturas duplicadas del mismo mes', async function () {
    // Anomalía A-03 / RN-24: no se consulta si el contrato ya se facturó
    var r = await remesa('2026-07', [[1, 'A', 90, 21, '2020-01-01', null]], { veces: 2 });
    assert.deepEqual(r.facturas.map(function (f) { return [f.numero, f.descripcion, f.total, f.observaciones]; }), [
      ['FA-2026-000109', 'A (julio 2026)', 108.9, 'Remesa julio 2026'],
      ['FA-2026-000110', 'A (julio 2026)', 108.9, 'Remesa julio 2026']
    ]);
  });

  it('CONGELA comportamiento actual: A-04 dar de baja un contrato a mitad de mes y lanzar la remesa de ese mes factura el mes dos veces (pantalla a mano + remesa)', async function () {
    // Anomalía A-04 / RN-26. La baja (POST /contratos/2/baja) devuelve en la URL el prorrateo de 30 días
    // (72.50) para facturarlo «a mano»; la remesa de marzo sigue incluyendo el contrato y factura 15/31.
    var dir = sandbox.prepararBd(sandbox.crearCarpeta());
    var baja = sandbox.lanzar({ dir: dir, script: path.join(sandbox.RAIZ, 'test', 'ayudas', 'escenario-http.js'),
      input: JSON.stringify([{ nombre: 'baja', metodo: 'POST', ruta: '/contratos/2/baja', form: { fecha_baja: '2026-03-15' } }]) });
    assert.equal(baja.status, 0, baja.stderr);
    assert.equal(sandbox.resultadoJson(baja.stdout).respuestas[0].location, '/contratos?prorrateo=72.50');
    var r = sandbox.lanzar({ dir: dir, script: SCRIPT, args: ['2026-03'] });
    var facturas = await sandbox.consultar(dir, "SELECT f.numero, f.total, l.descripcion, l.precio FROM facturas f JOIN lineas l ON l.factura_id = f.id WHERE f.id > 9 ORDER BY f.id");
    sandbox.borrarCarpeta(dir);
    assert.equal(r.status, 0, r.stderr);
    var delContrato2 = facturas.filter(function (f) { return f.descripcion.indexOf('Mantenimiento cámaras frigoríficas') === 0; });
    assert.deepEqual(delContrato2, [{ numero: 'FA-2026-000110', total: 84.89, descripcion: 'Mantenimiento cámaras frigoríficas (15 dias)', precio: 70.16 }]);
  });

  it('CONGELA comportamiento actual: A-05 / contradicción 08 se factura a un cliente dado de baja (activo = 0)', async function () {
    var r = await remesa('2026-07', [[1, 'A', 90, 21, '2020-01-01', null]], { sql: ['UPDATE clientes SET activo = 0 WHERE id = 1'] });
    assert.equal(r.status, 0);
    assert.equal(r.facturas.length, 1);
    assert.equal(r.facturas[0].total, 108.9);
  });

  it('CONGELA comportamiento actual: A-36 un cliente con plazo de pago 0 recibe 30 días; con -5 días el vencimiento es anterior a la fecha', async function () {
    // Anomalías A-36 y contradicción 02 (el literal 30 de la remesa)
    var cero = await remesa('2026-07', [[1, 'A', 90, 21, '2020-01-01', null]], { sql: ['UPDATE clientes SET dias_pago = 0 WHERE id = 1'] });
    assert.equal(cero.facturas[0].fecha, '2026-07-31');
    assert.equal(cero.facturas[0].vencimiento, '2026-08-30');
    var neg = await remesa('2026-07', [[1, 'A', 90, 21, '2020-01-01', null]], { sql: ['UPDATE clientes SET dias_pago = -5 WHERE id = 1'] });
    assert.equal(neg.facturas[0].vencimiento, '2026-07-26');
  });

  it('CONGELA comportamiento actual: A-38 / contradicción 02 el plazo por defecto de la remesa es un 30 propio (no lee config)', async function () {
    var fuente = fs.readFileSync(SCRIPT, 'utf8');
    assert.ok(/co\.dias_pago \|\| 30/.test(fuente));
    assert.ok(!/require\('\.\.\/config'\)/.test(fuente));
  });

  it('CONGELA comportamiento actual: A-10 / contradicción 05 la remesa de diciembre lanzada el 1-ene-2027 lleva fecha 2026-12-31 y número de 2027', async function () {
    // Anomalía A-10 (RN-37). Los contadores muestran que FA/2026 no se toca y se abre FA/2027.
    var r = await remesa('2026-12', null, { fecha: '2027-01-01T09:00:00' });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.facturas.map(function (f) { return [f.numero, f.fecha, f.vencimiento, f.total]; }), [
      ['FA-2027-000001', '2026-12-31', '2027-01-30', 108.9],
      ['FA-2027-000002', '2026-12-31', '2027-03-01', 175.45],
      ['FA-2027-000003', '2026-12-31', '2027-01-30', 108.9]
    ]);
    assert.deepEqual(r.contadores, [
      { serie: 'FA', anyo: 2026, ultimo: 108 }, { serie: 'FA', anyo: 2027, ultimo: 3 }, { serie: 'RE', anyo: 2026, ultimo: 1 }
    ]);
    assert.equal(r.facturas[0].observaciones, 'Remesa diciembre 2026');
  });

  it('A-10: la misma remesa lanzada dentro del año (30-dic-2026) numera con 2026', async function () {
    var r = await remesa('2026-12', null, { fecha: '2026-12-30T09:00:00' });
    assert.deepEqual(r.facturas.map(function (f) { return f.numero; }), ['FA-2026-000109', 'FA-2026-000110', 'FA-2026-000111']);
  });

  it('CONGELA comportamiento actual: A-42 / A-70 el mes 13 se acepta: factura con fecha 2026-13-31, vencimiento NaN-NaN-NaN y «undefined» en los textos', async function () {
    // Anomalías A-42 y A-70 (nueva: el nombre del mes sale «undefined» y la fecha impide calcular el vencimiento)
    var r = await remesa('2026-13');
    assert.equal(r.status, 0);
    assert.deepEqual(r.facturas.map(function (f) { return [f.fecha, f.vencimiento, f.observaciones, f.descripcion]; }), [
      ['2026-13-31', 'NaN-NaN-NaN', 'Remesa undefined 2026', 'Alquiler máquina de café Futurmat F3 (undefined 2026)'],
      ['2026-13-31', 'NaN-NaN-NaN', 'Remesa undefined 2026', 'Mantenimiento cámaras frigoríficas (undefined 2026)'],
      ['2026-13-31', 'NaN-NaN-NaN', 'Remesa undefined 2026', 'Alquiler máquina de café Futurmat F3 (undefined 2026)']
    ]);
  });

  it('CONGELA comportamiento actual: A-42 el mes 00 se acepta también (fecha 2026-00-31)', async function () {
    var r = await remesa('2026-00');
    assert.equal(r.status, 0);
    assert.deepEqual(r.stdout,
      '  FA-2026-000109  Cafetería La Parada, S.C.  108.90 eur\n' +
      '  FA-2026-000110  Restaurante Casa Ubaldo, S.L.  175.45 eur\n' +
      'Remesa 2026-00 terminada: 2 facturas.\n');
    assert.equal(r.facturas[0].fecha, '2026-00-31');
  });

  it('formato del argumento: solo se valida AAAA-MM; si no, mensaje de uso y código de salida 1', async function () {
    var usos = ['2026-5', '2026-05-01', 'junio', '26-05'];
    for (var i = 0; i < usos.length; i++) {
      var r = await remesa(usos[i], null, { conservar: false });
      assert.equal(r.status, 1, usos[i]);
      assert.equal(r.stdout, 'Uso: node scripts/remesa_mensual.js YYYY-MM\n', usos[i]);
    }
    var sinArg = sandbox.lanzar({ script: SCRIPT, args: [] });
    sandbox.borrarCarpeta(sinArg.dir);
    assert.equal(sinArg.status, 1);
    assert.equal(sinArg.stdout, 'Uso: node scripts/remesa_mensual.js YYYY-MM\n');
  });

  it('CONGELA comportamiento actual: A-71 un argumento incorrecto deja igualmente un fichero datos/gesfact.db vacío en el directorio de ejecución', function () {
    // Anomalía A-71 (nueva): require('../db') se ejecuta antes de validar el argumento
    var r = sandbox.lanzar({ script: SCRIPT, args: ['mal'] });
    var ruta = path.join(r.dir, 'datos', 'gesfact.db');
    var existe = fs.existsSync(ruta);
    var tam = existe ? fs.statSync(ruta).size : -1;
    sandbox.borrarCarpeta(r.dir);
    assert.equal(r.status, 1);
    assert.equal(existe, true);
    assert.equal(tam, 0);
  });
});

describe('contradicción 01: las DOS implementaciones del prorrateo, con el mismo periodo (A-23, A-30)', function () {
  // Cada caso: remesa (días reales, I-2) frente a calculo.calcularProrrateo (30 días, I-1) con las mismas fechas.
  // Los valores de la remesa se ejecutan en el script real; los de la pantalla en la función real.
  var casos = [
    { nombre: 'contrato 4: alta 15-feb (15→28)', mes: '2026-02', c: [1, 'x', 90, 21, '2026-02-15', null], desde: '2026-02-15', hasta: '2026-02-28', cuota: 90, remesa: 45, pantalla: 42 },
    { nombre: 'contrato 2: alta 15-ene-2023 (15→31)', mes: '2023-01', c: [1, 'x', 145, 21, '2023-01-15', null], desde: '2023-01-15', hasta: '2023-01-31', cuota: 145, remesa: 79.52, pantalla: 82.17 },
    { nombre: 'alta 16-jul (16→31)', mes: '2026-07', c: [1, 'x', 90, 21, '2026-07-16', null], desde: '2026-07-16', hasta: '2026-07-31', cuota: 90, remesa: 46.45, pantalla: 48 },
    { nombre: 'baja 15-mar (1→15)', mes: '2026-03', c: [1, 'x', 145, 21, '2023-01-15', '2026-03-15'], desde: '2026-03-01', hasta: '2026-03-15', cuota: 145, remesa: 70.16, pantalla: 72.5 },
    { nombre: 'servicio de todo febrero (baja 28-feb, 100 €)', mes: '2026-02', c: [1, 'x', 100, 21, '2025-01-01', '2026-02-28'], desde: '2026-02-01', hasta: '2026-02-28', cuota: 100, remesa: 100, pantalla: 93.33 },
    { nombre: 'mes de 30 días (alta 16-abr): coinciden', mes: '2026-04', c: [1, 'x', 90, 21, '2026-04-16', null], desde: '2026-04-16', hasta: '2026-04-30', cuota: 90, remesa: 45, pantalla: 45 },
    { nombre: 'mes de 31 días completo: coinciden (tope de 30 días)', mes: '2026-07', c: [1, 'x', 90, 21, '2020-01-01', null], desde: '2026-07-01', hasta: '2026-07-31', cuota: 90, remesa: 90, pantalla: 90 }
  ];
  casos.forEach(function (caso) {
    it('CONGELA comportamiento actual: ' + caso.nombre + ' → remesa ' + caso.remesa + ' / pantalla ' + caso.pantalla, async function () {
      var r = await remesa(caso.mes, [caso.c]);
      assert.equal(r.facturas[0].precio, caso.remesa, 'remesa (I-2)');
      assert.equal(calculo.calcularProrrateo(caso.cuota, caso.desde, caso.hasta), caso.pantalla, 'pantalla (I-1)');
    });
  });
});

describe('contradicción 02: el plazo por defecto está escrito dos veces (A-38)', function () {
  it('CONGELA comportamiento actual: A-38 si config.VENCIMIENTO_DIAS valiera 45, el alta manual vencería a +45 y la remesa seguiría en +30', async function () {
    // Divergencia LATENTE: hoy ambas copias valen 30. Se simula el cambio SOLO EN MEMORIA del proceso hijo.
    var dir = sandbox.prepararBd(sandbox.crearCarpeta());
    var alta = sandbox.lanzar({ dir: dir, script: path.join(sandbox.RAIZ, 'test', 'ayudas', 'escenario-http.js'), config: { VENCIMIENTO_DIAS: 45 },
      input: JSON.stringify([{ nombre: 'alta', metodo: 'POST', ruta: '/facturas/nueva',
        form: { cliente_id: '1', fecha: '2026-05-31', desc: 'a', cant: '1', precio: '10', iva: '21' } }]) });
    assert.equal(alta.status, 0, alta.stderr);
    var o = sandbox.resultadoJson(alta.stdout);
    var manual = o.facturas.filter(function (f) { return f.numero === 'FA-2026-000109'; })[0];
    assert.deepEqual([manual.fecha, manual.vencimiento], ['2026-05-31', '2026-07-15']);
    var rem = sandbox.lanzar({ dir: dir, script: SCRIPT, args: ['2026-05'], config: { VENCIMIENTO_DIAS: 45 } });
    assert.equal(rem.status, 0, rem.stderr);
    var filas = await sandbox.consultar(dir, "SELECT numero, fecha, vencimiento FROM facturas WHERE observaciones = 'Remesa mayo 2026' AND cliente_id = 1");
    sandbox.borrarCarpeta(dir);
    assert.deepEqual(filas, [{ numero: 'FA-2026-000110', fecha: '2026-05-31', vencimiento: '2026-06-30' }]);
  });
});

describe('contradicción 05: «el año» de una factura (A-10)', function () {
  it('CONGELA comportamiento actual: A-10 la remesa de diciembre lanzada en enero: número de 2027, pero entra en el CSV de 2026 y en el T4 de 2026', async function () {
    var dir = sandbox.prepararBd(sandbox.crearCarpeta());
    var rem = sandbox.lanzar({ dir: dir, script: SCRIPT, args: ['2026-12'], fecha: '2027-01-01T09:00:00' });
    assert.equal(rem.status, 0, rem.stderr);
    var http = sandbox.lanzar({ dir: dir, script: path.join(sandbox.RAIZ, 'test', 'ayudas', 'escenario-http.js'), fecha: '2027-01-01T09:00:00',
      input: JSON.stringify([
        { nombre: 'csv-2026', metodo: 'GET', ruta: '/informes/export-gestoria?anyo=2026' },
        { nombre: 'csv-2027', metodo: 'GET', ruta: '/informes/export-gestoria?anyo=2027' },
        { nombre: 'iva-T4-2026', metodo: 'GET', ruta: '/informes/iva?anyo=2026&trimestre=4' },
        { nombre: 'iva-T1-2027', metodo: 'GET', ruta: '/informes/iva?anyo=2027&trimestre=1' },
        { nombre: 'iva-sin-parametros', metodo: 'GET', ruta: '/informes/iva' }
      ]) });
    sandbox.borrarCarpeta(dir);
    assert.equal(http.status, 0, http.stderr);
    var o = sandbox.resultadoJson(http.stdout);
    function resp(n) { return o.respuestas.filter(function (r) { return r.paso === n; })[0].cuerpo; }
    var csv2026 = resp('csv-2026').split('\r\n').filter(function (l) { return l.indexOf('FA-2027') === 0; });
    assert.deepEqual(csv2026.map(function (l) { return l.split(';').slice(0, 2).join(' '); }), [
      'FA-2027-000001 31/12/2026', 'FA-2027-000002 31/12/2026', 'FA-2027-000003 31/12/2026'
    ]);
    assert.equal(resp('csv-2027').split('\r\n').length, 2); // el CSV de 2027 no lleva ninguna fila
    assert.match(resp('iva-T4-2026'), /<td>21%<\/td>\s*<td class="num">325,00<\/td>/);
    assert.match(resp('iva-T1-2027'), /<tr class="total"><td>TOTAL<\/td>\s*<td class="num">0,00<\/td>/);
    // sin parámetros el informe usa el año del reloj (2027) y el trimestre 1: vacío
    assert.match(resp('iva-sin-parametros'), /1T 2027/);
  });
});
