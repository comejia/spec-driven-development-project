// Tests de caracterizacion de lib/util.js
// ---------------------------------------------------------------------------
// Congelan el comportamiento ACTUAL (Constitucion, Principio I y IV): el valor
// esperado de cada caso es el que el codigo produce hoy, aunque contradiga la
// logica o los comentarios. Si un test falla, el que se ha equivocado es el
// test o el codigo ha cambiado de comportamiento; nunca se "arregla" el codigo.
// Referencias: reglas-de-negocio.md (RN-51..RN-55) y registro-de-anomalias.md (A-xx).
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var assert = require('node:assert/strict');
var path = require('path');
var util = require('../lib/util');
var sandbox = require('./ayudas/sandbox');

describe('redondear2 (RN-51, A-02)', function () {
  // Ejemplos de RN-51 (transcritos de la ejecucion real; coinciden con el documento)
  var ejemplosRN51 = [
    [1.005, 1],
    [2.675, 2.68],
    [1.255, 1.25],
    [10.075, 10.07],
    [0.285, 0.28],
    [0.125, 0.13],
    [-0.125, -0.12],
    [0.01 * 14.50, 0.14],
    [0.03 * 7.50, 0.22]
  ];
  ejemplosRN51.forEach(function (c) {
    it('RN-51: redondear2(' + c[0] + ') = ' + c[1], function () {
      assert.equal(util.redondear2(c[0]), c[1]);
    });
  });

  it('frontera del medio céntimo, positivos: justo debajo / exacto / justo encima', function () {
    assert.equal(util.redondear2(0.004), 0);
    assert.equal(util.redondear2(0.005), 0.01);
    assert.equal(util.redondear2(0.006), 0.01);
  });

  it('frontera del medio céntimo, negativos: el medio se redondea hacia cero', function () {
    // OJO: el resultado es -0 (cero negativo), ver A-62; assert.equal(-0, 0) falla a propósito
    assert.equal(util.redondear2(-0.004), -0);
    assert.equal(util.redondear2(-0.005), -0);
    assert.equal(util.redondear2(-0.006), -0.01);
    assert.equal(util.redondear2(-1.005), -1);
    assert.equal(util.redondear2(-2.675), -2.67);
  });

  it('coma flotante: sumas y productos con error binario', function () {
    assert.equal(util.redondear2(0.1 + 0.2), 0.3);
    assert.equal(util.redondear2(19.99 * 3), 59.97);
    assert.equal(util.redondear2(4.35 * 100), 435);
    assert.equal(util.redondear2(0.07 * 100), 7);
    assert.equal(util.redondear2(1.0049999999), 1);
    assert.equal(util.redondear2(1234.565), 1234.57);
    assert.equal(util.redondear2(8.345), 8.35);
    assert.equal(util.redondear2(1.115), 1.12);
  });

  it('cero, vacíos y valores no numéricos', function () {
    assert.equal(util.redondear2(0), 0);
    assert.equal(util.redondear2(null), 0);
    assert.equal(util.redondear2(''), 0);
    assert.equal(util.redondear2('1.005'), 1);
    assert.ok(Number.isNaN(util.redondear2(NaN)));
    assert.ok(Number.isNaN(util.redondear2(undefined)));
    assert.ok(Number.isNaN(util.redondear2('abc')));
  });

  it('CONGELA comportamiento actual: A-62 devuelve -0 (cero negativo) para los negativos entre -0,005 y 0', function () {
    // Anomalía A-62 (nueva, descubierta al escribir esta red de tests)
    assert.ok(Object.is(util.redondear2(-0.004), -0));
    assert.ok(Object.is(util.redondear2(-0.005), -0));
    assert.ok(Object.is(util.redondear2(-0), -0));
    assert.ok(Object.is(util.redondear2(0), 0));
    assert.ok(Object.is(util.redondear2(-0.006), -0.01));
  });
});

describe('sumarDias (RN-32, A-35, A-37)', function () {
  it('RN-32: ejemplos del documento con TZ=Europe/Madrid', function () {
    assert.equal(util.sumarDias('2026-01-31', 30), '2026-03-02');
    assert.equal(util.sumarDias('2026-05-31', 30), '2026-06-30');
    assert.equal(util.sumarDias('2026-12-31', 30), '2027-01-30');
    assert.equal(util.sumarDias('2024-02-29', 365), '2025-02-28');
  });

  it('BD semilla: vencimientos de FA-2026-000101 (+30) y FA-2026-000103 (+60)', function () {
    assert.equal(util.sumarDias('2026-01-31', 30), '2026-03-02');
    assert.equal(util.sumarDias('2026-02-20', 60), '2026-04-21');
  });

  it('cero días devuelve la misma fecha', function () {
    assert.equal(util.sumarDias('2026-01-31', 0), '2026-01-31');
    assert.equal(util.sumarDias('2026-03-29', 0), '2026-03-29');
  });

  it('fin de mes: último día del mes + 1 / febrero no bisiesto / bisiesto', function () {
    assert.equal(util.sumarDias('2026-02-27', 1), '2026-02-28');
    assert.equal(util.sumarDias('2026-02-28', 1), '2026-03-01');
    assert.equal(util.sumarDias('2024-02-28', 1), '2024-02-29');
    assert.equal(util.sumarDias('2024-02-29', 1), '2024-03-01');
    assert.equal(util.sumarDias('2023-02-28', 1), '2023-03-01');
    assert.equal(util.sumarDias('2100-02-28', 1), '2100-03-01'); // 2100 no es bisiesto
    assert.equal(util.sumarDias('2000-02-28', 1), '2000-02-29'); // 2000 sí lo es
    assert.equal(util.sumarDias('2026-03-31', 30), '2026-04-30');
    assert.equal(util.sumarDias('2026-02-28', 30), '2026-03-30');
  });

  it('fin de año: 31-dic + 1 y 1-ene - 1', function () {
    assert.equal(util.sumarDias('2025-12-31', 1), '2026-01-01');
    assert.equal(util.sumarDias('2026-01-01', -1), '2025-12-31');
    assert.equal(util.sumarDias('2026-01-31', 366), '2027-02-01');
  });

  it('cambios de hora de Europe/Madrid (marzo y octubre 2026): sin desfase', function () {
    assert.equal(util.sumarDias('2026-03-28', 1), '2026-03-29');
    assert.equal(util.sumarDias('2026-03-29', 1), '2026-03-30');
    assert.equal(util.sumarDias('2026-03-28', 2), '2026-03-30');
    assert.equal(util.sumarDias('2026-10-24', 1), '2026-10-25');
    assert.equal(util.sumarDias('2026-10-25', 1), '2026-10-26');
    assert.equal(util.sumarDias('2026-10-31', 1), '2026-11-01');
  });

  it('CONGELA comportamiento actual: A-37 el vencimiento es fecha + N días naturales, sin ajustar a fin de mes ni a día hábil', function () {
    // Anomalía A-37 / RN-32. 2026-03-01 es domingo y 2026-01-31 + 30 no se mueve al fin de mes.
    assert.equal(util.sumarDias('2026-01-30', 30), '2026-03-01');
    assert.equal(new Date(2026, 2, 1).getDay(), 0);
    assert.equal(util.sumarDias('2026-01-31', 30), '2026-03-02');
    assert.equal(util.sumarDias('2026-05-31', 30), '2026-06-30');
    assert.equal(util.sumarDias('2026-02-14', 30), '2026-03-16');
  });

  it('negativos', function () {
    assert.equal(util.sumarDias('2026-03-01', -1), '2026-02-28');
    assert.equal(util.sumarDias('2026-01-01', -1), '2025-12-31');
  });

  it('fracciones y días como texto', function () {
    assert.equal(util.sumarDias('2026-01-31', 1.5), '2026-02-01');
    assert.equal(util.sumarDias('2026-01-31', '30'), '2026-03-02');
  });

  it('CONGELA comportamiento actual: A-44 fecha ilegible o vacía produce NaN-NaN-NaN', function () {
    // RN-30 / A-44
    assert.equal(util.sumarDias('abc', 30), 'NaN-NaN-NaN');
    assert.equal(util.sumarDias('', 30), 'NaN-NaN-NaN');
    assert.equal(util.sumarDias('2026-13-01', 0), 'NaN-NaN-NaN');
    assert.equal(util.sumarDias('2026-01-31', NaN), 'NaN-NaN-NaN');
  });

  it('CONGELA comportamiento actual: A-66 fecha nula = 1 de enero de 1970; fecha inexistente se desborda al mes siguiente', function () {
    // Anomalía A-66 (nueva)
    assert.equal(util.sumarDias(null, 1), '1970-01-02');
    assert.equal(util.sumarDias('2026-02-30', 0), '2026-03-02');
    assert.equal(util.sumarDias('2026-1-5', 0), '2026-01-05');
    assert.equal(util.sumarDias('2026-01-31T23:00', 1), '2026-02-01');
  });

  it('CONGELA comportamiento actual: A-35 en una zona horaria con desfase negativo (UTC-3) el vencimiento sale un día antes', function () {
    // Anomalía A-35 / contradicción 04 / RN-32: el resultado depende de la TZ del equipo
    var codigo =
      "var u = require(REPO + '/lib/util');" +
      "console.log(JSON.stringify([u.sumarDias('2026-01-31', 30), u.sumarDias('2026-01-31', 0), u.sumarDias(u.hoy(), 0), u.hoy()]));";
    var r = sandbox.ejecutarCodigo(codigo, { tz: 'America/Argentina/Buenos_Aires', fecha: '2026-11-11T10:00:00' });
    sandbox.borrarCarpeta(r.dir);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout), ['2026-03-01', '2026-01-30', '2026-11-10', '2026-11-11']);
  });

  it('CONGELA comportamiento actual: A-35 con TZ=Europe/Madrid hoy() y sumarDias(hoy(), 0) coinciden', function () {
    var codigo =
      "var u = require(REPO + '/lib/util');" +
      "console.log(JSON.stringify([u.sumarDias(u.hoy(), 0), u.hoy()]));";
    var r = sandbox.ejecutarCodigo(codigo, { tz: 'Europe/Madrid', fecha: '2026-11-11T10:00:00' });
    sandbox.borrarCarpeta(r.dir);
    assert.deepEqual(JSON.parse(r.stdout), ['2026-11-11', '2026-11-11']);
  });
});

describe('hoy (RN-53)', function () {
  function conRelojEn(isoLocal, fn) {
    var mock = test.mock;
    mock.timers.enable({ apis: ['Date'], now: new Date(isoLocal) });
    try { fn(); } finally { mock.timers.reset(); }
  }

  it('devuelve la fecha local en formato AAAA-MM-DD con ceros', function () {
    conRelojEn('2026-05-06T10:00:00', function () { assert.equal(util.hoy(), '2026-05-06'); });
    conRelojEn('2026-11-11T10:00:00', function () { assert.equal(util.hoy(), '2026-11-11'); });
  });

  it('fin de año, 1 de enero y 29 de febrero bisiesto', function () {
    conRelojEn('2026-12-31T23:59:59', function () { assert.equal(util.hoy(), '2026-12-31'); });
    conRelojEn('2027-01-01T00:00:00', function () { assert.equal(util.hoy(), '2027-01-01'); });
    conRelojEn('2024-02-29T12:00:00', function () { assert.equal(util.hoy(), '2024-02-29'); });
  });

  it('usa la hora LOCAL: 23:30 UTC del 31-dic ya es 1-ene en Madrid', function () {
    conRelojEn('2026-12-31T23:30:00Z', function () { assert.equal(util.hoy(), '2027-01-01'); });
  });
});

describe('fechaBonita (RN-53)', function () {
  it('reordena AAAA-MM-DD a DD/MM/AAAA', function () {
    assert.equal(util.fechaBonita('2026-05-06'), '06/05/2026');
    assert.equal(util.fechaBonita('2024-02-29'), '29/02/2024');
    assert.equal(util.fechaBonita('2026-12-31'), '31/12/2026');
  });

  it('vacío, nulo, indefinido y cero devuelven cadena vacía', function () {
    assert.equal(util.fechaBonita(''), '');
    assert.equal(util.fechaBonita(null), '');
    assert.equal(util.fechaBonita(undefined), '');
    assert.equal(util.fechaBonita(0), '');
  });

  it('RN-53: una fecha con hora no se trata (sale 06T10:00/05/2026)', function () {
    assert.equal(util.fechaBonita('2026-05-06T10:00'), '06T10:00/05/2026');
  });

  it('CONGELA comportamiento actual: A-64 sin formato AAAA-MM-DD devuelve "undefined" en el texto', function () {
    // Anomalía A-64 (nueva)
    assert.equal(util.fechaBonita('abc'), 'undefined/undefined/abc');
    assert.equal(util.fechaBonita('2026-5'), 'undefined/5/2026');
    assert.equal(util.fechaBonita('2026-05-06-07'), '06/05/2026');
  });
});

describe('diasDelMes (RN-54)', function () {
  it('febrero: bisiesto 29, resto 28, incluidos 1900 y 2100; 2000 sí es bisiesto', function () {
    assert.equal(util.diasDelMes('2024-02-01'), 29);
    assert.equal(util.diasDelMes('2026-02-01'), 28);
    assert.equal(util.diasDelMes('1900-02-01'), 28);
    assert.equal(util.diasDelMes('2100-02-01'), 28);
    assert.equal(util.diasDelMes('2000-02-01'), 29);
  });

  it('meses de 30 y 31 días, frontera de año', function () {
    assert.equal(util.diasDelMes('2026-01-15'), 31);
    assert.equal(util.diasDelMes('2026-04-30'), 30);
    assert.equal(util.diasDelMes('2026-12-31'), 31);
    assert.equal(util.diasDelMes('2025-12-01'), 31);
  });

  it('acepta AAAA-MM sin día y mes sin cero', function () {
    assert.equal(util.diasDelMes('2026-02'), 28);
    assert.equal(util.diasDelMes('2026-12'), 31);
    assert.equal(util.diasDelMes('2026-2-1'), 28);
  });

  it('CONGELA comportamiento actual: RN-54 / A-42 mes 13 y mes 00 dan 31 días', function () {
    assert.equal(util.diasDelMes('2026-13-01'), 31);
    assert.equal(util.diasDelMes('2026-00-01'), 31);
  });

  it('CONGELA comportamiento actual: A-65 mes 14 da 28 (febrero del año siguiente) y un texto que no es fecha da NaN', function () {
    // Anomalía A-65 (nueva)
    assert.equal(util.diasDelMes('2026-14-01'), 28);
    assert.ok(Number.isNaN(util.diasDelMes('abc')));
    assert.ok(Number.isNaN(util.diasDelMes('')));
  });
});

describe('validarNIF (RN-55, A-22)', function () {
  it('RN-55: ejemplos del documento', function () {
    assert.equal(util.validarNIF('B12345678'), true);
    assert.equal(util.validarNIF('ABCDEFGHI'), true);
    assert.equal(util.validarNIF('123456789'), true);
    assert.equal(util.validarNIF('B-1234567'), false);
    assert.equal(util.validarNIF(''), false);
  });

  it('frontera de longitud: 8 caracteres / 9 / 10 (tras quitar espacios y guiones)', function () {
    assert.equal(util.validarNIF('B1234567'), false);
    assert.equal(util.validarNIF('B12345678'), true);
    assert.equal(util.validarNIF('B123456789'), false);
  });

  it('los espacios, guiones y tabuladores no cuentan', function () {
    assert.equal(util.validarNIF('B 1234 5678'), true);
    assert.equal(util.validarNIF('B-1234-5678'), true);
    assert.equal(util.validarNIF('12345678-9'), true);
    assert.equal(util.validarNIF('\tB12345678\n'), true);
    assert.equal(util.validarNIF('---------'), false);
    assert.equal(util.validarNIF('         '), false);
  });

  it('vacíos y valores inexistentes', function () {
    assert.equal(util.validarNIF(null), false);
    assert.equal(util.validarNIF(undefined), false);
    assert.equal(util.validarNIF(0), false);
    assert.equal(util.validarNIF('  '), false);
  });

  it('números: se convierten a texto (9 dígitos valen)', function () {
    assert.equal(util.validarNIF(123456789), true);
    assert.equal(util.validarNIF(12345678), false);
    assert.equal(util.validarNIF(1234567890), false);
  });

  it('CONGELA comportamiento actual: A-22 solo se cuenta la longitud (no la letra de control ni el tipo)', function () {
    assert.equal(util.validarNIF('ABCDEFGHI'), true);
    assert.equal(util.validarNIF('b12345678'), true);
    assert.equal(util.validarNIF('ÁÉÍÓÚÑÜÇÀ'), true);
    assert.equal(util.validarNIF('000000000'), true);
  });
});

describe('formatearImporte (RN-52, A-34)', function () {
  it('RN-52: ejemplos del documento', function () {
    assert.equal(util.formatearImporte(1234.5), '1.234,50');
    assert.equal(util.formatearImporte(-1234.5), '-1.234,50');
    assert.equal(util.formatearImporte(1000000), '1.000.000,00');
    assert.equal(util.formatearImporte(2.675), '2,67');
    assert.equal(util.formatearImporte(0.005), '0,01');
    assert.equal(util.formatearImporte(-0.001), '-0,00');
    assert.equal(util.formatearImporte('abc'), '0,00');
  });

  it('frontera del separador de millares: 999 / 1000 / 1000,01 y negativos', function () {
    assert.equal(util.formatearImporte(999), '999,00');
    assert.equal(util.formatearImporte(999.99), '999,99');
    assert.equal(util.formatearImporte(1000), '1.000,00');
    assert.equal(util.formatearImporte(-999.99), '-999,99');
    assert.equal(util.formatearImporte(-1000), '-1.000,00');
    assert.equal(util.formatearImporte(1234567.891), '1.234.567,89');
    assert.equal(util.formatearImporte(123456789.126), '123.456.789,13');
  });

  it('frontera del medio céntimo en toFixed: justo debajo / exacto / justo encima', function () {
    assert.equal(util.formatearImporte(0.004), '0,00');
    assert.equal(util.formatearImporte(0.005), '0,01');
    assert.equal(util.formatearImporte(0.006), '0,01');
    assert.equal(util.formatearImporte(999.994), '999,99');
    assert.equal(util.formatearImporte(999.995), '1.000,00');
  });

  it('cero, cero negativo, vacíos y no numéricos', function () {
    assert.equal(util.formatearImporte(0), '0,00');
    assert.equal(util.formatearImporte(-0), '0,00');
    assert.equal(util.formatearImporte(null), '0,00');
    assert.equal(util.formatearImporte(undefined), '0,00');
    assert.equal(util.formatearImporte(NaN), '0,00');
    assert.equal(util.formatearImporte(''), '0,00');
    assert.equal(util.formatearImporte(' '), '0,00');
    assert.equal(util.formatearImporte([]), '0,00');
    assert.equal(util.formatearImporte({}), '0,00');
  });

  it('textos numéricos y booleanos se convierten', function () {
    assert.equal(util.formatearImporte('12.5'), '12,50');
    assert.equal(util.formatearImporte('1e3'), '1.000,00');
    assert.equal(util.formatearImporte(true), '1,00');
  });

  it('CONGELA comportamiento actual: A-34 toFixed no redondea como redondear2 (2,675 / 0,015)', function () {
    // Anomalía A-34 / contradicción 03: calcular (R-1) y mostrar (R-2) divergen
    assert.equal(util.redondear2(2.675), 2.68);
    assert.equal(util.formatearImporte(2.675), '2,67');
    assert.equal(util.redondear2(0.015), 0.02);
    assert.equal(util.formatearImporte(0.015), '0,01');
    assert.equal(util.redondear2(0.125), 0.13);
    assert.equal(util.formatearImporte(0.125), '0,13');
    assert.equal(util.redondear2(-0.125), -0.12);
    assert.equal(util.formatearImporte(-0.125), '-0,13');
    assert.equal(util.redondear2(1.005), 1);
    assert.equal(util.formatearImporte(1.005), '1,00');
  });

  it('CONGELA comportamiento actual: A-63 infinito o 1e21 producen "Infinity,undefined" / "1e+21,undefined"', function () {
    // Anomalía A-63 (nueva)
    assert.equal(util.formatearImporte(Infinity), 'Infinity,undefined');
    assert.equal(util.formatearImporte(-Infinity), '-Infinity,undefined');
    assert.equal(util.formatearImporte(1e21), '1e+21,undefined');
  });
});

describe('módulo', function () {
  it('exporta exactamente estas siete funciones', function () {
    assert.deepEqual(Object.keys(util).sort(), ['diasDelMes', 'fechaBonita', 'formatearImporte', 'hoy', 'redondear2', 'sumarDias', 'validarNIF']);
  });
});
