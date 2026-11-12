// generar.js - REGENERA test/golden/master.json (NO es codigo de produccion).
//
//   node test/golden/generar.js
//
// SOLO se ejecuta con una decision de negocio documentada que cambie el comportamiento
// del flujo de facturacion (ver test/golden/LEEME.md). Nunca para "poner en verde" el test.
var fs = require('fs');
var path = require('path');
var flujo = require('./flujo');
var canonico = require('./canonico');

var DESTINO = path.join(__dirname, 'master.json');

flujo.generar().then(function (master) {
  fs.writeFileSync(DESTINO, canonico.aTexto(master));
  console.log('Master regenerado: ' + DESTINO + ' (' + Object.keys(master.casos).length + ' casos)');
}).catch(function (e) {
  console.error(e);
  process.exit(1);
});
