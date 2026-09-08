import Database from 'better-sqlite3';

/**
 * Inicialización idempotente del esquema SQLite.
 *
 * Tablas:
 *  - categorias: nombre, orden manual, archivada_en (soft-delete por timestamp).
 *  - platos: categoria_id, nombre, descripcion, precio_centimos (entero),
 *    foto_ruta, sin_alergenos, orden manual, archivado_en (soft-delete).
 *  - platos_alergenos: relación plato -> alérgeno (código del catálogo UE).
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
  `);
  return db;
}
