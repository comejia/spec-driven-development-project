// Dominio de pedidos desde la mesa.
//
// Reglas de negocio (ver openspec/specs/pedidos-mesa/spec.md):
//  - Un pedido pertenece SIEMPRE a una mesa (identificada por el token de su QR),
//    JAMÁS a una persona: no se recogen ni almacenan datos personales.
//  - La cantidad de cada línea es un entero > 0; la nota es opcional y ≤ 140.
//  - Solo se pueden pedir platos activos (plato y su categoría no archivados).
//  - Al confirmar se revalida contra la carta: los platos que dejaron de estar
//    activos se retiran y se avisa; si no queda ninguna línea, no se confirma.
//  - El precio y el nombre de cada línea se congelan (snapshot) al confirmar.

import crypto from 'node:crypto';

import { formatearPrecioEuros } from './carta.js';
import { emisorCocina, EVENTO_PEDIDO_NUEVO } from './sse.js';

export const MAX_NOTA = 140;
export const ESTADO_INICIAL = 'recibido';

export class ErrorPedido extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorPedido';
    this.codigo = 'PEDIDO';
  }
}

/**
 * Siembra idempotente de mesas. Crea las mesas que falten por `numero` (etiqueta
 * visible) generando un token opaco y único para cada una. Volver a ejecutarla no
 * duplica mesas ni regenera tokens de las que ya existen.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {Array<string|number>} numeros Etiquetas visibles de mesa (p. ej. [1,2,3]).
 * @returns {Array<{ id:number, numero:string, token:string }>} Todas las mesas tras sembrar.
 */
export function sembrarMesas(db, numeros = []) {
  const insertar = db.prepare(
    'INSERT INTO mesas (numero, token) VALUES (?, ?)'
  );
  const buscarPorNumero = db.prepare(
    'SELECT id FROM mesas WHERE numero = ?'
  );
  const tx = db.transaction((lista) => {
    for (const n of lista) {
      const numero = String(n);
      if (buscarPorNumero.get(numero)) continue; // ya existe: no duplicar
      insertar.run(numero, generarToken());
    }
  });
  tx(numeros);
  return db
    .prepare('SELECT id, numero, token FROM mesas WHERE archivada_en IS NULL ORDER BY id ASC')
    .all();
}

function generarToken() {
  // Token opaco, no adivinable ni correlativo.
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Lista las mesas no archivadas con su número visible y su token (para generar el
 * QR de cada mesa en la administración). Solo debe exponerse bajo sesión.
 * @returns {Array<{ numero:string, token:string }>}
 */
export function listarMesas(db) {
  return db
    .prepare('SELECT numero, token FROM mesas WHERE archivada_en IS NULL ORDER BY id ASC')
    .all();
}

/**
 * Resuelve una mesa por el token de su QR.
 * @returns {{ id:number, numero:string } | null} la mesa, o null si el token no existe.
 */
export function resolverMesaPorToken(db, token) {
  if (!token) return null;
  const mesa = db
    .prepare('SELECT id, numero FROM mesas WHERE token = ? AND archivada_en IS NULL')
    .get(String(token));
  return mesa ?? null;
}

/**
 * Indica si un plato está activo en la carta: el plato no está archivado y su
 * categoría tampoco (misma regla que construirCarta en carta.js).
 */
export function platoActivo(db, platoId) {
  const fila = db
    .prepare(
      `SELECT p.id
         FROM platos p
         JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ?
          AND p.archivado_en IS NULL
          AND c.archivada_en IS NULL`
    )
    .get(platoId);
  return Boolean(fila);
}

function validarLineaEntrada({ cantidad, nota }) {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorPedido('La cantidad debe ser un número entero mayor que 0.');
  }
  if (nota != null && String(nota).length > MAX_NOTA) {
    throw new ErrorPedido(`La nota no puede superar los ${MAX_NOTA} caracteres.`);
  }
}

/**
 * Prepara (previsualiza) un pedido sin persistir nada: resuelve el nombre y el
 * precio vigentes de cada plato, calcula subtotales y total en céntimos, valida
 * cantidad y nota, y separa las líneas retiradas por corresponder a platos que
 * ya no están activos.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {{ lineas: Array<{ platoId:number, cantidad:number, nota?:string }> }} entrada
 * @returns {{ lineas: Array, lineasRetiradas: Array, totalCentimos:number, total:string }}
 */
export function prepararPedido(db, { lineas = [] } = {}) {
  const activas = [];
  const retiradas = [];
  let totalCentimos = 0;

  for (const linea of lineas) {
    validarLineaEntrada(linea);
    const platoId = Number(linea.platoId);
    const plato = db
      .prepare('SELECT id, nombre, precio_centimos FROM platos WHERE id = ?')
      .get(platoId);

    if (!plato || !platoActivo(db, platoId)) {
      retiradas.push({
        platoId,
        nombre: plato ? plato.nombre : null,
        cantidad: linea.cantidad,
      });
      continue;
    }

    const nota = normalizarNota(linea.nota);
    const subtotalCentimos = plato.precio_centimos * linea.cantidad;
    totalCentimos += subtotalCentimos;
    activas.push({
      platoId: plato.id,
      nombre: plato.nombre,
      precioCentimos: plato.precio_centimos,
      cantidad: linea.cantidad,
      nota,
      subtotalCentimos,
      subtotal: formatearPrecioEuros(subtotalCentimos),
    });
  }

  return {
    lineas: activas,
    lineasRetiradas: retiradas,
    totalCentimos,
    total: formatearPrecioEuros(totalCentimos),
  };
}

function normalizarNota(nota) {
  if (nota == null) return null;
  const limpia = String(nota).trim();
  return limpia === '' ? null : limpia;
}

/**
 * Confirma un pedido en una transacción: resuelve la mesa por token, revalida los
 * platos activos (retirando los inactivos), recalcula el total, rechaza si no
 * queda ninguna línea, y crea el pedido (estado inicial 'recibido', numero_pedido
 * secuencial global, total congelado) con sus líneas (snapshot de nombre y precio).
 *
 * @returns {{ numeroPedido:number, estado:string, totalCentimos:number, total:string,
 *   lineasRetiradas:Array }}
 * @throws {ErrorPedido} si el token no es válido o el pedido queda vacío.
 */
export function confirmarPedido(db, { token, lineas = [] } = {}, { emisor = emisorCocina } = {}) {
  const mesa = resolverMesaPorToken(db, token);
  if (!mesa) throw new ErrorPedido('La mesa no es válida.');

  // Validaciones de entrada fuera de la transacción (lanzan antes de tocar la BD).
  for (const linea of lineas) validarLineaEntrada(linea);

  const tx = db.transaction(() => {
    const resumen = prepararPedido(db, { lineas });
    if (resumen.lineas.length === 0) {
      throw new ErrorPedido('El pedido está vacío: no hay platos activos que enviar.');
    }

    const numeroPedido = siguienteNumeroPedido(db);
    const creadoEn = new Date().toISOString();
    const info = db
      .prepare(
        `INSERT INTO pedidos (mesa_id, numero_pedido, estado, total_centimos, creado_en)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(mesa.id, numeroPedido, ESTADO_INICIAL, resumen.totalCentimos, creadoEn);
    const pedidoId = info.lastInsertRowid;

    const insertarLinea = db.prepare(
      `INSERT INTO lineas_pedido (pedido_id, plato_id, nombre_plato, precio_centimos, cantidad, nota)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const l of resumen.lineas) {
      insertarLinea.run(pedidoId, l.platoId, l.nombre, l.precioCentimos, l.cantidad, l.nota);
    }

    return {
      numeroPedido,
      estado: ESTADO_INICIAL,
      totalCentimos: resumen.totalCentimos,
      total: resumen.total,
      lineasRetiradas: resumen.lineasRetiradas,
    };
  });

  const resultado = tx();
  // Fuera de la transacción: el panel de cocina recibe el pedido nuevo en vivo.
  emisor?.publicar?.(EVENTO_PEDIDO_NUEVO, {
    numeroPedido: resultado.numeroPedido,
    mesa: mesa.numero,
    estado: resultado.estado,
    total: resultado.total,
  });
  return resultado;
}

function siguienteNumeroPedido(db) {
  const fila = db
    .prepare('SELECT COALESCE(MAX(numero_pedido), 0) AS m FROM pedidos')
    .get();
  return fila.m + 1;
}

/**
 * Devuelve un pedido por su número visible, con su estado y sus líneas, o null.
 */
export function obtenerPedidoPorNumero(db, numeroPedido) {
  const pedido = db
    .prepare(
      `SELECT id, numero_pedido, estado, total_centimos, creado_en
         FROM pedidos WHERE numero_pedido = ?`
    )
    .get(Number(numeroPedido));
  if (!pedido) return null;

  const lineas = db
    .prepare(
      `SELECT plato_id, nombre_plato, precio_centimos, cantidad, nota
         FROM lineas_pedido WHERE pedido_id = ? ORDER BY id ASC`
    )
    .all(pedido.id)
    .map((l) => ({
      platoId: l.plato_id,
      nombre: l.nombre_plato,
      precioCentimos: l.precio_centimos,
      cantidad: l.cantidad,
      nota: l.nota,
      subtotal: formatearPrecioEuros(l.precio_centimos * l.cantidad),
    }));

  return {
    numeroPedido: pedido.numero_pedido,
    estado: pedido.estado,
    totalCentimos: pedido.total_centimos,
    total: formatearPrecioEuros(pedido.total_centimos),
    lineas,
  };
}
