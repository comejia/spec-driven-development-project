// preload-fecha.js - ayuda de los tests de caracterizacion (NO es codigo de produccion).
// Se carga con `node -r` en los procesos hijos para fijar el reloj del sistema:
//   FECHA_SISTEMA=2026-11-11T10:00:00 (hora local del TZ del proceso)
// Asi `new Date()` y `Date.now()` devuelven siempre el mismo instante y los
// resultados que dependen del reloj (hoy(), año del numero) son reproducibles.
var RealDate = Date;
var fijo = process.env.FECHA_SISTEMA ? new RealDate(process.env.FECHA_SISTEMA).getTime() : null;

if (fijo !== null) {
  var FalsaDate = function () {
    if (!(this instanceof FalsaDate)) return new RealDate(fijo).toString();
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) return new RealDate(fijo);
    return new (Function.prototype.bind.apply(RealDate, [null].concat(args)))();
  };
  FalsaDate.prototype = RealDate.prototype;
  FalsaDate.now = function () { return fijo; };
  FalsaDate.UTC = RealDate.UTC;
  FalsaDate.parse = RealDate.parse;
  global.Date = FalsaDate;
}

// Sobrescritura de config EN MEMORIA, solo para demostrar contradicciones latentes (contradiccion 02):
//   GESFACT_CONFIG='{"VENCIMIENTO_DIAS":45}'
// config.js en disco no se toca; solo cambia el objeto que ven los modulos de este proceso.
if (process.env.GESFACT_CONFIG && process.env.REPO) {
  Object.assign(require(process.env.REPO + '/config'), JSON.parse(process.env.GESFACT_CONFIG));
}
