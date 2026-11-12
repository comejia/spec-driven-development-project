// tz.js - ayuda de los tests de caracterizacion (NO es codigo de produccion).
//
// Fija la zona horaria del proceso de test a Europe/Madrid ANTES de que nadie
// use Date. lib/util.js depende de la zona horaria del equipo (anomalia A-35,
// contradiccion 04): los valores esperados de los tests son los que produce el
// codigo con TZ=Europe/Madrid, que es la zona de la oficina (BD: 8 de 8
// vencimientos de la semilla solo cuadran en esta zona).
// Debe ser el primer require de cada fichero de test.
process.env.TZ = 'Europe/Madrid';

if (new Date(2026, 0, 31).getTimezoneOffset() !== -60 || new Date(2026, 6, 15).getTimezoneOffset() !== -120) {
  throw new Error('No se ha podido fijar TZ=Europe/Madrid en el proceso de test; los resultados de fechas no serian fiables.');
}
