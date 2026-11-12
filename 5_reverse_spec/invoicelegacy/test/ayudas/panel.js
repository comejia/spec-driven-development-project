// panel.js - ayuda de los tests de caracterizacion (NO es codigo de produccion).
//
// Arranca el server.js REAL (con su panel de inicio) sobre la BD temporal del
// directorio de trabajo. server.js escucha en config.PUERTO (3000, fijo), asi
// que se intercepta http.Server.prototype.listen para escuchar en un puerto
// libre sin tocar config.js ni server.js. Opcionalmente ejecuta antes unas
// sentencias SQL (stdin: JSON {sql: [...]}), pide GET / y devuelve:
// el HTML del panel, la direccion en la que escucha el servidor y el puerto pedido.
var path = require('path');
var http = require('http');
var REPO = process.env.REPO;

var puertoPedido = null;
var servidor = null;
var listenReal = http.Server.prototype.listen;
http.Server.prototype.listen = function () {
  var args = Array.prototype.slice.call(arguments);
  puertoPedido = args[0];
  args[0] = 0; // puerto libre; se conserva el resto de argumentos (callback)
  servidor = this;
  return listenReal.apply(this, args);
};

var entrada = '';
process.stdin.on('data', function (d) { entrada += d; });
process.stdin.on('end', function () {
  var sentencias = entrada ? JSON.parse(entrada).sql || [] : [];
  var db = require(path.join(REPO, 'db'));
  // server.js arranca (db.inicializar + listen) al cargarse
  process.chdir(process.cwd());
  require(path.join(REPO, 'server.js'));
  var intentos = 0;
  (function esperar() {
    if (!servidor || !servidor.address()) {
      if (++intentos > 100) { console.error('el servidor no arranco'); process.exit(1); }
      return setTimeout(esperar, 50);
    }
    var direccion = servidor.address();
    (function sql(i) {
      if (i >= sentencias.length) return pedir();
      db.run(sentencias[i], function (e) { if (e) { console.error(e); process.exit(1); } sql(i + 1); });
    })(0);

    function pedir() {
      http.get({ host: '127.0.0.1', port: direccion.port, path: '/' }, function (res) {
        var t = [];
        res.on('data', function (x) { t.push(x); });
        res.on('end', function () {
          process.stdout.write('\n@@RESULTADO@@' + JSON.stringify({
            status: res.statusCode, html: Buffer.concat(t).toString('utf8'),
            direccionEscucha: direccion.address, puertoPedido: puertoPedido
          }));
          process.exit(0);
        });
      });
    }
  })();
});
