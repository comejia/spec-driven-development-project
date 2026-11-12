// sandbox.js - ayuda de los tests de caracterizacion (NO es codigo de produccion).
//
// Ejecuta codigo de GesFact que toca la base de datos (numeracion, remesa, rutas)
// en un PROCESO HIJO cuyo directorio de trabajo es una carpeta temporal nueva.
// Como config.RUTA_BD es relativa ('./datos/gesfact.db'), db.js crea una BD
// nueva en esa carpeta y la rellena con los datos semilla: la BD real del
// proyecto (datos/gesfact.db) NO se abre, ni se lee ni se escribe jamas.
var path = require('path');
var os = require('os');
var fs = require('fs');
var cp = require('child_process');
var sqlite3 = require('sqlite3');

var RAIZ = path.resolve(__dirname, '..', '..');
var PRELOAD = path.join(__dirname, 'preload-fecha.js');

function crearCarpeta() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gesfact-test-'));
}

function borrarCarpeta(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// lanza `node -r preload <script> ...args` en la carpeta temporal
function lanzar(opciones) {
  var dir = opciones.dir || crearCarpeta();
  // server.js usa rutas RELATIVAS ('views', 'public'): solo funciona si el
  // directorio de trabajo es la raiz del proyecto (ver anomalia A-17/O4).
  // Para ejecutarlo en la carpeta temporal se enlazan simbolicamente.
  if (opciones.conVistas) {
    ['views', 'public'].forEach(function (n) {
      if (!fs.existsSync(path.join(dir, n))) fs.symlinkSync(path.join(RAIZ, n), path.join(dir, n));
    });
  }
  var env = {
    PATH: process.env.PATH,
    TZ: opciones.tz || 'Europe/Madrid',
    FECHA_SISTEMA: opciones.fecha || '2026-11-11T10:00:00',
    REPO: RAIZ
  };
  if (opciones.config) env.GESFACT_CONFIG = JSON.stringify(opciones.config);
  var r = cp.spawnSync(process.execPath, ['-r', PRELOAD, opciones.script].concat(opciones.args || []), {
    cwd: dir,
    env: env,
    input: opciones.input || '',
    encoding: 'utf8',
    timeout: 60000
  });
  return { dir: dir, status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// ejecuta codigo JS suelto (con `REPO` disponible como variable global del proceso)
function ejecutarCodigo(codigo, opciones) {
  opciones = opciones || {};
  var dir = opciones.dir || crearCarpeta();
  var fichero = path.join(dir, '_codigo.js');
  fs.writeFileSync(fichero, 'var REPO = process.env.REPO;\n' + codigo);
  var r = lanzar({ dir: dir, script: fichero, args: opciones.args, tz: opciones.tz, fecha: opciones.fecha, input: opciones.input });
  return r;
}

// consulta de solo lectura a la BD temporal
function consultar(dir, sql, params) {
  return new Promise(function (resolve, reject) {
    var bd = new sqlite3.Database(path.join(dir, 'datos', 'gesfact.db'), sqlite3.OPEN_READONLY, function (e) {
      if (e) return reject(e);
      bd.all(sql, params || [], function (e2, filas) {
        bd.close();
        if (e2) return reject(e2);
        resolve(filas);
      });
    });
  });
}

// crea la BD temporal con los datos semilla (db.inicializar) sin hacer nada mas
function prepararBd(dir) {
  var r = ejecutarCodigo("require(REPO + '/db').inicializar(function (e) { if (e) { console.error(e); process.exit(1); } process.exit(0); });", { dir: dir });
  if (r.status !== 0) throw new Error('No se pudo preparar la BD temporal: ' + r.stderr);
  return dir;
}

// ejecuta sentencias de escritura sobre la BD temporal (solo para montar el escenario)
function ejecutarSql(dir, sentencias) {
  return new Promise(function (resolve, reject) {
    var bd = new sqlite3.Database(path.join(dir, 'datos', 'gesfact.db'), function (e) {
      if (e) return reject(e);
      bd.serialize(function () {
        sentencias.forEach(function (s) {
          var sql = Array.isArray(s) ? s[0] : s;
          var params = Array.isArray(s) ? s[1] : [];
          bd.run(sql, params, function (e2) { if (e2) reject(e2); });
        });
        bd.close(function (e3) { return e3 ? reject(e3) : resolve(); });
      });
    });
  });
}

// extrae el JSON que escenario-http.js escribe tras la marca @@RESULTADO@@
// (el resto de stdout, p. ej. los avisos de email.js, se devuelve aparte)
function resultadoJson(salida) {
  var i = salida.indexOf('@@RESULTADO@@');
  if (i < 0) throw new Error('El proceso hijo no devolvio resultado. stdout=' + salida);
  return JSON.parse(salida.slice(i + '@@RESULTADO@@'.length));
}

module.exports = {
  prepararBd: prepararBd,
  ejecutarSql: ejecutarSql,
  resultadoJson: resultadoJson,
  RAIZ: RAIZ,
  crearCarpeta: crearCarpeta,
  borrarCarpeta: borrarCarpeta,
  lanzar: lanzar,
  ejecutarCodigo: ejecutarCodigo,
  consultar: consultar
};
