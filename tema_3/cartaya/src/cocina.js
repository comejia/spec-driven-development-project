// Dominio del panel de cocina.
//
// Reglas de negocio (ver openspec/specs/panel-cocina/spec.md):
//  - Ciclo de vida con transiciones ESTRICTAS: recibido → en_preparacion → servido.
//    No se permiten saltos (recibido → servido) ni retrocesos (en_preparacion →
//    recibido). Cada avance sella su marca de tiempo (preparado_en / servido_en).
//  - Un pedido solo se cancela mientras está en 'recibido'; la cancelación
//    registra 'cancelado_en' y NO borra el pedido.
//  - Vista activa = pedidos del día en 'recibido' o 'en_preparacion', ordenados
//    por antigüedad (el más antiguo primero). Histórico del día = 'servido' o
//    'cancelado' del día.
//  - Las mutaciones publican eventos SSE para que el panel se actualice en vivo.

import { formatearPrecioEuros } from './carta.js';
import { ErrorPedido } from './pedidos.js';
import { emisorCocina, EVENTO_PEDIDO_ACTUALIZADO } from './sse.js';

export const ESTADO_RECIBIDO = 'recibido';
export const ESTADO_EN_PREPARACION = 'en_preparacion';
export const ESTADO_SERVIDO = 'servido';
export const ESTADO_CANCELADO = 'cancelado';

// Transiciones de avance válidas: estado actual -> siguiente permitido.
const SIGUIENTE_ESTADO = Object.freeze({
  [ESTADO_RECIBIDO]: ESTADO_EN_PREPARACION,
  [ESTADO_EN_PREPARACION]: ESTADO_SERVIDO,
});

// Marca de tiempo que sella cada estado alcanzado por avance.
const MARCA_POR_ESTADO = Object.freeze({
  [ESTADO_EN_PREPARACION]: 'preparado_en',
  [ESTADO_SERVIDO]: 'servido_en',
});

// Estados de la vista activa y del histórico del día.
const ESTADOS_ACTIVOS = [ESTADO_RECIBIDO, ESTADO_EN_PREPARACION];
const ESTADOS_HISTORICO = [ESTADO_SERVIDO, ESTADO_CANCELADO];

/**
 * Avanza el estado de un pedido siguiendo la secuencia estricta
 * recibido → en_preparacion → servido. Valida contra el estado actual dentro de
 * una transacción y sella la marca de tiempo correspondiente. Rechaza saltos y
 * retrocesos con ErrorPedido. Publica 'pedido-actualizado' por SSE.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {number|string} numeroPedido
 * @param {string} nuevoEstado Estado destino (debe ser el inmediato siguiente).
 * @param {{ emisor?: { publicar: Function } }} [opts]
 * @returns {{ numeroPedido:number, estado:string }}
 */
export function avanzarEstado(db, numeroPedido, nuevoEstado, { emisor = emisorCocina } = {}) {
  const numero = Number(numeroPedido);

  const tx = db.transaction(() => {
    const pedido = db
      .prepare('SELECT id, estado FROM pedidos WHERE numero_pedido = ?')
      .get(numero);
    if (!pedido) throw new ErrorPedido('El pedido no existe.');

    const esperado = SIGUIENTE_ESTADO[pedido.estado];
    if (!esperado) {
      throw new ErrorPedido(
        `El pedido en estado '${pedido.estado}' no admite más avances.`
      );
    }
    if (nuevoEstado !== esperado) {
      throw new ErrorPedido(
        `Transición no permitida: de '${pedido.estado}' solo se puede pasar a '${esperado}'.`
      );
    }

    const columnaMarca = MARCA_POR_ESTADO[nuevoEstado];
    const ahora = new Date().toISOString();
    db.prepare(
      `UPDATE pedidos SET estado = ?, ${columnaMarca} = ? WHERE id = ?`
    ).run(nuevoEstado, ahora, pedido.id);

    return { numeroPedido: numero, estado: nuevoEstado };
  });

  const resultado = tx();
  emisor?.publicar?.(EVENTO_PEDIDO_ACTUALIZADO, resultado);
  return resultado;
}

/**
 * Cancela un pedido SOLO si está en 'recibido'. Registra 'cancelado_en' y NO
 * borra el pedido. Rechaza con ErrorPedido si ya está en preparación o servido.
 * Publica 'pedido-actualizado' por SSE.
 *
 * @returns {{ numeroPedido:number, estado:string, canceladoEn:string }}
 */
export function cancelarPedido(db, numeroPedido, { emisor = emisorCocina } = {}) {
  const numero = Number(numeroPedido);

  const tx = db.transaction(() => {
    const pedido = db
      .prepare('SELECT id, estado FROM pedidos WHERE numero_pedido = ?')
      .get(numero);
    if (!pedido) throw new ErrorPedido('El pedido no existe.');

    if (pedido.estado !== ESTADO_RECIBIDO) {
      throw new ErrorPedido(
        'Solo se puede cancelar un pedido que aún está en recibido.'
      );
    }

    const ahora = new Date().toISOString();
    db.prepare(
      'UPDATE pedidos SET estado = ?, cancelado_en = ? WHERE id = ?'
    ).run(ESTADO_CANCELADO, ahora, pedido.id);

    return { numeroPedido: numero, estado: ESTADO_CANCELADO, canceladoEn: ahora };
  });

  const resultado = tx();
  emisor?.publicar?.(EVENTO_PEDIDO_ACTUALIZADO, resultado);
  return resultado;
}

// Límites [inicio, fin) del día natural local que contiene `referencia`, en ISO.
function rangoDelDia(referencia = new Date()) {
  const inicio = new Date(referencia);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

function lineasDePedido(db, pedidoId) {
  return db
    .prepare(
      `SELECT plato_id, nombre_plato, precio_centimos, cantidad, nota
         FROM lineas_pedido WHERE pedido_id = ? ORDER BY id ASC`
    )
    .all(pedidoId)
    .map((l) => ({
      platoId: l.plato_id,
      nombre: l.nombre_plato,
      cantidad: l.cantidad,
      nota: l.nota,
      subtotal: formatearPrecioEuros(l.precio_centimos * l.cantidad),
    }));
}

function mapearPedido(db, fila) {
  return {
    numeroPedido: fila.numero_pedido,
    mesa: fila.mesa_numero,
    estado: fila.estado,
    creadoEn: fila.creado_en,
    total: formatearPrecioEuros(fila.total_centimos),
    lineas: lineasDePedido(db, fila.id),
  };
}

function listarPorEstados(db, estados, { referencia } = {}) {
  const { inicio, fin } = rangoDelDia(referencia);
  const marcadores = estados.map(() => '?').join(', ');
  const filas = db
    .prepare(
      `SELECT p.id, p.numero_pedido, p.estado, p.total_centimos, p.creado_en,
              m.numero AS mesa_numero
         FROM pedidos p
         JOIN mesas m ON m.id = p.mesa_id
        WHERE p.estado IN (${marcadores})
          AND p.creado_en >= ? AND p.creado_en < ?
        ORDER BY p.creado_en ASC, p.id ASC`
    )
    .all(...estados, inicio, fin);
  return filas.map((f) => mapearPedido(db, f));
}

/**
 * Pedidos del día en la vista activa (recibido + en_preparacion), ordenados por
 * antigüedad, con mesa, líneas (plato + cantidad + nota), estado y creado_en
 * (para calcular el tiempo transcurrido en el cliente).
 * @param {{ referencia?: Date }} [opts] referencia para el "día" (tests).
 */
export function listarActivosDelDia(db, opts = {}) {
  return listarPorEstados(db, ESTADOS_ACTIVOS, opts);
}

/**
 * Histórico del día: pedidos servidos y cancelados del día, con mesa, líneas y
 * estado final, ordenados por antigüedad.
 */
export function listarHistoricoDelDia(db, opts = {}) {
  return listarPorEstados(db, ESTADOS_HISTORICO, opts);
}
