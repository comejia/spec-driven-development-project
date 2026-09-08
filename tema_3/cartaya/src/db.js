import Database from 'better-sqlite3';

/**
 * Inicialización idempotente del esquema SQLite.
 *
 * Tablas:
 *  - categorias: nombre, orden manual, archivada_en (soft-delete por timestamp).
 *  - platos: categoria_id, nombre, descripcion, precio_centimos (entero),
 *    foto_ruta, sin_alergenos, orden manual, archivado_en (soft-delete).
 *  - platos_alergenos: relación plato -> alérgeno (código del catálogo UE).
 *  - mesas: numero visible y token opaco del QR impreso, archivada_en (soft-delete).
 *  - pedidos: mesa_id, numero_pedido (secuencial global), estado, total_centimos
 *    (congelado al confirmar), creado_en. Un pedido pertenece a una mesa, jamás
 *    a una persona (privacidad por diseño): no hay ningún dato personal.
 *  - lineas_pedido: pedido_id, plato_id y una copia (snapshot) del nombre_plato y
 *    precio_centimos vigentes al confirmar, cantidad y nota opcional.
 *
 * Volver a ejecutarla sobre una BD ya inicializada no falla (CREATE ... IF NOT EXISTS).
 *
 * @param {string} [ruta] Ruta al fichero SQLite. ':memory:' para BD en memoria.
 * @returns {import('better-sqlite3').Database}
 */
export function abrirBaseDeDatos(ruta = 'cartaya.db') {
  const db = new Database(ruta);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  inicializarEsquema(db);
  return db;
}

export function inicializarEsquema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT    NOT NULL,
      orden        INTEGER NOT NULL DEFAULT 0,
      archivada_en TEXT    DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS platos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id    INTEGER NOT NULL REFERENCES categorias(id),
      nombre          TEXT    NOT NULL,
      descripcion     TEXT    DEFAULT NULL,
      precio_centimos INTEGER NOT NULL,
      foto_ruta       TEXT    DEFAULT NULL,
      sin_alergenos   INTEGER NOT NULL DEFAULT 0,
      orden           INTEGER NOT NULL DEFAULT 0,
      archivado_en    TEXT    DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS platos_alergenos (
      plato_id INTEGER NOT NULL REFERENCES platos(id),
      alergeno TEXT    NOT NULL,
      PRIMARY KEY (plato_id, alergeno)
    );

    CREATE INDEX IF NOT EXISTS idx_platos_categoria ON platos(categoria_id);
    CREATE INDEX IF NOT EXISTS idx_alergenos_plato  ON platos_alergenos(plato_id);

    CREATE TABLE IF NOT EXISTS mesas (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      numero       TEXT    NOT NULL,
      token        TEXT    NOT NULL UNIQUE,
      archivada_en TEXT    DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id        INTEGER NOT NULL REFERENCES mesas(id),
      numero_pedido  INTEGER NOT NULL UNIQUE,
      estado         TEXT    NOT NULL DEFAULT 'recibido',
      total_centimos INTEGER NOT NULL,
      creado_en      TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lineas_pedido (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id       INTEGER NOT NULL REFERENCES pedidos(id),
      plato_id        INTEGER NOT NULL REFERENCES platos(id),
      nombre_plato    TEXT    NOT NULL,
      precio_centimos INTEGER NOT NULL,
      cantidad        INTEGER NOT NULL,
      nota            TEXT    DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pedidos_mesa   ON pedidos(mesa_id);
    CREATE INDEX IF NOT EXISTS idx_lineas_pedido  ON lineas_pedido(pedido_id);
  `);
  return db;
}
