// Tests de caracterizacion de las rutas HTTP: routes/facturas.js (criticidad ALTA),
// routes/informes.js (ALTA), routes/contratos.js, routes/clientes.js, routes/articulos.js
// y el panel de server.js. Se ejercitan los routers REALES por HTTP en un proceso hijo
// (ayudas/escenario-http.js y ayudas/panel.js), con BD temporal (semilla), TZ=Europe/Madrid
// y reloj fijo 2026-11-11 10:00. La BD real no se toca.
// Referencias: RN-27..RN-34, RN-41..RN-50 y anomalias A-01, A-05, A-06, A-08, A-09, A-10,
// A-12, A-13, A-14, A-15, A-16, A-21, A-22, A-29, A-33, A-40..A-46, A-52..A-54, A-62 y A-17.
require('./ayudas/tz');
var test = require('node:test');
var describe = test.describe;
var it = test.it;
var before = test.before;
var assert = require('node:assert/strict');
var path = require('path');
var sandbox = require('./ayudas/sandbox');
var config = require('../config');

var ESCENARIO = path.join(sandbox.RAIZ, 'test', 'ayudas', 'escenario-http.js');
var PANEL = path.join(sandbox.RAIZ, 'test', 'ayudas', 'panel.js');

// ---- ayudas ---------------------------------------------------------------
function ejecutar(pasos, opciones) {
  opciones = opciones || {};
  var r = sandbox.lanzar({ script: ESCENARIO, input: JSON.stringify(pasos), fecha: opciones.fecha, tz: opciones.tz });
  sandbox.borrarCarpeta(r.dir);
  assert.equal(r.status, 0, r.stderr);
  return sandbox.resultadoJson(r.stdout);
}
function paso(o, nombre) {
  var x = o.respuestas.filter(function (r) { return r.paso === nombre; })[0];
  assert.ok(x, 'no existe el paso ' + nombre);
  return x;
}
function fac(o, numero) {
  var f = o.facturas.filter(function (x) { return x.numero === numero; })[0];
  assert.ok(f, 'no existe la factura ' + numero);
  return f;
}
// las líneas se insertan en paralelo (orden no garantizado, ver flujo-factura §3.6): se ordenan por descripción
function lineas(o, numero) {
  var f = fac(o, numero);
  return o.lineas.filter(function (l) { return l.factura_id === f.id; })
    .sort(function (a, b) { return a.descripcion < b.descripcion ? -1 : a.descripcion > b.descripcion ? 1 : 0; });
}
function resumenLinea(l) { return [l.descripcion, l.cantidad, l.precio, l.tipo_iva, l.base, l.cuota_iva, l.cuota_recargo]; }
function cabecera(f) { return [f.fecha, f.vencimiento, f.base, f.iva, f.recargo, f.total, f.estado, f.observaciones]; }
function form(cliente, fecha, filas, obs) {
  var f = { cliente_id: String(cliente), desc: [], cant: [], precio: [], iva: [] };
  if (fecha !== null) f.fecha = fecha;
  if (obs !== undefined) f.obs = obs;
  filas.forEach(function (l) { f.desc.push(l[0]); f.cant.push(l[1]); f.precio.push(l[2]); f.iva.push(l[3]); });
  return f;
}
function alta(nombre, f) { return { nombre: nombre, metodo: 'POST', ruta: '/facturas/nueva', form: f }; }
function post(nombre, ruta, f) { return { nombre: nombre, metodo: 'POST', ruta: ruta, form: f }; }
function get(nombre, ruta) { return { nombre: nombre, metodo: 'GET', ruta: ruta }; }
function sql(texto) { return { nombre: 'sql', sql: texto }; }
function norm(html) {
  return html.match(/<div id="contenido">([\s\S]*)<div id="pie">/)[1].replace(/\s+/g, ' ').replace(/> </g, '><').trim();
}
function filasIva(html) {
  var m = html.match(/<table class="tabla-datos"[\s\S]*?<\/table>/)[0];
  return m.split('</tr>').map(function (tr) {
    return (tr.match(/<td[^>]*>[^<]*<\/td>/g) || []).map(function (td) { return td.replace(/<[^>]+>/g, ''); });
  }).filter(function (c) { return c.length; });
}

// ===========================================================================
describe('POST /facturas/nueva: alta manual (RN-27..RN-34)', function () {
  var o;
  before(function () {
    o = ejecutar([
      alta('sin-lineas', form(1, '2026-01-31', [['', '', '', '']])),
      alta('cliente-inexistente', form(99, '2026-01-31', [['x', '1', '1', '21']])),
      alta('cliente-texto', { cliente_id: 'abc', desc: 'x', cant: '1', precio: '1', iva: '21' }),
      alta('comas-y-miles', form(1, '2026-01-31', [['a', '1', '1.234,50', '21'], ['b', '0,5', '12,34', '10'], ['', '2', '50', '21']])),
      alta('fecha-vacia', form(1, '', [['a', '1', '10', '21']])),
      alta('fecha-ilegible', form(1, 'abc', [['a', '1', '10', '21']])),
      alta('fecha-de-2025', form(1, '2025-12-31', [['a', '1', '10', '21']])),
      alta('precio-vacio', form(1, '2026-01-31', [['a', '1', '', '21']])),
      alta('iva-vacio', form(1, '2026-01-31', [['a', '1', '10', '']])),
      alta('iva-5-con-recargo', form(2, '2026-01-31', [['a', '1', '100', '5']])),
      alta('cliente-60-dias', form(3, '2026-01-31', [['a', '1', '10', '21']])),
      alta('descuento-sin-obs', form(1, '2026-01-31', [['a', '1', '2000', '21']])),
      alta('descuento-con-obs', form(1, '2026-01-31', [['a', '1', '2000', '21']], 'Pedido X')),
      alta('sin-campo-obs', form(1, '2026-01-31', [['a', '1', '10', '21']])),
      alta('una-sola-linea-en-texto', { cliente_id: '1', fecha: '2026-01-31', desc: 'solo', cant: '2', precio: '3', iva: '21' }),
      alta('cantidad-negativa', form(1, '2026-01-31', [['a', '-1', '2000', '21']])),
      post('baja-cliente-1', '/clientes/1/baja'),
      alta('cliente-de-baja', form(1, '2026-01-31', [['a', '1', '10', '21']])),
      alta('recargo-cliente-4', form(4, '2026-02-15', [['harina', '8', '14,20', '4'], ['aceite', '1,41', '27.45', '4']]))
    ]);
  });

  it('RN-27: sin ninguna línea con descripción → 400 «La factura no tiene lineas» y no se consume número', function () {
    var p = paso(o, 'sin-lineas');
    assert.equal(p.status, 400);
    assert.equal(p.cuerpo, 'La factura no tiene lineas');
  });

  it('RN-27: cliente inexistente o ilegible → 400 «Cliente no valido»', function () {
    assert.deepEqual([paso(o, 'cliente-inexistente').status, paso(o, 'cliente-inexistente').cuerpo], [400, 'Cliente no valido']);
    assert.deepEqual([paso(o, 'cliente-texto').status, paso(o, 'cliente-texto').cuerpo], [400, 'Cliente no valido']);
  });

  it('RN-28/RN-29: se descarta la fila sin descripción y la coma decimal se sustituye una vez (12,34)', function () {
    var p = paso(o, 'comas-y-miles');
    assert.equal(p.status, 302);
    assert.equal(p.location, '/facturas/10');
    assert.deepEqual(lineas(o, 'FA-2026-000109').map(resumenLinea), [
      ['a', 1, 1.234, 21, 1.23, 0.26, 0],
      ['b', 0.5, 12.34, 10, 6.17, 0.62, 0]
    ]);
  });

  it('CONGELA comportamiento actual: A-06 / RN-29 «1.234,50» se lee como 1,234 (el importe cae 1.000 veces)', function () {
    // Anomalía A-06
    var f = fac(o, 'FA-2026-000109');
    assert.deepEqual(cabecera(f), ['2026-01-31', '2026-03-02', 7.4, 0.88, 0, 8.28, 'emitida', '']);
    assert.equal(lineas(o, 'FA-2026-000109')[0].precio, 1.234);
  });

  it('RN-30/RN-31: sin fecha se usa hoy (2026-11-11) y el vencimiento es +30; con cliente de 60 días, +60', function () {
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000110')).slice(0, 2), ['2026-11-11', '2026-12-11']);
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000116')).slice(0, 2), ['2026-01-31', '2026-04-01']);
  });

  it('RN-33: toda factura nace emitida, en serie FA, sin rectifica_a', function () {
    var f = fac(o, 'FA-2026-000110');
    assert.equal(f.estado, 'emitida');
    assert.equal(f.serie, 'FA');
    assert.equal(f.rectifica_a, null);
  });

  it('CONGELA comportamiento actual: A-44 / RN-30 una fecha ilegible se graba tal cual y el vencimiento es NaN-NaN-NaN', function () {
    // Anomalía A-44
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000111')).slice(0, 2), ['abc', 'NaN-NaN-NaN']);
  });

  it('CONGELA comportamiento actual: A-10 / RN-37 una factura con fecha de 2025 grabada en 2026 lleva número de 2026', function () {
    // Anomalía A-10
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000112')).slice(0, 2), ['2025-12-31', '2026-01-30']);
  });

  it('CONGELA comportamiento actual: A-45 / A-12 precio o IVA vacío → 500 al grabar la cabecera y el número queda consumido (hueco 113 y 114)', function () {
    // Anomalías A-45 y A-12
    var p1 = paso(o, 'precio-vacio');
    assert.equal(p1.status, 500);
    assert.match(p1.cuerpo, /^Error al grabar: SQLITE_CONSTRAINT: NOT NULL constraint failed: facturas\.base$/);
    var p2 = paso(o, 'iva-vacio');
    assert.equal(p2.status, 500);
    assert.match(p2.cuerpo, /^Error al grabar: SQLITE_CONSTRAINT: NOT NULL constraint failed: facturas\.iva$/);
    var numeros = o.facturas.map(function (f) { return f.numero; });
    assert.ok(numeros.indexOf('FA-2026-000113') < 0);
    assert.ok(numeros.indexOf('FA-2026-000114') < 0);
    assert.ok(numeros.indexOf('FA-2026-000115') >= 0);
  });

  it('CONGELA comportamiento actual: A-29 IVA 5 % a un cliente con recargo → recargo 0', function () {
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000115')), ['2026-01-31', '2026-03-02', 100, 5, 0, 105, 'emitida', '']);
  });

  it('RN-03 en alta manual: cliente 4 (recargo) — 8 × 14,20 y 1,41 × 27,45 al 4 % → base 152,30, IVA 6,09, recargo 0,76', function () {
    var f = o.facturas[o.facturas.length - 1];
    assert.equal(f.numero, 'FA-2026-000123');
    assert.deepEqual(cabecera(f), ['2026-02-15', '2026-03-17', 152.3, 6.09, 0.76, 159.15, 'emitida', '']);
    assert.deepEqual(lineas(o, 'FA-2026-000123').map(resumenLinea), [
      ['aceite', 1.41, 27.45, 4, 38.7, 1.55, 0.19],
      ['harina', 8, 14.2, 4, 113.6, 4.54, 0.57]
    ]);
  });

  it('RN-11: el descuento deja « Descuento volumen 2% aplicado» (con espacio inicial) en las observaciones; con obs, a continuación', function () {
    assert.equal(fac(o, 'FA-2026-000117').observaciones, ' Descuento volumen 2% aplicado');
    assert.equal(fac(o, 'FA-2026-000118').observaciones, 'Pedido X Descuento volumen 2% aplicado');
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000117')).slice(2, 6), [1960, 411.6, 0, 2371.6]);
    assert.equal(lineas(o, 'FA-2026-000117')[0].precio, 1960);
  });

  it('sin el campo obs, las observaciones se graban como cadena vacía (no NULL)', function () {
    assert.equal(fac(o, 'FA-2026-000119').observaciones, '');
  });

  it('una sola línea enviada como texto (no como lista) también se factura', function () {
    assert.deepEqual(lineas(o, 'FA-2026-000120').map(resumenLinea), [['solo', 2, 3, 21, 6, 1.26, 0]]);
  });

  it('CONGELA comportamiento actual: A-09 cantidad negativa → factura FA con total -2.420,00 sin descuento', function () {
    // Anomalía A-09
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000121')), ['2026-01-31', '2026-03-02', -2000, -420, 0, -2420, 'emitida', '']);
    assert.deepEqual(lineas(o, 'FA-2026-000121').map(resumenLinea), [['a', -1, 2000, 21, -2000, -420, 0]]);
  });

  it('CONGELA comportamiento actual: A-05 / contradicción 08 se puede facturar a un cliente dado de baja', function () {
    // Anomalía A-05
    assert.equal(paso(o, 'baja-cliente-1').status, 302);
    assert.equal(paso(o, 'cliente-de-baja').status, 302);
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000122')).slice(2, 6), [10, 2.1, 0, 12.1]);
  });

  it('el contador FA final es 123 y el de RE no se mueve (huecos incluidos)', function () {
    assert.deepEqual(o.contadores, [{ serie: 'FA', anyo: 2026, ultimo: 123 }, { serie: 'RE', anyo: 2026, ultimo: 1 }]);
  });
});

describe('POST /facturas/nueva: IVA fuera de tabla y recargo (A-29)', function () {
  it('CONGELA comportamiento actual: A-29 IVA 5 % con cliente con recargo → IVA 5,00 y recargo 0,00', function () {
    var o = ejecutar([alta('iva5', form(2, '2026-01-31', [['a', '1', '100', '5']]))]);
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000109')), ['2026-01-31', '2026-03-02', 100, 5, 0, 105, 'emitida', '']);
  });
});

describe('POST /facturas/nueva: un fallo en una línea (A-13)', function () {
  it('CONGELA comportamiento actual: A-13 si falla una línea la cabecera queda grabada, faltan líneas y la respuesta es 500', function () {
    // Anomalía A-13: se provoca el fallo con un disparador en la BD TEMPORAL (no hay otra forma determinista)
    var o = ejecutar([
      sql("CREATE TRIGGER lineas_fallo BEFORE INSERT ON lineas WHEN NEW.descripcion = 'falla' BEGIN SELECT RAISE(ABORT, 'fallo simulado'); END"),
      alta('con-fallo', form(1, '2026-01-31', [['ok', '1', '10', '21'], ['falla', '1', '20', '21'], ['ok2', '1', '30', '21']])),
      alta('siguiente', form(1, '2026-01-31', [['ok', '1', '10', '21']]))
    ]);
    var p = paso(o, 'con-fallo');
    assert.equal(p.status, 500);
    assert.equal(p.cuerpo, 'Error al grabar lineas: SQLITE_CONSTRAINT: fallo simulado');
    assert.deepEqual(cabecera(fac(o, 'FA-2026-000109')).slice(2, 6), [60, 12.6, 0, 72.6]);
    assert.deepEqual(lineas(o, 'FA-2026-000109').map(function (l) { return l.descripcion; }), ['ok', 'ok2']);
    assert.equal(paso(o, 'siguiente').location, '/facturas/11');
  });
});

describe('POST /facturas/:id/cobrar (RN-42, A-08)', function () {
  var o;
  before(function () {
    o = ejecutar([
      post('cobrar-105', '/facturas/5/cobrar'),
      post('cobrar-105-otra-vez', '/facturas/5/cobrar'),
      post('cobrar-RE', '/facturas/7/cobrar'),
      post('cobrar-rectificada', '/facturas/6/cobrar'),
      post('cobrar-cobrada', '/facturas/1/cobrar'),
      post('cobrar-inexistente', '/facturas/9999/cobrar')
    ]);
  });
  function estado(numero) { return fac(o, numero).estado; }

  it('RN-42: una emitida pasa a cobrada y se redirige al detalle', function () {
    assert.deepEqual([paso(o, 'cobrar-105').status, paso(o, 'cobrar-105').location], [302, '/facturas/5']);
    assert.equal(estado('FA-2026-000105'), 'cobrada');
  });

  it('RN-42: cobrar de nuevo, o cobrar una rectificada o ya cobrada, no cambia nada y redirige igualmente', function () {
    assert.deepEqual([paso(o, 'cobrar-105-otra-vez').status, paso(o, 'cobrar-105-otra-vez').location], [302, '/facturas/5']);
    assert.equal(paso(o, 'cobrar-rectificada').status, 302);
    assert.equal(estado('FA-2026-000106'), 'rectificada');
    assert.equal(paso(o, 'cobrar-cobrada').status, 302);
    assert.equal(estado('FA-2026-000101'), 'cobrada');
  });

  it('RN-42: una factura inexistente también redirige con éxito (302) y no se crea nada', function () {
    assert.deepEqual([paso(o, 'cobrar-inexistente').status, paso(o, 'cobrar-inexistente').location], [302, '/facturas/9999']);
    assert.equal(o.facturas.length, 9);
  });

  it('CONGELA comportamiento actual: A-08 / contradicción 09 por petición directa se puede cobrar una rectificativa (RE)', function () {
    // Anomalía A-08: la pantalla solo ofrece «Marcar cobrada» a las FA emitidas
    assert.equal(estado('RE-2026-000001'), 'cobrada');
  });
});

describe('POST /facturas/:id/rectificar (RN-43..RN-45, A-08, A-16, A-21)', function () {
  var o;
  before(function () {
    o = ejecutar([
      post('rectificar-101-cobrada', '/facturas/1/rectificar', { motivo: 'prueba' }),
      post('rectificar-101-otra-vez', '/facturas/1/rectificar', { motivo: 'x' }),
      post('rectificar-RE', '/facturas/7/rectificar'),
      post('rectificar-inexistente', '/facturas/9999/rectificar'),
      post('rectificar-105-sin-motivo', '/facturas/5/rectificar')
    ]);
  });

  it('RN-43: la RE copia la cabecera cambiada de signo, con el motivo en observaciones y serie RE', function () {
    var p = paso(o, 'rectificar-101-cobrada');
    assert.deepEqual([p.status, p.location], [302, '/facturas/10']);
    var re = fac(o, 'RE-2026-000002');
    assert.equal(re.serie, 'RE');
    assert.equal(re.rectifica_a, 'FA-2026-000101');
    assert.equal(re.cliente_id, 1);
    assert.deepEqual(cabecera(re), ['2026-11-11', null, -133.2, -27.97, 0, -161.17, 'emitida', 'Rectifica FA-2026-000101. prueba']);
  });

  it('RN-43: las líneas se copian con la cantidad y los importes en negativo y el precio unitario positivo', function () {
    assert.deepEqual(lineas(o, 'RE-2026-000002').map(resumenLinea), [
      ['Rectificación: Alquiler máquina de café Futurmat F3 (enero)', -1, 90, 21, -90, -18.9, 0],
      ['Rectificación: Azúcar blanquilla 10kg', -1, 9.8, 10, -9.8, -0.98, 0],
      ['Rectificación: Café en grano natural 1kg', -2, 11.95, 10, -23.9, -2.39, 0],
      ['Rectificación: Vaso caña 20cl (caja 72)', -0.44, 21.6, 21, -9.5, -2, 0]
    ]);
  });

  it('CONGELA comportamiento actual: A-21 la RE es el espejo exacto de lo grabado, también de la discrepancia cabecera/líneas de FA-2026-000101', function () {
    // Anomalía A-21: IVA de cabecera -27,97 pero las líneas suman -24,27
    var re = fac(o, 'RE-2026-000002');
    var sumaIvaLineas = lineas(o, 'RE-2026-000002').reduce(function (a, l) { return a + l.cuota_iva; }, 0);
    assert.equal(re.iva, -27.97);
    assert.equal(Math.round(sumaIvaLineas * 100) / 100, -24.27);
  });

  it('CONGELA comportamiento actual: A-08 se puede rectificar una factura ya cobrada; la original pasa a rectificada', function () {
    // Anomalía A-08 / RN-44
    assert.equal(fac(o, 'FA-2026-000101').estado, 'rectificada');
  });

  it('CONGELA comportamiento actual: A-16 / RN-45 la RE lleva la fecha de HOY (no la de la original) y no lleva vencimiento', function () {
    // Anomalía A-16
    var re = fac(o, 'RE-2026-000002');
    assert.equal(re.fecha, '2026-11-11');
    assert.equal(re.vencimiento, null);
    assert.notEqual(re.fecha, fac(o, 'FA-2026-000101').fecha);
  });

  it('RN-44: rectificar una ya rectificada → 400; rectificar una RE → 400; inexistente → 404', function () {
    var a = paso(o, 'rectificar-101-otra-vez');
    assert.deepEqual([a.status, a.cuerpo], [400, 'Ya esta rectificada']);
    var b = paso(o, 'rectificar-RE');
    assert.deepEqual([b.status, b.cuerpo], [400, 'No se rectifica una rectificativa']);
    var c = paso(o, 'rectificar-inexistente');
    assert.deepEqual([c.status, c.cuerpo], [404, 'Factura no encontrada']);
  });

  it('RN-45: sin motivo la observación acaba en «. » (con espacio final)', function () {
    assert.equal(fac(o, 'RE-2026-000003').observaciones, 'Rectifica FA-2026-000105. ');
    assert.deepEqual(cabecera(fac(o, 'RE-2026-000003')).slice(2, 6), [-2287.75, -468.63, 0, -2756.38]);
  });

  it('A-21: la RE de FA-2026-000105 copia sus 5 líneas con signo cambiado, sin recalcular (suma -2.335,50 frente a la cabecera -2.287,75)', function () {
    var ls = lineas(o, 'RE-2026-000003');
    assert.equal(ls.length, 5);
    assert.equal(Math.round(ls.reduce(function (a, l) { return a + l.base; }, 0) * 100) / 100, -2335.5);
  });

  it('los contadores: RE 3 (dos rectificativas nuevas) y FA sin tocar', function () {
    assert.deepEqual(o.contadores, [{ serie: 'FA', anyo: 2026, ultimo: 108 }, { serie: 'RE', anyo: 2026, ultimo: 3 }]);
  });
});

describe('POST /facturas/:id/rectificar: factura sin líneas (A-14)', function () {
  it('CONGELA comportamiento actual: A-14 la petición no recibe respuesta, se crea la RE vacía y la original sigue «emitida»', function () {
    // Anomalía A-14 / O6 / D-15
    var o = ejecutar([
      sql("INSERT INTO facturas (numero,serie,cliente_id,fecha,base,iva,recargo,total,estado) VALUES ('FA-2026-009999','FA',1,'2026-06-01',10,2.1,0,12.1,'emitida')"),
      post('rectificar-sin-lineas', '/facturas/10/rectificar', { motivo: 'm' })
    ]);
    assert.equal(paso(o, 'rectificar-sin-lineas').sinRespuesta, true);
    assert.equal(fac(o, 'FA-2026-009999').estado, 'emitida');
    assert.deepEqual(cabecera(fac(o, 'RE-2026-000002')).slice(2, 6), [-10, -2.1, 0, -12.1]);
    assert.deepEqual(lineas(o, 'RE-2026-000002'), []);
  });
});

describe('GET /facturas y GET /facturas/:id (factura_detalle, A-15, A-33)', function () {
  var o;
  before(function () {
    o = ejecutar([
      get('detalle-102', '/facturas/2'),
      get('detalle-RE', '/facturas/7'),
      get('detalle-inexistente', '/facturas/999'),
      get('listado-emitidas', '/facturas?estado=emitida'),
      get('listado-todas', '/facturas'),
      sql("UPDATE clientes SET nombre = 'RENOMBRADO SL', nif = 'Z99999999' WHERE id = 2"),
      get('detalle-102-tras-renombrar', '/facturas/2')
    ]);
  });

  it('la factura impresa FA-2026-000102 (datos de empresa de config, cliente, líneas, totales)', function () {
    assert.equal(norm(paso(o, 'detalle-102').cuerpo),
      '<div class="factura-impresa"><table style="width:100%"><tr><td><strong>Suministros Hidalgo, S.L.</strong><br> B45812390<br>Pol. Ind. La Vega, nave 7<br> 45200 Illescas (Toledo)<br>925 511 XXX </td><td style="text-align:right"><h2>FACTURA FA-2026-000102</h2> Fecha: 06/02/2026<br> Vencimiento: 08/03/2026<br> Estado: cobrada </td></tr></table><p><strong>Cliente:</strong> Ferretería El Tornillo &middot; 03488812K<br> C/ Mayor 4 &middot; 45220 Yeles <br><em>Cliente en r&eacute;gimen de recargo de equivalencia</em></p><table class="tabla-datos"><tr><th>Descripci&oacute;n</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Base</th><th>IVA</th><th class="num">Cuota IVA</th><th class="num">Rec. eq.</th></tr><tr><td>Desengrasante cocinas 10L</td><td class="num">4</td><td class="num">18,50</td><td class="num">74,00</td><td>21%</td><td class="num">15,54</td><td class="num">3,85</td></tr><tr><td>Plato llano hostelería 25cm (caja 12)</td><td class="num">1</td><td class="num">28,90</td><td class="num">28,90</td><td>21%</td><td class="num">6,07</td><td class="num">1,50</td></tr><tr><td>Vaso caña 20cl (caja 72)</td><td class="num">0.5</td><td class="num">21,60</td><td class="num">10,80</td><td>21%</td><td class="num">2,27</td><td class="num">0,56</td></tr><tr><td>Portes y manipulación</td><td class="num">0.32</td><td class="num">6,00</td><td class="num">1,90</td><td>21%</td><td class="num">0,40</td><td class="num">0,10</td></tr></table><table class="totales"><tr><td>Base imponible</td><td class="num">115,60 &euro;</td></tr><tr><td>IVA</td><td class="num">24,28 &euro;</td></tr><tr><td>Recargo equivalencia</td><td class="num">6,01 &euro;</td></tr><tr class="total"><td>TOTAL</td><td class="num">145,89 &euro;</td></tr></table><p class="nota">Insc. R.M. de Toledo, Tomo 1.482, Folio 90, Hoja TO-28.315</p></div><p class="no-imprimir"><button onclick="window.print()">Imprimir / PDF</button></p></div>');
  });

  it('la rectificativa impresa RE-2026-000001 (sin vencimiento, «Rectifica a», cantidades con punto y sin recargo)', function () {
    assert.equal(norm(paso(o, 'detalle-RE').cuerpo),
      '<div class="factura-impresa"><table style="width:100%"><tr><td><strong>Suministros Hidalgo, S.L.</strong><br> B45812390<br>Pol. Ind. La Vega, nave 7<br> 45200 Illescas (Toledo)<br>925 511 XXX </td><td style="text-align:right"><h2>FACTURA RE-2026-000001</h2> Fecha: 06/05/2026<br><strong>Rectifica a: FA-2026-000106</strong><br> Estado: emitida </td></tr></table><p><strong>Cliente:</strong> Bar Nuevo Siglo &middot; 70355910k<br> C/ Real 31 &middot; 45200 Illescas </p><table class="tabla-datos"><tr><th>Descripci&oacute;n</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Base</th><th>IVA</th><th class="num">Cuota IVA</th><th class="num">Rec. eq.</th></tr><tr><td>Rectificación: Alquiler máquina de café Futurmat F3 (abril)</td><td class="num">-1</td><td class="num">90,00</td><td class="num">-90,00</td><td>21%</td><td class="num">-18,90</td><td class="num"></td></tr><tr><td>Rectificación: Café en grano natural 1kg</td><td class="num">-0.97</td><td class="num">11,95</td><td class="num">-11,61</td><td>10%</td><td class="num">-1,16</td><td class="num"></td></tr></table><table class="totales"><tr><td>Base imponible</td><td class="num">-101,61 &euro;</td></tr><tr><td>IVA</td><td class="num">-20,62 &euro;</td></tr><tr class="total"><td>TOTAL</td><td class="num">-122,23 &euro;</td></tr></table><p class="nota">Rectifica FA-2026-000106 (cuota abril duplicada)</p><p class="nota">Insc. R.M. de Toledo, Tomo 1.482, Folio 90, Hoja TO-28.315</p></div><p class="no-imprimir"><button onclick="window.print()">Imprimir / PDF</button></p></div>');
  });

  it('factura inexistente → 404 «Factura no encontrada»', function () {
    var p = paso(o, 'detalle-inexistente');
    assert.deepEqual([p.status, p.cuerpo], [404, 'Factura no encontrada']);
  });

  it('CONGELA comportamiento actual: A-15 una factura emitida se reimprime con el nombre y el NIF ACTUALES del cliente', function () {
    // Anomalía A-15
    var html = paso(o, 'detalle-102-tras-renombrar').cuerpo;
    assert.ok(html.indexOf('RENOMBRADO SL &middot; Z99999999') >= 0);
    assert.ok(html.indexOf('Ferretería El Tornillo') < 0);
  });

  it('contradicción 07: el filtro «emitidas» del listado devuelve 4 facturas (3 FA y la RE), de más reciente a más antigua', function () {
    var filas = paso(o, 'listado-emitidas').cuerpo.match(/<a href="\/facturas\/\d+">[^<]+<\/a>/g).map(function (a) { return a.replace(/<[^>]+>/g, ''); });
    assert.deepEqual(filas, ['FA-2026-000108', 'FA-2026-000107', 'RE-2026-000001', 'FA-2026-000105']);
  });

  it('el listado sin filtro muestra las 9 facturas ordenadas por fecha y id descendentes', function () {
    var filas = paso(o, 'listado-todas').cuerpo.match(/<a href="\/facturas\/\d+">[^<]+<\/a>/g).map(function (a) { return a.replace(/<[^>]+>/g, ''); });
    assert.deepEqual(filas, [
      'FA-2026-000108', 'FA-2026-000107', 'RE-2026-000001', 'FA-2026-000106', 'FA-2026-000105',
      'FA-2026-000104', 'FA-2026-000103', 'FA-2026-000102', 'FA-2026-000101'
    ]);
  });
});

describe('GET /informes/iva y /informes/export-gestoria (RN-46..RN-50, A-01, A-40..A-43, A-54)', function () {
  var o;
  before(function () {
    o = ejecutar([
      get('iva-T1', '/informes/iva?anyo=2026&trimestre=1'),
      get('iva-T2', '/informes/iva?anyo=2026&trimestre=2'),
      get('iva-2025', '/informes/iva?anyo=2025&trimestre=4'),
      get('iva-T5', '/informes/iva?anyo=2026&trimestre=5'),
      get('iva-T0', '/informes/iva?anyo=2026&trimestre=0'),
      get('iva-Tabc', '/informes/iva?anyo=2026&trimestre=abc'),
      get('iva-sin-parametros', '/informes/iva'),
      get('csv-2026', '/informes/export-gestoria?anyo=2026'),
      get('csv-sin-anyo', '/informes/export-gestoria'),
      get('csv-2025', '/informes/export-gestoria?anyo=2025')
    ]);
  });

  it('RN-46: IVA del T1 de 2026 por LÍNEAS — 21 %: 2.533,30 / 532,00 · 10 %: 392,20 / 39,22 · 4 %: 811,10 / 32,44 · total 3.736,60 / 603,66', function () {
    assert.deepEqual(filasIva(paso(o, 'iva-T1').cuerpo), [
      ['21%', '2.533,30', '532,00', '6,01'],
      ['10%', '392,20', '39,22', '0,00'],
      ['4%', '811,10', '32,44', '0,76'],
      ['TOTAL', '3.736,60', '603,66', '6,77']
    ]);
  });

  it('RN-47: el T2 incluye las facturas de abril, mayo y la rectificativa (original y RE se compensan solo dentro del mismo trimestre)', function () {
    assert.deepEqual(filasIva(paso(o, 'iva-T2').cuerpo), [
      ['21%', '194,15', '40,77', '0,00'],
      ['10%', '35,51', '3,55', '0,00'],
      ['TOTAL', '229,66', '44,32', '0,00']
    ]);
  });

  it('año sin facturas: tabla con solo la fila TOTAL a 0,00', function () {
    assert.deepEqual(filasIva(paso(o, 'iva-2025').cuerpo), [['TOTAL', '0,00', '0,00', '0,00']]);
  });

  it('RN-48: trimestre 0 o ilegible → se usa el 1; sin parámetros → T1 del año actual (2026 con el reloj fijo)', function () {
    var t1 = filasIva(paso(o, 'iva-T1').cuerpo);
    assert.deepEqual(filasIva(paso(o, 'iva-T0').cuerpo), t1);
    assert.deepEqual(filasIva(paso(o, 'iva-Tabc').cuerpo), t1);
    assert.deepEqual(filasIva(paso(o, 'iva-sin-parametros').cuerpo), t1);
  });

  it('CONGELA comportamiento actual: A-42 / A-54 trimestre=5 → 500 con la traza del error en la respuesta', function () {
    // Anomalías A-42 y A-54 (el mensaje exacto de V8 puede variar entre versiones de Node: se comprueba el tipo)
    var p = paso(o, 'iva-T5');
    assert.equal(p.status, 500);
    assert.match(p.cuerpo, /TypeError/);
    assert.match(p.cuerpo, /routes\/informes\.js:18/);
  });

  it('RN-49: cabeceras de respuesta del CSV', function () {
    var p = paso(o, 'csv-2026');
    assert.equal(p.status, 200);
    assert.equal(p.contentType, 'text/csv; charset=utf-8');
    assert.equal(p.contentDisposition, 'attachment; filename="facturas_2026.csv"');
  });

  it('CONGELA comportamiento actual: A-40 / RN-49 formato exacto del CSV de la gestoría (clave, cabeceras, ; , CRLF, importes de cabecera, orden por texto)', function () {
    // Anomalía A-40. La clave se lee de config porque config.js se copia a mano a la oficina.
    assert.equal(paso(o, 'csv-2026').cuerpo, [
      'CLAVE;' + config.CLAVE_EXPORT_GESTORIA,
      'NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO',
      'FA-2026-000101;31/01/2026;Cafetería La Parada, S.C.;J45771102;133,20;27,97;0,00;161,17;cobrada',
      'FA-2026-000102;06/02/2026;Ferretería El Tornillo;03488812K;115,60;24,28;6,01;145,89;cobrada',
      'FA-2026-000103;20/02/2026;Hotel Vega Baja, S.A.;A45102939;1.000,00;210,00;0,00;1.210,00;cobrada',
      'FA-2026-000104;05/03/2026;Panadería Hnos. Cifuentes;E45332218;152,30;6,09;0,76;159,15;cobrada',
      'FA-2026-000105;31/03/2026;Restaurante Casa Ubaldo, S.L.;B45610021;2.287,75;468,63;0,00;2.756,38;emitida',
      'FA-2026-000106;30/04/2026;Bar Nuevo Siglo;70355910k;101,61;20,62;0,00;122,23;rectificada',
      'FA-2026-000107;06/05/2026;Bar Nuevo Siglo;70355910k;101,61;20,62;0,00;122,23;emitida',
      'FA-2026-000108;31/05/2026;Cafetería La Parada, S.C.;J45771102;128,05;26,19;0,00;154,24;emitida',
      'RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida'
    ].join('\r\n'));
  });

  it('RN-49: sin año se usa el actual; un año sin facturas solo lleva las dos líneas de cabecera', function () {
    assert.equal(paso(o, 'csv-sin-anyo').cuerpo, paso(o, 'csv-2026').cuerpo);
    assert.equal(paso(o, 'csv-2025').cuerpo, 'CLAVE;' + config.CLAVE_EXPORT_GESTORIA + '\r\nNUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO');
  });

  it('CONGELA comportamiento actual: A-01 / RN-50 el IVA del T1 por LÍNEAS (603,66) y por CABECERAS del CSV (736,97) no coinciden', function () {
    // Anomalía A-01 / contradicción 06
    var filas = paso(o, 'csv-2026').cuerpo.split('\r\n').slice(2).map(function (l) { return l.split(';'); });
    var t1 = filas.filter(function (c) { var m = c[1].split('/')[1]; return c[1].split('/')[2] === '2026' && ['01', '02', '03'].indexOf(m) >= 0; });
    var sumaIva = Math.round(t1.reduce(function (a, c) { return a + parseFloat(c[5].replace(',', '.')); }, 0) * 100) / 100;
    var sumaBase = Math.round(t1.reduce(function (a, c) { return a + parseFloat(c[4].replace('.', '').replace(',', '.')); }, 0) * 100) / 100;
    assert.equal(sumaIva, 736.97);
    assert.equal(sumaBase, 3688.85);
    assert.equal(filasIva(paso(o, 'iva-T1').cuerpo)[3][2], '603,66');
  });
});

describe('informes: casos límite de fechas y nombres (A-41, A-43)', function () {
  it('CONGELA comportamiento actual: A-43 el T1 llega hasta «2026-03-31» comparando texto; el día 31 de abril o junio (inexistente) entra en su trimestre', function () {
    // Anomalía A-43: se insertan facturas y líneas de 1 € en la BD temporal con fechas de frontera
    var fechas = ['2026-03-31', '2026-04-01', '2026-03-32', '2026-06-30', '2026-06-31', '2026-07-01', '2026-12-31', '2025-12-31', '2027-01-01'];
    var pasos = [];
    fechas.forEach(function (f, i) {
      var num = 'X-' + i;
      pasos.push(sql("INSERT INTO facturas (numero,serie,cliente_id,fecha,base,iva,recargo,total,estado) VALUES ('" + num + "','FA',1," + "'" + f + "',1,0.21,0,1.21,'emitida')"));
      pasos.push(sql("INSERT INTO lineas (factura_id,descripcion,cantidad,precio,tipo_iva,base,cuota_iva,cuota_recargo) VALUES ((SELECT id FROM facturas WHERE numero='" + num + "'),'l',1,1,7,1,0.07,0)"));
    });
    ['1', '2', '3', '4'].forEach(function (t) { pasos.push(get('T' + t, '/informes/iva?anyo=2026&trimestre=' + t)); });
    var o = ejecutar(pasos);
    function tipo7(t) { var f = filasIva(paso(o, 'T' + t).cuerpo).filter(function (c) { return c[0] === '7%'; })[0]; return f ? f[1] : null; }
    // base de 1 € por factura: T1 = 03-31 ; T2 = 04-01, 06-30, 06-31 ; T3 = 07-01 ; T4 = 12-31 ; 03-32 no entra en ninguno
    assert.deepEqual([tipo7(1), tipo7(2), tipo7(3), tipo7(4)], ['1,00', '3,00', '1,00', '1,00']);
  });

  it('CONGELA comportamiento actual: A-41 un «;» o un salto de línea en el nombre del cliente desplaza las columnas del CSV', function () {
    // Anomalía A-41
    var o = ejecutar([
      sql("UPDATE clientes SET nombre = 'Bar; \"Nuevo\"' || char(10) || 'Siglo' WHERE id = 6"),
      get('csv', '/informes/export-gestoria?anyo=2026')
    ]);
    var lineas106 = paso(o, 'csv').cuerpo.split('\r\n').filter(function (l) { return l.indexOf('FA-2026-000106') === 0; });
    assert.deepEqual(lineas106, ['FA-2026-000106;30/04/2026;Bar; "Nuevo"\nSiglo;70355910k;101,61;20,62;0,00;122,23;rectificada']);
    assert.equal(lineas106[0].split(';').length, 10);
  });
});

describe('POST /contratos/:id/baja, /contratos/nuevo (RN-18, A-06, A-23, A-30, A-52, A-53)', function () {
  var o;
  before(function () {
    o = ejecutar([
      post('baja-c2-15-mar', '/contratos/2/baja', { fecha_baja: '2026-03-15' }),
      post('baja-c4-20-feb', '/contratos/4/baja', { fecha_baja: '2026-02-20' }),
      post('baja-c1-hoy', '/contratos/1/baja'),
      post('baja-inexistente', '/contratos/99/baja'),
      post('nuevo-miles', '/contratos/nuevo', { cliente_id: '1', concepto: 'X', cuota: '1.210,00', tipo_iva: '', fecha_alta: '' }),
      post('nuevo-cuota-vacia', '/contratos/nuevo', { cliente_id: '1', concepto: 'Y', cuota: '' }),
      post('nuevo-sin-concepto', '/contratos/nuevo', { cliente_id: '1', cuota: '5' }),
      post('nuevo-cliente-inexistente', '/contratos/nuevo', { cliente_id: '99', concepto: 'Z', cuota: '5' })
    ]);
  });

  it('RN-18: baja el 15-mar-2026 de 145 € → el importe se muestra en la URL: 72.50 (30 días fijos)', function () {
    var p = paso(o, 'baja-c2-15-mar');
    assert.deepEqual([p.status, p.location], [302, '/contratos?prorrateo=72.50']);
  });

  it('CONGELA comportamiento actual: A-30 / A-23 la pantalla de baja prorratea siempre desde el día 1: alta 15 y baja 20 de febrero → 60.00 (la remesa daría 19,29)', function () {
    assert.equal(paso(o, 'baja-c4-20-feb').location, '/contratos?prorrateo=60.00');
  });

  it('sin fecha de baja se usa hoy (2026-11-11): 11/30 de 90 = 33.00; un contrato inexistente → 404', function () {
    assert.equal(paso(o, 'baja-c1-hoy').location, '/contratos?prorrateo=33.00');
    var p = paso(o, 'baja-inexistente');
    assert.deepEqual([p.status, p.cuerpo], [404, 'Contrato no encontrado']);
  });

  it('CONGELA comportamiento actual: A-06 la cuota «1.210,00» de un contrato nuevo se graba como 1,21, con IVA 21 y alta hoy por defecto', function () {
    assert.equal(paso(o, 'nuevo-miles').location, '/contratos');
    // se comprueba en la BD temporal con una segunda ejecución encadenada más abajo (ver test siguiente)
  });

  it('CONGELA comportamiento actual: A-53 cuota vacía o falta de concepto → 500 por NOT NULL; un cliente inexistente SÍ se acepta (A-52)', function () {
    var a = paso(o, 'nuevo-cuota-vacia');
    assert.equal(a.status, 500);
    assert.match(a.cuerpo, /^Error BD: SQLITE_CONSTRAINT: NOT NULL constraint failed: contratos\.cuota$/);
    var b = paso(o, 'nuevo-sin-concepto');
    assert.equal(b.status, 500);
    assert.match(b.cuerpo, /contratos\.concepto$/);
    assert.deepEqual([paso(o, 'nuevo-cliente-inexistente').status, paso(o, 'nuevo-cliente-inexistente').location], [302, '/contratos']);
  });

  it('estado final de la BD temporal: fechas de baja grabadas y contratos nuevos', async function () {
    var dir = sandbox.prepararBd(sandbox.crearCarpeta());
    var r = sandbox.lanzar({ dir: dir, script: ESCENARIO, input: JSON.stringify([
      post('baja', '/contratos/2/baja', { fecha_baja: '2026-03-15' }),
      post('nuevo', '/contratos/nuevo', { cliente_id: '1', concepto: 'X', cuota: '1.210,00', tipo_iva: '', fecha_alta: '' }),
      post('nuevo-99', '/contratos/nuevo', { cliente_id: '99', concepto: 'Z', cuota: '5' })
    ]) });
    assert.equal(r.status, 0, r.stderr);
    var contratos = await sandbox.consultar(dir, 'SELECT id, cliente_id, concepto, cuota, tipo_iva, fecha_alta, fecha_baja FROM contratos WHERE id = 2 OR id > 4 ORDER BY id');
    sandbox.borrarCarpeta(dir);
    assert.deepEqual(contratos, [
      { id: 2, cliente_id: 3, concepto: 'Mantenimiento cámaras frigoríficas', cuota: 145, tipo_iva: 21, fecha_alta: '2023-01-15', fecha_baja: '2026-03-15' },
      { id: 5, cliente_id: 1, concepto: 'X', cuota: 1.21, tipo_iva: 21, fecha_alta: '2026-11-11', fecha_baja: null },
      { id: 6, cliente_id: 99, concepto: 'Z', cuota: 5, tipo_iva: 21, fecha_alta: '2026-11-11', fecha_baja: null }
    ]);
  });
});

describe('POST /clientes/nuevo y /articulos/nuevo (RN-55, A-22, A-38, A-53)', function () {
  it('CONGELA comportamiento actual: A-22 un NIF de 9 caracteres cualquiera se acepta; uno de 8 se rechaza con aviso; el nombre es obligatorio', async function () {
    var dir = sandbox.prepararBd(sandbox.crearCarpeta());
    var r = sandbox.lanzar({ dir: dir, script: ESCENARIO, input: JSON.stringify([
      post('sin-nombre', '/clientes/nuevo', { nombre: '', nif: 'B12345678' }),
      post('nif-corto', '/clientes/nuevo', { nombre: 'Z', nif: 'B-1234567' }),
      post('nif-ABC', '/clientes/nuevo', { nombre: 'Z2', nif: 'ABCDEFGHI', recargo_equivalencia: 'on', dias_pago: '45' }),
      post('sin-nif', '/clientes/nuevo', { nombre: 'Z3' }),
      post('articulo', '/articulos/nuevo', { referencia: '', nombre: 'Prueba', precio: '9,5', tipo_iva: '', unidad: '' }),
      post('articulo-sin-nombre', '/articulos/nuevo', { precio: '1' })
    ]) });
    assert.equal(r.status, 0, r.stderr);
    var o = sandbox.resultadoJson(r.stdout);
    assert.deepEqual([paso(o, 'sin-nombre').status, paso(o, 'sin-nombre').location], [302, '/clientes?aviso=Falta%20el%20nombre']);
    assert.deepEqual([paso(o, 'nif-corto').status, paso(o, 'nif-corto').location], [302, '/clientes?aviso=El%20NIF%20no%20parece%20valido']);
    assert.equal(paso(o, 'nif-ABC').location, '/clientes');
    assert.equal(paso(o, 'sin-nif').location, '/clientes');
    var clientes = await sandbox.consultar(dir, 'SELECT id, nombre, nif, recargo_equivalencia, dias_pago, activo FROM clientes WHERE id > 6 ORDER BY id');
    var articulos = await sandbox.consultar(dir, 'SELECT referencia, nombre, precio, tipo_iva, unidad FROM articulos WHERE id > 8');
    sandbox.borrarCarpeta(dir);
    assert.deepEqual(clientes, [
      { id: 7, nombre: 'Z2', nif: 'ABCDEFGHI', recargo_equivalencia: 1, dias_pago: 45, activo: 1 },
      { id: 8, nombre: 'Z3', nif: null, recargo_equivalencia: 0, dias_pago: null, activo: 1 }
    ]);
    // A-38: el IVA por defecto del artículo (21) sale de config.IVA_DEFECTO; precio con coma → 9,5; unidad por defecto «ud»
    assert.deepEqual(articulos, [{ referencia: '', nombre: 'Prueba', precio: 9.5, tipo_iva: 21, unidad: 'ud' }]);
    var sinNombre = paso(o, 'articulo-sin-nombre');
    assert.equal(sinNombre.status, 500);
    assert.match(sinNombre.cuerpo, /^Error BD: SQLITE_CONSTRAINT: NOT NULL constraint failed: articulos\.nombre$/);
  });

  it('la baja de un cliente es lógica: activo = 0 y no toca sus contratos ni sus facturas (contradicción 08)', async function () {
    var dir = sandbox.prepararBd(sandbox.crearCarpeta());
    var r = sandbox.lanzar({ dir: dir, script: ESCENARIO, input: JSON.stringify([post('baja', '/clientes/1/baja')]) });
    assert.equal(r.status, 0, r.stderr);
    var cliente = await sandbox.consultar(dir, 'SELECT activo FROM clientes WHERE id = 1');
    var contratos = await sandbox.consultar(dir, 'SELECT COUNT(*) AS n FROM contratos WHERE cliente_id = 1 AND fecha_baja IS NULL');
    var facturas = await sandbox.consultar(dir, 'SELECT COUNT(*) AS n FROM facturas WHERE cliente_id = 1');
    sandbox.borrarCarpeta(dir);
    assert.equal(cliente[0].activo, 0);
    assert.equal(contratos[0].n, 1);
    assert.equal(facturas[0].n, 2);
  });
});

describe('contradicción 08 y 09: lo que ofrece la pantalla frente a lo que acepta el servidor', function () {
  it('CONGELA comportamiento actual: A-05 / contradicción 08 el desplegable de nueva factura solo ofrece clientes activos, pero el servidor acepta uno de baja', function () {
    var o = ejecutar([
      get('antes', '/facturas/nueva'),
      post('baja', '/clientes/1/baja'),
      get('despues', '/facturas/nueva'),
      alta('facturar-al-de-baja', form(1, '2026-01-31', [['a', '1', '10', '21']]))
    ]);
    function clientes(html) { return (html.match(/<option value="\d+">[^<]*<\/option>/g) || []).map(function (x) { return x.replace(/<[^>]+>/g, ''); }).slice(0, 6); }
    assert.ok(clientes(paso(o, 'antes').cuerpo).indexOf('Cafetería La Parada, S.C.') >= 0);
    assert.ok(clientes(paso(o, 'despues').cuerpo).indexOf('Cafetería La Parada, S.C.') < 0);
    assert.equal(paso(o, 'facturar-al-de-baja').status, 302);
  });

  it('CONGELA comportamiento actual: A-08 / contradicción 09 la pantalla solo ofrece cobrar y rectificar a las FA emitidas', function () {
    var o = ejecutar([get('FA-emitida', '/facturas/5'), get('RE-emitida', '/facturas/7'), get('FA-cobrada', '/facturas/1'), get('FA-rectificada', '/facturas/6')]);
    function botones(n) { var h = paso(o, n).cuerpo; return [h.indexOf('Marcar cobrada') >= 0, h.indexOf('Rectificar (abono total)') >= 0]; }
    assert.deepEqual(botones('FA-emitida'), [true, true]);
    assert.deepEqual(botones('RE-emitida'), [false, false]);
    assert.deepEqual(botones('FA-cobrada'), [false, false]);
    assert.deepEqual(botones('FA-rectificada'), [false, false]);
  });
});

describe('panel de inicio de server.js (A-33, A-46, A-17)', function () {
  function panel(sentencias, opciones) {
    var r = sandbox.lanzar({ script: PANEL, input: JSON.stringify({ sql: sentencias || [] }), conVistas: !(opciones && opciones.sinVistas) });
    sandbox.borrarCarpeta(r.dir);
    return r;
  }

  it('CONGELA comportamiento actual: A-33 / contradicción 07 el panel muestra 9 emitidas (histórico), 4 pendientes, 3032.85 € y 6 clientes activos', function () {
    var r = panel();
    assert.equal(r.status, 0, r.stderr);
    var p = sandbox.resultadoJson(r.stdout);
    assert.equal(p.status, 200);
    assert.deepEqual(filasPanel(p.html), [
      ['Facturas emitidas (total histórico)', '9'],
      ['Facturas pendientes de cobro', '4'],
      ['Importe pendiente de cobro', '3032.85 €'],
      ['Clientes activos', '6']
    ]);
  });

  it('CONGELA comportamiento actual: A-33 las pendientes cuentan la RE (4) pero el importe solo suma las FA (3.032,85, sin restar los -122,23)', function () {
    var p = sandbox.resultadoJson(panel(["UPDATE clientes SET activo = 0 WHERE id IN (1, 2)"]).stdout);
    assert.deepEqual(filasPanel(p.html)[3], ['Clientes activos', '4']);
    assert.deepEqual(filasPanel(p.html)[2], ['Importe pendiente de cobro', '3032.85 €']);
  });

  it('con una factura nueva emitida de 100,00 € el importe pendiente pasa a 3132.85 y las pendientes a 5', function () {
    var p = sandbox.resultadoJson(panel(["INSERT INTO facturas (numero,serie,cliente_id,fecha,base,iva,recargo,total,estado) VALUES ('FA-2026-000109','FA',1,'2026-06-01',82.64,17.36,0,100,'emitida')"]).stdout);
    assert.deepEqual(filasPanel(p.html).slice(0, 3), [
      ['Facturas emitidas (total histórico)', '10'],
      ['Facturas pendientes de cobro', '5'],
      ['Importe pendiente de cobro', '3132.85 €']
    ]);
  });

  it('CONGELA comportamiento actual: A-46 el servidor escucha en todas las interfaces (sin host) y pide el puerto de config', function () {
    var p = sandbox.resultadoJson(panel().stdout);
    assert.ok(p.direccionEscucha === '::' || p.direccionEscucha === '0.0.0.0', p.direccionEscucha);
    assert.equal(p.puertoPedido, config.PUERTO);
  });

  it('CONGELA comportamiento actual: A-17 / O4 server.js usa rutas relativas: sin views/ en el directorio de ejecución el panel responde 500', function () {
    var r = panel([], { sinVistas: true });
    var p = sandbox.resultadoJson(r.stdout);
    assert.equal(p.status, 500);
    assert.match(p.html, /Failed to lookup view &quot;index&quot; in views directory/);
  });
});

function filasPanel(html) {
  return (html.match(/<tr>[\s\S]*?<\/tr>/g) || []).map(function (tr) {
    var c = tr.match(/<td[^>]*>[\s\S]*?<\/td>/g).map(function (td) { return td.replace(/<[^>]+>/g, '').replace(/&oacute;/g, 'ó').replace(/&euro;/g, '€').replace(/\s+/g, ' ').trim(); });
    return c;
  });
}
