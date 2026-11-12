// flujo.js - ejecuta el flujo central con el juego fijo de casos y devuelve la salida COMPLETA
// (NO es codigo de produccion). Lo usan el test (golden-master.test.js) y el generador (generar.js).
//
// Todo se ejecuta sobre BDs TEMPORALES, con TZ=Europe/Madrid y el reloj del sistema fijo:
// la salida es reproducible y no depende de la maquina. La BD real no se toca.
var path = require('path');
var casos = require('./casos');
var sandbox = require('../ayudas/sandbox');

var ESCENARIO = path.join(sandbox.RAIZ, 'test', 'ayudas', 'escenario-http.js');
var REMESA = path.join(sandbox.RAIZ, 'scripts', 'remesa_mensual.js');

function sinClaves(obj, claves) {
  var r = {};
  Object.keys(obj).forEach(function (k) { if (claves.indexOf(k) < 0) r[k] = obj[k]; });
  return r;
}

// las lineas se insertan en paralelo (orden no garantizado): se ordenan por descripcion y cantidad
function ordenarLineas(ls) {
  return ls.slice().sort(function (a, b) {
    if (a.descripcion !== b.descripcion) return a.descripcion < b.descripcion ? -1 : 1;
    return a.cantidad - b.cantidad;
  });
}

function facturaConLineas(facturas, lineas, factura) {
  return {
    factura: sinClaves(factura, ['id']),
    lineas: ordenarLineas(lineas.filter(function (l) { return l.factura_id === factura.id; })).map(function (l) { return sinClaves(l, ['id', 'factura_id']); })
  };
}

function generarAltas() {
  var pasos = casos.ALTAS.map(function (c) { return { nombre: c.id, metodo: 'POST', ruta: '/facturas/nueva', form: c.form }; });
  var r = sandbox.lanzar({ script: ESCENARIO, input: JSON.stringify(pasos), fecha: casos.ENTORNO.fechaSistema, tz: casos.ENTORNO.tz });
  sandbox.borrarCarpeta(r.dir);
  if (r.status !== 0) throw new Error('Fallo el escenario de altas: ' + r.stderr);
  var o = sandbox.resultadoJson(r.stdout);
  var salida = {};
  casos.ALTAS.forEach(function (c) {
    var p = o.respuestas.filter(function (x) { return x.paso === c.id; })[0];
    var s = { http: { status: p.status, location: p.location } };
    var m = p.location && /^\/facturas\/(\d+)$/.exec(p.location);
    if (m) {
      var f = o.facturas.filter(function (x) { return x.id === parseInt(m[1], 10); })[0];
      var d = facturaConLineas(o.facturas, o.lineas, f);
      s.factura = d.factura;
      s.lineas = d.lineas;
    } else {
      s.cuerpo = p.cuerpo;
    }
    salida[c.id] = { camino: 'A: alta manual', descripcion: c.descripcion, entrada: c.form, salida: s };
  });
  return { casos: salida, contadores: o.contadores };
}

function generarRemesa(c) {
  var dir = sandbox.prepararBd(sandbox.crearCarpeta());
  var sql = [];
  if (c.contratos) {
    sql.push('DELETE FROM contratos');
    c.contratos.forEach(function (k) { sql.push(['INSERT INTO contratos (cliente_id,concepto,cuota,tipo_iva,fecha_alta,fecha_baja) VALUES (?,?,?,?,?,?)', k]); });
  }
  var pendiente = (sql.length ? sandbox.ejecutarSql(dir, sql) : Promise.resolve()).then(function () {
    var r = sandbox.lanzar({ dir: dir, script: REMESA, args: [c.mes], fecha: c.fechaSistema, tz: casos.ENTORNO.tz });
    return Promise.all([
      sandbox.consultar(dir, 'SELECT * FROM facturas WHERE id > 9 ORDER BY id'),
      sandbox.consultar(dir, 'SELECT * FROM lineas WHERE factura_id > 9 ORDER BY id'),
      sandbox.consultar(dir, 'SELECT serie, anyo, ultimo FROM contadores ORDER BY serie, anyo')
    ]).then(function (x) {
      sandbox.borrarCarpeta(dir);
      return {
        camino: 'B: remesa mensual',
        descripcion: c.descripcion,
        entrada: { mes: c.mes, fechaSistema: c.fechaSistema, contratos: c.contratos === null ? 'los de la semilla' : c.contratos },
        salida: {
          codigoSalida: r.status,
          consola: r.stdout,
          facturas: x[0].map(function (f) { return facturaConLineas(x[0], x[1], f); }),
          contadores: x[2]
        }
      };
    });
  });
  return pendiente;
}

// devuelve (promesa) el objeto completo del master
function generar() {
  var altas = generarAltas();
  return Promise.all(casos.REMESAS.map(generarRemesa)).then(function (remesas) {
    var todos = {};
    Object.keys(altas.casos).forEach(function (k) { todos[k] = altas.casos[k]; });
    casos.REMESAS.forEach(function (c, i) { todos[c.id] = remesas[i]; });
    return {
      meta: {
        formato: 1,
        entorno: casos.ENTORNO,
        contadoresTrasLasAltas: altas.contadores,
        nota: 'Golden master del flujo central de emision de facturas. No editar a mano: ver test/golden/LEEME.md'
      },
      casos: todos
    };
  });
}

module.exports = { generar: generar };
