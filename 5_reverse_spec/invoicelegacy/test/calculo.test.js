// Tests de caracterizacion de services/calculo.js (modulo de criticidad ALTA)
// ---------------------------------------------------------------------------
// El valor esperado es SIEMPRE el que el codigo produce hoy (Constitucion,
// Principios I y IV). Referencias: reglas-de-negocio.md (RN-01..RN-18, RN-25) y
// registro-de-anomalias.md (A-xx). Cuando un ejemplo del documento sale de la BD
// semilla (valores GRABADOS) y no de ejecutar el codigo, el test lo dice.
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var assert = require('node:assert/strict');
var calculo = require('../services/calculo');
var util = require('../lib/util');

function L(descripcion, cantidad, precio, tipoIva) {
  return { descripcion: descripcion, cantidad: cantidad, precio: precio, tipoIva: tipoIva };
}
// resumen de cabecera de un resultado de calcularFactura
function cab(r) {
  return { base: r.base, iva: r.iva, recargo: r.recargo, total: r.total, descuentoPct: r.descuentoPct };
}
var SIN_RECARGO = { recargo_equivalencia: 0 };
var CON_RECARGO = { recargo_equivalencia: 1 };

describe('recargoPara (RN-04, A-29, A-39)', function () {
  it('RN-04: tabla vigente 21 → 5,2 · 10 → 1,4 · 4 → 0,5', function () {
    assert.equal(calculo.recargoPara(21), 5.2);
    assert.equal(calculo.recargoPara(10), 1.4);
    assert.equal(calculo.recargoPara(4), 0.5);
  });

  it('RN-04: tipos antiguos 18/16 → 4 y 8/7 → 1', function () {
    assert.equal(calculo.recargoPara(18), 4);
    assert.equal(calculo.recargoPara(16), 4);
    assert.equal(calculo.recargoPara(8), 1);
    assert.equal(calculo.recargoPara(7), 1);
  });

  it('cualquier otro tipo (incluido 0) → 0, por los dos lados de cada tipo de la tabla', function () {
    [0, 1, 2, 3, 5, 6, 9, 11, 15, 17, 19, 20, 22, 100, -21].forEach(function (t) {
      assert.equal(calculo.recargoPara(t), 0, 'tipo ' + t);
    });
  });

  it('valores inexistentes o de otro tipo → 0 (la comparación es estricta ===)', function () {
    assert.equal(calculo.recargoPara('21'), 0);
    assert.equal(calculo.recargoPara('4'), 0);
    assert.equal(calculo.recargoPara(21.5), 0);
    assert.equal(calculo.recargoPara(null), 0);
    assert.equal(calculo.recargoPara(undefined), 0);
    assert.equal(calculo.recargoPara(NaN), 0);
  });

  it('CONGELA comportamiento actual: A-39 se conservan los recargos de tipos antiguos «no borrar»', function () {
    // Anomalía A-39: 18 y 16 → 4 %, 8 y 7 → 1 % (ninguna línea de la BD usa ya esos tipos)
    assert.deepEqual([18, 16, 8, 7].map(calculo.recargoPara), [4, 4, 1, 1]);
  });

  it('CONGELA comportamiento actual: A-29 un IVA fuera de tabla (p. ej. 5 %) no lleva recargo aunque el cliente lo tenga', function () {
    var r = calculo.calcularFactura([L('a', 1, 100, 5)], CON_RECARGO);
    assert.deepEqual(cab(r), { base: 100, iva: 5, recargo: 0, total: 105, descuentoPct: 0 });
  });
});

describe('porcentajeDescuento (RN-07, A-07, A-24)', function () {
  it('frontera de 1.000 €: justo debajo / exacto / justo encima', function () {
    assert.equal(calculo.porcentajeDescuento(999.99), 0);
    assert.equal(calculo.porcentajeDescuento(1000), 0);
    assert.equal(calculo.porcentajeDescuento(1000.01), 2);
  });

  it('frontera de 5.000 €: justo debajo / exacto / justo encima', function () {
    assert.equal(calculo.porcentajeDescuento(4999.99), 2);
    assert.equal(calculo.porcentajeDescuento(5000), 2);
    assert.equal(calculo.porcentajeDescuento(5000.01), 5);
  });

  it('fronteras con más decimales: la comparación no redondea', function () {
    assert.equal(calculo.porcentajeDescuento(999.999), 0);
    assert.equal(calculo.porcentajeDescuento(1000.0000001), 2);
    assert.equal(calculo.porcentajeDescuento(5000.001), 5);
  });

  it('cero, negativos y valores enormes', function () {
    assert.equal(calculo.porcentajeDescuento(0), 0);
    assert.equal(calculo.porcentajeDescuento(-1), 0);
    assert.equal(calculo.porcentajeDescuento(1000000), 5);
  });

  it('vacíos, no numéricos y textos numéricos (se comparan con > de JavaScript)', function () {
    assert.equal(calculo.porcentajeDescuento(NaN), 0);
    assert.equal(calculo.porcentajeDescuento(null), 0);
    assert.equal(calculo.porcentajeDescuento(undefined), 0);
    assert.equal(calculo.porcentajeDescuento('1000.01'), 2);
    assert.equal(calculo.porcentajeDescuento('5000.01'), 5);
    assert.equal(calculo.porcentajeDescuento('1001'), 2);
  });

  it('CONGELA comportamiento actual: A-24 una base de 1.000,00 € exactos no lleva descuento (regla protegida)', function () {
    // Anomalía A-24 (caso comentado con la gestoría, db.js:138). Contraste con RN-07:
    // total 1.210,00 € sin descuento; el ejemplo del documento sale de la BD y aquí
    // se reproduce con una línea única de 1.000,00 € (ver A-69 para la factura grabada).
    var r = calculo.calcularFactura([L('Pedido', 1, 1000, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 1000, iva: 210, recargo: 0, total: 1210, descuentoPct: 0 });
  });

  it('CONGELA comportamiento actual: A-07 una base de 5.000,00 € exactos lleva el 2 % y no el 5 %', function () {
    // Anomalía A-07. RN-07: 5.000,00 → 2 % (precio 4.900,00); 5.000,01 → 5 % (precio 4.750,01)
    var exacto = calculo.calcularFactura([L('Pedido', 1, 5000, 21)], SIN_RECARGO);
    assert.deepEqual(cab(exacto), { base: 4900, iva: 1029, recargo: 0, total: 5929, descuentoPct: 2 });
    var encima = calculo.calcularFactura([L('Pedido', 1, 5000.01, 21)], SIN_RECARGO);
    assert.deepEqual(cab(encima), { base: 4750.01, iva: 997.5, recargo: 0, total: 5747.51, descuentoPct: 5 });
    var debajo = calculo.calcularFactura([L('Pedido', 1, 4999.99, 21)], SIN_RECARGO);
    assert.deepEqual(cab(debajo), { base: 4899.99, iva: 1029, recargo: 0, total: 5928.99, descuentoPct: 2 });
  });
});

describe('calcularLinea (RN-01, RN-02, RN-03, RN-12, RN-13)', function () {
  it('RN-01: 0,44 cajas × 21,60 € = 9,504 → 9,50 € (línea de FA-2026-000101)', function () {
    assert.deepEqual(calculo.calcularLinea(0.44, 21.6, 21, false), { base: 9.5, cuotaIva: 2, cuotaRecargo: 0 });
  });

  it('RN-03: base 74,00 al 21 % con recargo → IVA 15,54 y recargo 3,85 (FA-2026-000102)', function () {
    assert.deepEqual(calculo.calcularLinea(1, 74, 21, true), { base: 74, cuotaIva: 15.54, cuotaRecargo: 3.85 });
  });

  it('RN-04: recargo 4 % sobre 113,60 → 0,57; 10 % sobre 23,90 → 0,33; IVA 5 % con marca → 0', function () {
    assert.deepEqual(calculo.calcularLinea(1, 113.6, 4, true), { base: 113.6, cuotaIva: 4.54, cuotaRecargo: 0.57 });
    assert.deepEqual(calculo.calcularLinea(1, 23.9, 10, true), { base: 23.9, cuotaIva: 2.39, cuotaRecargo: 0.33 });
    assert.deepEqual(calculo.calcularLinea(1, 100, 5, true), { base: 100, cuotaIva: 5, cuotaRecargo: 0 });
  });

  it('sin marca de recargo el recargo es 0 aunque el tipo lo tenga', function () {
    assert.deepEqual(calculo.calcularLinea(1, 100, 21, false), { base: 100, cuotaIva: 21, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(1, 100, 21, undefined), { base: 100, cuotaIva: 21, cuotaRecargo: 0 });
  });

  it('la marca se evalúa por veracidad (truthy): 2, "1" y true activan el recargo', function () {
    assert.equal(calculo.calcularLinea(1, 100, 21, 2).cuotaRecargo, 5.2);
    assert.equal(calculo.calcularLinea(1, 100, 21, '1').cuotaRecargo, 5.2);
    assert.equal(calculo.calcularLinea(1, 100, 21, true).cuotaRecargo, 5.2);
  });

  it('coma flotante: 0,01 × 14,50 = 0,145 → 0,14 y 0,03 × 7,50 = 0,225 → 0,22', function () {
    assert.deepEqual(calculo.calcularLinea(0.01, 14.5, 21, false), { base: 0.14, cuotaIva: 0.03, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(0.03, 7.5, 21, false), { base: 0.22, cuotaIva: 0.05, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(3, 19.99, 21, true), { base: 59.97, cuotaIva: 12.59, cuotaRecargo: 3.12 });
    assert.deepEqual(calculo.calcularLinea(7, 0.1, 21, true), { base: 0.7, cuotaIva: 0.15, cuotaRecargo: 0.04 });
  });

  it('medio céntimo en la base: 0,004 → 0 / 0,005 → 0,01 / 0,006 → 0,01', function () {
    assert.equal(calculo.calcularLinea(1, 0.004, 21, false).base, 0);
    assert.equal(calculo.calcularLinea(1, 0.005, 21, false).base, 0.01);
    assert.equal(calculo.calcularLinea(1, 0.006, 21, false).base, 0.01);
  });

  it('RN-12: cero (cantidad 0, precio 0) y cuota de IVA que se redondea a 0', function () {
    assert.deepEqual(calculo.calcularLinea(0, 10, 21, false), { base: 0, cuotaIva: 0, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(10, 0, 21, true), { base: 0, cuotaIva: 0, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(1, 0.01, 21, true), { base: 0.01, cuotaIva: 0, cuotaRecargo: 0 });
  });

  it('RN-12: cantidad o precio negativos se calculan tal cual', function () {
    assert.deepEqual(calculo.calcularLinea(-1, 10, 21, true), { base: -10, cuotaIva: -2.1, cuotaRecargo: -0.52 });
    assert.deepEqual(calculo.calcularLinea(1, -10, 21, true), { base: -10, cuotaIva: -2.1, cuotaRecargo: -0.52 });
  });

  it('RN-13: IVA 0 % y IVA negativo se aplican sin validar', function () {
    assert.deepEqual(calculo.calcularLinea(1, 10, 0, true), { base: 10, cuotaIva: 0, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(1, 10, -21, true), { base: 10, cuotaIva: -2.1, cuotaRecargo: 0 });
  });

  it('CONGELA comportamiento actual: A-45 cantidad o precio no numéricos dan NaN en base e IVA', function () {
    // Anomalía A-45 / RN-12. (La BD lo guarda como NULL y el INSERT falla: ver rutas de facturas)
    assert.deepEqual(calculo.calcularLinea(NaN, 10, 21, false), { base: NaN, cuotaIva: NaN, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(1, NaN, 21, false), { base: NaN, cuotaIva: NaN, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(undefined, 10, 21, false), { base: NaN, cuotaIva: NaN, cuotaRecargo: 0 });
    assert.deepEqual(calculo.calcularLinea(1, 10, NaN, false), { base: 10, cuotaIva: NaN, cuotaRecargo: 0 });
  });

  it('textos numéricos como entrada se multiplican igualmente', function () {
    assert.deepEqual(calculo.calcularLinea('2', '3', '21', false), { base: 6, cuotaIva: 1.26, cuotaRecargo: 0 });
  });

  it('CONGELA comportamiento actual: A-62 un precio negativo de medio céntimo deja -0 en la base y las cuotas', function () {
    // Anomalía A-62 (nueva): el cero negativo se propaga por la línea
    var l = calculo.calcularLinea(1, -0.005, 21, true);
    assert.ok(Object.is(l.base, -0));
    assert.ok(Object.is(l.cuotaIva, -0));
    assert.ok(Object.is(l.cuotaRecargo, -0));
  });
});

describe('calcularFactura (RN-02, RN-05, RN-06, RN-08, RN-09, RN-10, RN-12)', function () {
  it('forma exacta del resultado: línea con cliente en recargo (todas las propiedades)', function () {
    var r = calculo.calcularFactura([L('a', 1, 100, 21)], CON_RECARGO);
    assert.deepEqual(r, {
      lineas: [{ descripcion: 'a', cantidad: 1, precio: 100, tipoIva: 21, base: 100, cuotaIva: 21, cuotaRecargo: 5.2 }],
      base: 100, iva: 21, recargo: 5.2, total: 126.2, descuentoPct: 0
    });
  });

  it('RN-02: tres líneas de 0,12 € al 21 % → IVA 0,09 (por línea), no 0,08 (sobre el total)', function () {
    var r = calculo.calcularFactura([L('a', 1, 0.12, 21), L('b', 1, 0.12, 21), L('c', 1, 0.12, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 0.36, iva: 0.09, recargo: 0, total: 0.45, descuentoPct: 0 });
    assert.equal(util.redondear2(0.36 * 21 / 100), 0.08); // lo que saldría redondeando sobre el total
  });

  it('RN-05/RN-06: FA-2026-000102 (cliente con recargo) — IVA 24,28 y recargo 6,01 coinciden con la BD', function () {
    // OJO: la BD tiene la línea «Portes» a 1,90 y la base 115,60; el código da 1,92 y 115,62
    // (H-02 del documento). IVA y recargo SÍ coinciden con los grabados.
    var r = calculo.calcularFactura([
      L('Desengrasante cocinas 10L', 4, 18.5, 21),
      L('Plato llano hostelería 25cm (caja 12)', 1, 28.9, 21),
      L('Vaso caña 20cl (caja 72)', 0.5, 21.6, 21),
      L('Portes y manipulación', 0.32, 6, 21)
    ], CON_RECARGO);
    assert.deepEqual(r.lineas.map(function (x) { return [x.base, x.cuotaIva, x.cuotaRecargo]; }), [
      [74, 15.54, 3.85], [28.9, 6.07, 1.5], [10.8, 2.27, 0.56], [1.92, 0.4, 0.1]
    ]);
    assert.deepEqual(cab(r), { base: 115.62, iva: 24.28, recargo: 6.01, total: 145.91, descuentoPct: 0 });
  });

  it('RN-04: FA-2026-000104 (recargo 4 %) reproduce exactamente la cabecera grabada', function () {
    var r = calculo.calcularFactura([L('Harina panificable 25kg', 8, 14.2, 4), L('Aceite de oliva virgen extra 5L', 1.41, 27.45, 4)], CON_RECARGO);
    assert.deepEqual(cab(r), { base: 152.3, iva: 6.09, recargo: 0.76, total: 159.15, descuentoPct: 0 });
  });

  it('RN-03: la marca de recargo se evalúa con == 1 (1, "1", true sí; 0, 2, null, "a" no)', function () {
    function recargo(marca) { return calculo.calcularFactura([L('a', 1, 100, 21)], { recargo_equivalencia: marca }).recargo; }
    assert.equal(recargo(1), 5.2);
    assert.equal(recargo('1'), 5.2);
    assert.equal(recargo(true), 5.2);
    assert.equal(recargo(0), 0);
    assert.equal(recargo(2), 0);
    assert.equal(recargo(null), 0);
    assert.equal(recargo('a'), 0);
  });

  it('CONGELA comportamiento actual: A-73 la marca de recargo también se activa con "1.0" y con [1] (comparación laxa ==)', function () {
    // Anomalía A-73 (nueva)
    function recargo(marca) { return calculo.calcularFactura([L('a', 1, 100, 21)], { recargo_equivalencia: marca }).recargo; }
    assert.equal(recargo('1.0'), 5.2);
    assert.equal(recargo([1]), 5.2);
    assert.equal(recargo(' 1 '), 5.2);
    assert.equal(recargo(''), 0);
    assert.equal(recargo(undefined), 0);
  });

  it('cliente nulo o indefinido: sin recargo y sin error', function () {
    assert.deepEqual(cab(calculo.calcularFactura([L('a', 1, 100, 21)], null)), { base: 100, iva: 21, recargo: 0, total: 121, descuentoPct: 0 });
    assert.deepEqual(cab(calculo.calcularFactura([L('a', 1, 100, 21)], undefined)), { base: 100, iva: 21, recargo: 0, total: 121, descuentoPct: 0 });
  });

  it('RN-12: sin líneas todo es 0', function () {
    assert.deepEqual(calculo.calcularFactura([], SIN_RECARGO), { lineas: [], base: 0, iva: 0, recargo: 0, total: 0, descuentoPct: 0 });
  });

  it('RN-12: todo a cero (cantidad 0, precio 0, IVA 0 %)', function () {
    var r = calculo.calcularFactura([L('a', 0, 0, 0)], CON_RECARGO);
    assert.deepEqual(cab(r), { base: 0, iva: 0, recargo: 0, total: 0, descuentoPct: 0 });
  });

  it('RN-12: una línea con 1 × -2.000 € al 21 % da total -2.420,00 y no descuenta', function () {
    var r = calculo.calcularFactura([L('a', 1, -2000, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: -2000, iva: -420, recargo: 0, total: -2420, descuentoPct: 0 });
  });

  it('RN-12: líneas negativas y positivas se compensan antes de decidir el descuento', function () {
    var r = calculo.calcularFactura([L('a', 1, 1500, 21), L('b', 1, -600, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 900, iva: 189, recargo: 0, total: 1089, descuentoPct: 0 });
  });

  it('RN-07: 1.000,00 / 1.000,01 / 999,99 (los tres puntos por los dos lados)', function () {
    assert.deepEqual(cab(calculo.calcularFactura([L('a', 1, 999.99, 21)], SIN_RECARGO)), { base: 999.99, iva: 210, recargo: 0, total: 1209.99, descuentoPct: 0 });
    assert.deepEqual(cab(calculo.calcularFactura([L('a', 1, 1000, 21)], SIN_RECARGO)), { base: 1000, iva: 210, recargo: 0, total: 1210, descuentoPct: 0 });
    assert.deepEqual(cab(calculo.calcularFactura([L('a', 1, 1000.01, 21)], SIN_RECARGO)), { base: 980.01, iva: 205.8, recargo: 0, total: 1185.81, descuentoPct: 2 });
  });

  it('RN-07: el tramo se decide con la suma de varias líneas (333,33 + 333,33 + 333,34 = 1.000,00 → sin descuento)', function () {
    var r = calculo.calcularFactura([L('a', 1, 333.33, 21), L('b', 1, 333.33, 21), L('c', 1, 333.34, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 1000, iva: 210, recargo: 0, total: 1210, descuentoPct: 0 });
  });

  it('RN-08: 1.020,41 € brutos → 2 % → base final 1.000,00 € con descuentoPct 2 (el tramo se decide antes de descontar)', function () {
    var r = calculo.calcularFactura([L('a', 1, 1020.41, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 1000, iva: 210, recargo: 0, total: 1210, descuentoPct: 2 });
    // un céntimo menos: la base final baja de 1.000
    var r2 = calculo.calcularFactura([L('a', 1, 1020.4, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r2), { base: 999.99, iva: 210, recargo: 0, total: 1209.99, descuentoPct: 2 });
    // con recargo
    var r3 = calculo.calcularFactura([L('a', 1, 1020.41, 21)], CON_RECARGO);
    assert.deepEqual(cab(r3), { base: 1000, iva: 210, recargo: 52, total: 1262, descuentoPct: 2 });
  });

  it('RN-09: líneas 1 × 1.000,50 y 3 × 0,25 → precios 980,49 y 0,25 (el descuento se pierde por redondeo), base 981,24', function () {
    var r = calculo.calcularFactura([L('a', 1, 1000.5, 21), L('b', 3, 0.25, 21)], SIN_RECARGO);
    assert.deepEqual(r.lineas.map(function (x) { return x.precio; }), [980.49, 0.25]);
    assert.deepEqual(cab(r), { base: 981.24, iva: 206.06, recargo: 0, total: 1187.3, descuentoPct: 2 });
    // si se descontara sobre el total saldría 981,23 (diferencia de un céntimo del documento)
    assert.equal(util.redondear2(1001.25 * 0.98), 981.23);
  });

  it('RN-09: el precio guardado en cada línea es el precio ya descontado', function () {
    var r = calculo.calcularFactura([L('a', 3, 2000, 21), L('b', 1, 0.01, 10)], CON_RECARGO);
    assert.deepEqual(r.lineas.map(function (x) { return [x.precio, x.base, x.cuotaIva, x.cuotaRecargo]; }), [[1900, 5700, 1197, 296.4], [0.01, 0.01, 0, 0]]);
    assert.deepEqual(cab(r), { base: 5700.01, iva: 1197, recargo: 296.4, total: 7193.41, descuentoPct: 5 });
  });

  it('RN-10 / RN-25: el descuento no distingue cliente ni concepto (1.500 € → precio 1.470,00, total 1.778,70)', function () {
    var r = calculo.calcularFactura([L('Alquiler', 1, 1500, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 1470, iva: 308.7, recargo: 0, total: 1778.7, descuentoPct: 2 });
    var rr = calculo.calcularFactura([L('Alquiler', 1, 1500, 21)], CON_RECARGO);
    assert.deepEqual(cab(rr), { base: 1470, iva: 308.7, recargo: 76.44, total: 1855.14, descuentoPct: 2 });
  });

  it('IVA mezclado 21/10/4 con recargo y descuento', function () {
    var r = calculo.calcularFactura([L('a', 1, 500, 21), L('b', 1, 600, 10), L('c', 1, 100, 4)], CON_RECARGO);
    assert.deepEqual(cab(r), { base: 1176, iva: 165.62, recargo: 34.2, total: 1375.82, descuentoPct: 2 });
  });

  it('no modifica las líneas de entrada', function () {
    var entrada = [L('a', 1, 2000, 21)];
    calculo.calcularFactura(entrada, SIN_RECARGO);
    assert.deepEqual(entrada, [L('a', 1, 2000, 21)]);
  });

  it('el tipo de IVA como texto "21" calcula IVA pero no recargo (recargoPara usa ===)', function () {
    var r = calculo.calcularFactura([L('a', 1, 100, '21')], CON_RECARGO);
    assert.deepEqual(cab(r), { base: 100, iva: 21, recargo: 0, total: 121, descuentoPct: 0 });
  });

  it('suma paso a paso: 0,1 + 0,2 de base = 0,30 exacto', function () {
    var r = calculo.calcularFactura([L('a', 1, 0.1, 21), L('b', 1, 0.2, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 0.3, iva: 0.06, recargo: 0, total: 0.36, descuentoPct: 0 });
  });

  it('cantidad fraccionaria: 0,333 × 3 = 0,999 → base 1,00', function () {
    var r = calculo.calcularFactura([L('a', 0.333, 3, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 1, iva: 0.21, recargo: 0, total: 1.21, descuentoPct: 0 });
  });

  it('CONGELA comportamiento actual: A-02 redondeo línea a línea de IVA y recargo (nunca sobre el total)', function () {
    // Anomalía A-02, regla protegida (Principio I). La suma de líneas redondeadas
    // difiere del cálculo sobre el total, y se queda como está.
    var r = calculo.calcularFactura([L('a', 1, 0.12, 21), L('b', 1, 0.12, 21), L('c', 1, 0.12, 21)], SIN_RECARGO);
    assert.equal(r.iva, 0.09);
    assert.notEqual(r.iva, util.redondear2(r.base * 21 / 100));
  });

  it('CONGELA comportamiento actual: A-09 se aceptan cantidades y precios negativos y el total FA sale negativo', function () {
    // Anomalía A-09
    var r = calculo.calcularFactura([L('a', -1, 2000, 21)], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: -2000, iva: -420, recargo: 0, total: -2420, descuentoPct: 0 });
    var r2 = calculo.calcularFactura([L('a', -3, -10, 21)], CON_RECARGO);
    assert.deepEqual(cab(r2), { base: 30, iva: 6.3, recargo: 1.56, total: 37.86, descuentoPct: 0 });
  });

  it('CONGELA comportamiento actual: A-25 el tramo del descuento se decide con la base antes de descontar', function () {
    // Anomalía A-25 (RN-08): la base final puede quedar por debajo del umbral
    var r = calculo.calcularFactura([L('a', 1, 1020.41, 21)], SIN_RECARGO);
    assert.equal(r.descuentoPct, 2);
    assert.ok(!(r.base > 1000));
  });

  it('CONGELA comportamiento actual: A-26 el descuento se aplica igual con o sin recargo, a cualquier cliente y concepto', function () {
    // Anomalía A-26: la función solo recibe líneas y la marca de recargo; no hay sector
    var hosteleria = calculo.calcularFactura([L('Vasos', 1, 1500, 21)], SIN_RECARGO);
    var ferreteria = calculo.calcularFactura([L('Tornillos', 1, 1500, 21)], CON_RECARGO);
    assert.equal(hosteleria.descuentoPct, 2);
    assert.equal(ferreteria.descuentoPct, 2);
    assert.equal(calculo.calcularFactura([L('Portes', 1, 1500, 21)], {}).descuentoPct, 2);
  });

  it('CONGELA comportamiento actual: A-28 el descuento rebaja el precio unitario de cada línea y recalcula (H-04: FA-2026-000105 no se reproduce)', function () {
    // Anomalía A-28. La BD guarda las líneas de FA-2026-000105 SIN descuento y base 2.287,75;
    // el código sobre esas mismas líneas da 2.288,68 (documento H-04).
    var r = calculo.calcularFactura([
      L('Mantenimiento cámaras frigoríficas (marzo)', 1, 145, 21),
      L('Aceite de oliva virgen extra 5L', 24, 27.45, 4),
      L('Café en grano natural 1kg', 30, 11.95, 10),
      L('Plato llano hostelería 25cm (caja 12)', 40, 28.9, 21),
      L('Portes y manipulación', 2.87, 6, 21)
    ], SIN_RECARGO);
    assert.deepEqual(r.lineas.map(function (x) { return [x.precio, x.base, x.cuotaIva]; }), [
      [142.1, 142.1, 29.84], [26.9, 645.6, 25.82], [11.71, 351.3, 35.13], [28.32, 1132.8, 237.89], [5.88, 16.88, 3.54]
    ]);
    assert.deepEqual(cab(r), { base: 2288.68, iva: 332.22, recargo: 0, total: 2620.9, descuentoPct: 2 });
  });

  it('CONGELA comportamiento actual: A-69 FA-2026-000103 recalculada con sus líneas NO es el caso «1.000 justo sin descuento»', function () {
    // Anomalía A-69 (nueva). La cabecera grabada es 1.000,00 € sin descuento (db.js:138), pero la
    // línea «Portes» 0,92 × 6,00 = 5,52 (grabada 5,50, H-02) hace que el código dé 1.000,02 € brutos:
    // 2 % de descuento y base 980,01 €. El caso de referencia con la gestoría no es reproducible.
    var r = calculo.calcularFactura([
      L('Plato llano hostelería 25cm (caja 12)', 20, 28.9, 21),
      L('Vaso caña 20cl (caja 72)', 15, 21.6, 21),
      L('Desengrasante cocinas 10L', 5, 18.5, 21),
      L('Portes y manipulación', 0.92, 6, 21)
    ], SIN_RECARGO);
    assert.deepEqual(cab(r), { base: 980.01, iva: 205.81, recargo: 0, total: 1185.82, descuentoPct: 2 });
  });

  it('CONGELA comportamiento actual: A-45 una línea no numérica anula toda la factura (total NaN) y el precio de la línea sigue intacto', function () {
    var r = calculo.calcularFactura([L('a', NaN, 10, 21)], SIN_RECARGO);
    assert.deepEqual(r, {
      lineas: [{ descripcion: 'a', cantidad: NaN, precio: 10, tipoIva: 21, base: NaN, cuotaIva: NaN, cuotaRecargo: 0 }],
      base: NaN, iva: NaN, recargo: 0, total: NaN, descuentoPct: 0
    });
    var r2 = calculo.calcularFactura([{ descripcion: 'x' }], SIN_RECARGO);
    assert.ok(Number.isNaN(r2.total));
  });

  it('CONGELA comportamiento actual: A-67 una sola línea no numérica anula también el descuento de las demás líneas', function () {
    // Anomalía A-67 (nueva): baseBruta pasa a NaN, porcentajeDescuento(NaN) = 0.
    // Sin la línea NaN, 2.000 € llevarían el 2 %.
    var r = calculo.calcularFactura([L('a', 1, 2000, 21), L('b', NaN, 5, 21)], SIN_RECARGO);
    assert.equal(r.descuentoPct, 0);
    assert.equal(r.lineas[0].precio, 2000);
    assert.ok(Number.isNaN(r.total));
    assert.equal(calculo.calcularFactura([L('a', 1, 2000, 21)], SIN_RECARGO).descuentoPct, 2);
  });

  it('CONGELA comportamiento actual: A-62 un precio negativo de medio céntimo deja -0 en la línea pero 0 en la cabecera', function () {
    var r = calculo.calcularFactura([L('a', 1, -0.004, 21)], SIN_RECARGO);
    assert.ok(Object.is(r.lineas[0].base, -0));
    assert.ok(Object.is(r.lineas[0].cuotaIva, -0));
    assert.ok(Object.is(r.base, 0));
    assert.ok(Object.is(r.total, 0));
  });

  it('CONGELA comportamiento actual: A-01 (parte código) el código genera cabecera = suma de líneas; las facturas grabadas FA-2026-000101 y -108 no lo cumplen', function () {
    // Con las líneas de la BD, el código da IVA 24,27 (FA-101) y 24,28 (FA-108); la cabecera
    // grabada es 27,97 y 26,19. El detalle completo contra la BD está en semilla.test.js.
    var fa101 = calculo.calcularFactura([L('a', 1, 90, 21), L('b', 2, 11.95, 10), L('c', 1, 9.8, 10), L('d', 0.44, 21.6, 21)], SIN_RECARGO);
    assert.deepEqual(cab(fa101), { base: 133.2, iva: 24.27, recargo: 0, total: 157.47, descuentoPct: 0 });
    var sumaIvaLineas = util.redondear2(fa101.lineas.reduce(function (a, l) { return a + l.cuotaIva; }, 0));
    assert.equal(sumaIvaLineas, fa101.iva);
    var fa108 = calculo.calcularFactura([L('a', 1, 90, 21), L('b', 2, 11.95, 10), L('c', 0.66, 21.6, 21)], SIN_RECARGO);
    assert.deepEqual(cab(fa108), { base: 128.16, iva: 24.28, recargo: 0, total: 152.44, descuentoPct: 0 });
  });
});

describe('calcularProrrateo (RN-14..RN-18, A-23, A-30)', function () {
  it('RN-14: cuota 90 € — del 1 al 16 → 48,00; un día (15 al 15) → 3,00; del 1 al 15 → 45,00', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-16'), 48);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-15', '2026-07-15'), 3);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-15'), 45);
  });

  it('RN-15: el tope de 30 días — días 29 / 30 / 31 / 45 (los tres puntos por los dos lados)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-29'), 87);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-30'), 90);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-31'), 90);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-45'), 90);
  });

  it('RN-15: del 2 al 31 y del 1 al 30 cuestan la cuota entera (100 €)', function () {
    assert.equal(calculo.calcularProrrateo(100, '2026-07-02', '2026-07-31'), 100);
    assert.equal(calculo.calcularProrrateo(100, '2026-07-01', '2026-07-30'), 100);
  });

  it('RN-16: fecha final anterior a la inicial → 0; el mismo día → 1 día', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-07-10', '2026-07-05'), 0);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-10', '2026-07-09'), 0);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-10', '2026-07-10'), 3);
    assert.equal(calculo.calcularProrrateo(100, '2026-07-31', '2026-07-01'), 0);
  });

  it('RN-16: solo mira el día del mes (del 2026-03-15 al 2026-04-20 son 6 días = 18,00)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-03-15', '2026-04-20'), 18);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-08-05'), 15);
  });

  it('RN-17: febrero completo cobra 28/30 (84,00 con 90 €; 93,33 con 100 €); bisiesto 29/30 (87,00)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-02-01', '2026-02-28'), 84);
    assert.equal(calculo.calcularProrrateo(100, '2026-02-01', '2026-02-28'), 93.33);
    assert.equal(calculo.calcularProrrateo(90, '2024-02-01', '2024-02-29'), 87);
  });

  it('RN-18: contrato 2 (145 €) dado de baja el 15-mar-2026 → 72,50', function () {
    assert.equal(calculo.calcularProrrateo(145, '2026-03-01', '2026-03-15'), 72.5);
  });

  it('redondeo del importe: 1 día de 100 € → 3,33; 2 días → 6,67; 1 día de 1 € → 0,03; 0,01 € × 15 días → 0,01', function () {
    assert.equal(calculo.calcularProrrateo(100, '2026-07-01', '2026-07-01'), 3.33);
    assert.equal(calculo.calcularProrrateo(100, '2026-07-01', '2026-07-02'), 6.67);
    assert.equal(calculo.calcularProrrateo(1, '2026-07-01', '2026-07-01'), 0.03);
    assert.equal(calculo.calcularProrrateo(0.01, '2026-07-01', '2026-07-15'), 0.01);
    assert.equal(calculo.calcularProrrateo(10, '2026-07-01', '2026-07-03'), 1);
  });

  it('cuota cero, negativa y como texto', function () {
    assert.equal(calculo.calcularProrrateo(0, '2026-07-01', '2026-07-31'), 0);
    assert.equal(calculo.calcularProrrateo(-90, '2026-07-01', '2026-07-16'), -48);
    assert.equal(calculo.calcularProrrateo('90', '2026-07-01', '2026-07-16'), 48);
  });

  it('CONGELA comportamiento actual: A-23 (mitad «pantalla de baja», 30 días fijos) alta 16-jul de 90 € → 48,00; baja 15-mar de 145 € → 72,50; todo febrero → 84,00', function () {
    // Anomalía A-23 / contradicción 01, implementación I-1 (calculo.calcularProrrateo).
    // La implementación I-2 (remesa) da 46,45 / 70,16 / 90,00: ver remesa.test.js.
    assert.equal(calculo.calcularProrrateo(90, '2026-07-16', '2026-07-31'), 48);
    assert.equal(calculo.calcularProrrateo(145, '2026-03-01', '2026-03-15'), 72.5);
    assert.equal(calculo.calcularProrrateo(90, '2026-02-01', '2026-02-28'), 84);
    assert.equal(calculo.calcularProrrateo(145, '2023-01-15', '2023-01-31'), 82.17);
    assert.equal(calculo.calcularProrrateo(90, '2026-02-15', '2026-02-28'), 42);
  });

  it('CONGELA comportamiento actual: A-30 no valida las fechas (día 45, día 00, mes distinto, texto no fecha)', function () {
    // Anomalía A-30 y A-68 (nueva)
    assert.equal(calculo.calcularProrrateo(90, '2026-07-00', '2026-07-10'), 33);
    assert.equal(calculo.calcularProrrateo(90, '2026-07-01', '2026-07-0'), 0);
    assert.ok(Number.isNaN(calculo.calcularProrrateo(90, 'x', 'y')));
    assert.ok(Number.isNaN(calculo.calcularProrrateo(90, '2026-07', '2026-07')));
    assert.ok(Number.isNaN(calculo.calcularProrrateo(NaN, '2026-07-01', '2026-07-16')));
    assert.ok(Number.isNaN(calculo.calcularProrrateo(90, '', '')));
  });

  it('CONGELA comportamiento actual: A-68 una fecha nula o indefinida lanza TypeError', function () {
    // Anomalía A-68 (nueva)
    assert.throws(function () { calculo.calcularProrrateo(90, null, '2026-07-10'); }, TypeError);
    assert.throws(function () { calculo.calcularProrrateo(90, '2026-07-01', undefined); }, TypeError);
  });
});

describe('módulo', function () {
  it('exporta exactamente estas cinco funciones', function () {
    assert.deepEqual(Object.keys(calculo).sort(), ['calcularFactura', 'calcularLinea', 'calcularProrrateo', 'porcentajeDescuento', 'recargoPara']);
  });
});
