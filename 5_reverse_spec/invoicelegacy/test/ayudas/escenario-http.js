// escenario-http.js - ayuda de los tests de caracterizacion (NO es codigo de produccion).
//
// Monta los routers REALES de GesFact (routes/*.js) en una app Express igual que
// server.js (mismo bodyParser, mismo motor de vistas), sobre un puerto libre y
// sobre la BD temporal del directorio de trabajo, y ejecuta una lista de
// peticiones leida de stdin (JSON). Devuelve por stdout (JSON): la respuesta de
// cada peticion y el volcado completo de facturas, lineas y contadores.
//
// No se importa server.js porque escucha en el puerto fijo 3000 y arranca solo.
var path = require('path');
var http = require('http');
var REPO = process.env.REPO;

var express = require(path.join(REPO, 'node_modules', 'express'));
var bodyParser = require(path.join(REPO, 'node_modules', 'body-parser'));
var db = require(path.join(REPO, 'db'));

var app = express();
app.set('views', path.join(REPO, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/articulos', require(path.join(REPO, 'routes', 'articulos')));
app.use('/clientes', require(path.join(REPO, 'routes', 'clientes')));
app.use('/contratos', require(path.join(REPO, 'routes', 'contratos')));
app.use('/facturas', require(path.join(REPO, 'routes', 'facturas')));
app.use('/informes', require(path.join(REPO, 'routes', 'informes')));

// serializa un formulario con arrays repetidos (desc=..&desc=..)
function codificar(form) {
  var partes = [];
  Object.keys(form || {}).forEach(function (k) {
    [].concat(form[k]).forEach(function (v) {
      partes.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
  });
  return partes.join('&');
}

function peticion(puerto, paso, cb) {
  var cuerpo = codificar(paso.form);
  var req = http.request({
    host: '127.0.0.1', port: puerto, method: paso.metodo || 'GET', path: paso.ruta,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(cuerpo) }
  }, function (res) {
    var trozos = [];
    res.on('data', function (t) { trozos.push(t); });
    res.on('end', function () {
      cb({
        paso: paso.nombre || (paso.metodo + ' ' + paso.ruta),
        status: res.statusCode,
        location: res.headers.location || null,
        contentType: res.headers['content-type'] || null,
        contentDisposition: res.headers['content-disposition'] || null,
        cuerpo: Buffer.concat(trozos).toString('utf8')
      });
    });
  });
  // algunas rutas pueden no responder nunca (p. ej. rectificar una factura sin
  // lineas, ver registro de anomalias A-14): se corta a los 1500 ms y se anota
  req.setTimeout(1500, function () { cb({ paso: paso.nombre || (paso.metodo + ' ' + paso.ruta), sinRespuesta: true }); req.destroy(); });
  req.on('error', function (e) { if (!e || e.code !== 'ECONNRESET') cb({ paso: paso.nombre, error: String(e) }); });
  req.end(cuerpo);
}

var leido = '';
process.stdin.on('data', function (d) { leido += d; });
process.stdin.on('end', function () {
  var pasos = leido ? JSON.parse(leido) : [];
  db.inicializar(function (err) {
    if (err) { console.error(err); process.exit(1); }
    var servidor = app.listen(0, '127.0.0.1', function () {
      var puerto = servidor.address().port;
      var respuestas = [];
      var i = 0;
      (function siguiente() {
        if (i >= pasos.length) return volcar();
        // un paso {sql: '...', params: [...]} prepara datos directamente en la BD temporal
        if (pasos[i].sql) {
          var sp = pasos[i++];
          return db.run(sp.sql, sp.params || [], function (e) {
            respuestas.push({ paso: sp.nombre || 'sql', sql: sp.sql, error: e ? String(e) : null });
            siguiente();
          });
        }
        peticion(puerto, pasos[i++], function (r) { respuestas.push(r); siguiente(); });
      })();

      function volcar() {
        // pequeña espera: algunas rutas responden antes de acabar sus INSERT/UPDATE
        setTimeout(function () {
          db.all('SELECT * FROM facturas ORDER BY id', function (e1, facturas) {
            db.all('SELECT * FROM lineas ORDER BY id', function (e2, lineas) {
              db.all('SELECT * FROM contadores ORDER BY serie, anyo', function (e3, contadores) {
                process.stdout.write('\n@@RESULTADO@@' + JSON.stringify({ respuestas: respuestas, facturas: facturas, lineas: lineas, contadores: contadores }));
                process.exit(0);
              });
            });
          });
        }, 200);
      }
    });
  });
});
