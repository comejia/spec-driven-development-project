// casos.js - juego FIJO de casos de entrada del golden master (NO es codigo de produccion).
//
// Flujo central de negocio (flujo-factura.md): EMITIR UNA FACTURA, por sus dos
// caminos con calculo y numeracion compartidos:
//   · Camino A: alta manual (POST /facturas/nueva)  -> casos G01..G10
//   · Camino B: remesa mensual (scripts/remesa_mensual.js) -> casos G11 y G12
//
// REGLA: este juego no se modifica para "hacer que el test pase". Si se anade,
// quita o cambia un caso, hay que regenerar el master con decision documentada
// del negocio (ver LEEME.md). Las entradas se escriben tal y como las enviaria
// el formulario (todo texto), porque la lectura de los numeros tecleados es parte
// del comportamiento congelado (A-06).

// Entorno fijo en el que se genera y se compara el master
var ENTORNO = {
  tz: 'Europe/Madrid',
  fechaSistema: '2026-11-11T10:00:00'
};

function formulario(cliente, fecha, filas, obs) {
  var f = { cliente_id: String(cliente), desc: [], cant: [], precio: [], iva: [] };
  if (fecha !== null) f.fecha = fecha;
  if (obs !== undefined) f.obs = obs;
  filas.forEach(function (l) { f.desc.push(l[0]); f.cant.push(l[1]); f.precio.push(l[2]); f.iva.push(l[3]); });
  return f;
}

// Camino A. Se ejecutan EN ESTE ORDEN sobre la misma BD temporal (semilla: contador FA 2026 = 108),
// asi que los numeros salen correlativos desde FA-2026-000109.
var ALTAS = [
  { id: 'G01', descripcion: 'Factura simple de hostelería: una línea, IVA 21 %, cliente sin plazo (vence a +30 días, cruzando fin de mes)',
    form: formulario(1, '2026-01-31', [['Vaso caña 20cl (caja 72)', '3', '21,60', '21']]) },
  { id: 'G02', descripcion: 'Redondeo línea a línea con coma flotante: 3 × 0,12 al 21 %, 0,01 × 14,50 y 0,03 × 7,50 (coma decimal tecleada)',
    form: formulario(1, '2026-05-06', [['a', '1', '0,12', '21'], ['b', '1', '0,12', '21'], ['c', '1', '0,12', '21'], ['d', '0,01', '14,50', '21'], ['e', '0,03', '7,50', '21']]) },
  { id: 'G03', descripcion: 'Cliente con recargo de equivalencia y tres tipos de IVA (21/10/4) con cantidades fraccionarias',
    form: formulario(2, '2026-02-06', [['Desengrasante', '4', '18,50', '21'], ['Café', '0,97', '11,95', '10'], ['Aceite', '1,41', '27,45', '4'], ['Portes', '0,32', '6', '21']]) },
  { id: 'G04', descripcion: 'Frontera del descuento: base de 1.000,00 € exactos (no descuenta) con cliente a 60 días',
    form: formulario(3, '2026-02-20', [['Pedido apertura', '1', '1000', '21']], 'Pedido apertura temporada') },
  { id: 'G05', descripcion: 'Frontera del descuento: 1.000,01 € (2 %), con y sin observaciones propias',
    form: formulario(1, '2026-03-02', [['Pedido', '1', '1000,01', '21']], 'Pedido grande') },
  { id: 'G06', descripcion: 'Frontera del segundo tramo: 5.000,00 € exactos (siguen en el 2 %)',
    form: formulario(1, '2026-03-03', [['Pedido', '1', '5000', '21']]) },
  { id: 'G07', descripcion: 'Frontera del segundo tramo: 5.000,01 € (5 %), con cliente con recargo',
    form: formulario(4, '2026-03-04', [['Pedido', '1', '5000,01', '21']]) },
  { id: 'G08', descripcion: 'El tramo se decide con la base bruta: 1.020,41 € → 2 % → base final 1.000,00 €, cliente con recargo',
    form: formulario(2, '2026-03-05', [['Pedido', '1', '1020,41', '21']]) },
  { id: 'G09', descripcion: 'Tecleo con rarezas: miles «1.234,50» (se lee 1,234), fila sin descripción descartada, cantidad negativa e IVA 5 % con recargo',
    form: formulario(4, '2026-03-06', [['con miles', '1', '1.234,50', '21'], ['', '2', '50', '21'], ['devolución', '-2', '10,005', '5']]) },
  { id: 'G10', descripcion: 'Fecha de otro año grabada hoy (2025-12-31 en 2026): el número es del año del reloj; cliente a 60 días',
    form: formulario(5, '2025-12-31', [['Servicio', '1', '100', '21']]) }
];

// Camino B. Cada remesa se ejecuta en una BD temporal nueva (semilla). contratos: null = los de la semilla;
// si no, lista de [cliente_id, concepto, cuota, tipo_iva, fecha_alta, fecha_baja] que REEMPLAZA a los de la semilla.
var REMESAS = [
  { id: 'G11', descripcion: 'Remesa de febrero de 2026 con los contratos de la semilla (alta a mitad de mes: días reales sobre 28)',
    mes: '2026-02', fechaSistema: '2026-11-11T10:00:00', contratos: null },
  { id: 'G12', descripcion: 'Remesa de diciembre de 2026 lanzada el 1-ene-2027: año del número, baja a mitad de mes, cuota grande con recargo y alta a mitad de mes con IVA 10 %',
    mes: '2026-12', fechaSistema: '2027-01-01T09:00:00',
    contratos: [
      [1, 'Alquiler completo', 90, 21, '2024-03-01', null],
      [2, 'Cuota grande con recargo', 1500, 21, '2020-01-01', null],
      [3, 'Baja a mitad de mes', 145, 21, '2023-01-15', '2026-12-15'],
      [6, 'Alta a mitad de mes', 90, 10, '2026-12-16', null]
    ] }
];

module.exports = { ENTORNO: ENTORNO, ALTAS: ALTAS, REMESAS: REMESAS };
