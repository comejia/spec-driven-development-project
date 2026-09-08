import { validarDeclaracionAlergenos } from './alergenos.js';

export const MAX_DESCRIPCION = 200;

/** Normaliza un nombre para comparar unicidad: sin mayúsculas ni espacios sobrantes. */
export function normalizarNombre(nombre) {
  return String(nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-ES');
}

export class ErrorValidacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.codigo = 'VALIDACION';
  }
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

function nombreCategoriaEnUso(db, nombre, exceptoId = null) {
  const norm = normalizarNombre(nombre);
  const filas = db
    .prepare('SELECT id, nombre FROM categorias WHERE archivada_en IS NULL')
    .all();
  return filas.some(
    (c) => normalizarNombre(c.nombre) === norm && c.id !== exceptoId
  );
}

export function crearCategoria(db, { nombre }) {
  const limpio = String(nombre ?? '').trim();
  if (!limpio) throw new ErrorValidacion('El nombre de la categoría es obligatorio.');
  if (nombreCategoriaEnUso(db, limpio)) {
    throw new ErrorValidacion('Ya existe una categoría con ese nombre.');
  }
  const maxOrden =
    db.prepare('SELECT COALESCE(MAX(orden), -1) AS m FROM categorias').get().m;
  const info = db
    .prepare('INSERT INTO categorias (nombre, orden) VALUES (?, ?)')
    .run(limpio, maxOrden + 1);
  return obtenerCategoria(db, info.lastInsertRowid);
}

export function editarCategoria(db, id, { nombre }) {
  const cat = obtenerCategoria(db, id);
  if (!cat) throw new ErrorValidacion('La categoría no existe.');
  const limpio = String(nombre ?? '').trim();
  if (!limpio) throw new ErrorValidacion('El nombre de la categoría es obligatorio.');
  if (nombreCategoriaEnUso(db, limpio, id)) {
    throw new ErrorValidacion('Ya existe una categoría con ese nombre.');
  }
  db.prepare('UPDATE categorias SET nombre = ? WHERE id = ?').run(limpio, id);
  return obtenerCategoria(db, id);
}

/** Reordena categorías reescribiendo el bloque de `orden` en una transacción. */
export function reordenarCategorias(db, idsEnOrden) {
  const tx = db.transaction((ids) => {
    ids.forEach((id, indice) => {
      db.prepare('UPDATE categorias SET orden = ? WHERE id = ?').run(indice, id);
    });
  });
  tx(idsEnOrden);
}

export function archivarCategoria(db, id, cuando = new Date().toISOString()) {
  const cat = obtenerCategoria(db, id);
  if (!cat) throw new ErrorValidacion('La categoría no existe.');
  db.prepare('UPDATE categorias SET archivada_en = ? WHERE id = ?').run(cuando, id);
  return obtenerCategoria(db, id);
}

export function obtenerCategoria(db, id) {
  return db.prepare('SELECT * FROM categorias WHERE id = ?').get(id) ?? null;
}

// ---------------------------------------------------------------------------
// Platos
// ---------------------------------------------------------------------------

function nombrePlatoEnUso(db, categoriaId, nombre, exceptoId = null) {
  const norm = normalizarNombre(nombre);
  const filas = db
    .prepare(
      'SELECT id, nombre FROM platos WHERE categoria_id = ? AND archivado_en IS NULL'
    )
    .all(categoriaId);
  return filas.some(
    (p) => normalizarNombre(p.nombre) === norm && p.id !== exceptoId
  );
}

function validarCamposPlato(db, { categoriaId, nombre, precioCentimos, descripcion, sinAlergenos, alergenos }, exceptoId = null) {
  const limpio = String(nombre ?? '').trim();
  if (!limpio) throw new ErrorValidacion('El nombre del plato es obligatorio.');

  if (!Number.isInteger(precioCentimos) || precioCentimos <= 0) {
    throw new ErrorValidacion('El precio es obligatorio y debe ser mayor que 0.');
  }

  if (descripcion != null && String(descripcion).length > MAX_DESCRIPCION) {
    throw new ErrorValidacion(
      `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`
    );
  }

  const decl = validarDeclaracionAlergenos({ sinAlergenos, alergenos });
  if (!decl.ok) throw new ErrorValidacion(decl.error);

  if (nombrePlatoEnUso(db, categoriaId, limpio, exceptoId)) {
    throw new ErrorValidacion('Ya existe un plato con ese nombre en la categoría.');
  }
}

export function crearPlato(db, { categoriaId, nombre, precioCentimos, descripcion = null, fotoRuta = null, sinAlergenos = false, alergenos = [] }) {
  const cat = obtenerCategoria(db, categoriaId);
  if (!cat) throw new ErrorValidacion('La categoría indicada no existe.');

  validarCamposPlato(db, { categoriaId, nombre, precioCentimos, descripcion, sinAlergenos, alergenos });

  const tx = db.transaction(() => {
    const maxOrden = db
      .prepare('SELECT COALESCE(MAX(orden), -1) AS m FROM platos WHERE categoria_id = ?')
      .get(categoriaId).m;
    const info = db
      .prepare(
        `INSERT INTO platos (categoria_id, nombre, descripcion, precio_centimos, foto_ruta, sin_alergenos, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        categoriaId,
        String(nombre).trim(),
        descripcion,
        precioCentimos,
        fotoRuta,
        sinAlergenos ? 1 : 0,
        maxOrden + 1
      );
    const platoId = info.lastInsertRowid;
    for (const a of alergenos) {
      db.prepare('INSERT INTO platos_alergenos (plato_id, alergeno) VALUES (?, ?)').run(platoId, a);
    }
    return platoId;
  });
  const platoId = tx();
  return obtenerPlato(db, platoId);
}

export function editarPlato(db, id, cambios) {
  const plato = obtenerPlato(db, id);
  if (!plato) throw new ErrorValidacion('El plato no existe.');

  const nuevo = {
    categoriaId: cambios.categoriaId ?? plato.categoria_id,
    nombre: cambios.nombre ?? plato.nombre,
    precioCentimos: cambios.precioCentimos ?? plato.precio_centimos,
    descripcion: cambios.descripcion !== undefined ? cambios.descripcion : plato.descripcion,
    fotoRuta: cambios.fotoRuta !== undefined ? cambios.fotoRuta : plato.foto_ruta,
    sinAlergenos: cambios.sinAlergenos !== undefined ? cambios.sinAlergenos : Boolean(plato.sin_alergenos),
    alergenos: cambios.alergenos !== undefined ? cambios.alergenos : alergenosDePlato(db, id),
  };

  validarCamposPlato(db, nuevo, id);

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE platos SET categoria_id = ?, nombre = ?, descripcion = ?, precio_centimos = ?, foto_ruta = ?, sin_alergenos = ? WHERE id = ?`
    ).run(
      nuevo.categoriaId,
      String(nuevo.nombre).trim(),
      nuevo.descripcion,
      nuevo.precioCentimos,
      nuevo.fotoRuta,
      nuevo.sinAlergenos ? 1 : 0,
      id
    );
    if (cambios.alergenos !== undefined || cambios.sinAlergenos !== undefined) {
      db.prepare('DELETE FROM platos_alergenos WHERE plato_id = ?').run(id);
      for (const a of nuevo.alergenos) {
        db.prepare('INSERT INTO platos_alergenos (plato_id, alergeno) VALUES (?, ?)').run(id, a);
      }
    }
  });
  tx();
  return obtenerPlato(db, id);
}

export function reordenarPlatos(db, categoriaId, idsEnOrden) {
  const tx = db.transaction((ids) => {
    ids.forEach((id, indice) => {
      db.prepare('UPDATE platos SET orden = ? WHERE id = ? AND categoria_id = ?').run(
        indice,
        id,
        categoriaId
      );
    });
  });
  tx(idsEnOrden);
}

export function archivarPlato(db, id, cuando = new Date().toISOString()) {
  const plato = obtenerPlato(db, id);
  if (!plato) throw new ErrorValidacion('El plato no existe.');
  db.prepare('UPDATE platos SET archivado_en = ? WHERE id = ?').run(cuando, id);
  return obtenerPlato(db, id);
}

export function obtenerPlato(db, id) {
  return db.prepare('SELECT * FROM platos WHERE id = ?').get(id) ?? null;
}

export function alergenosDePlato(db, platoId) {
  return db
    .prepare('SELECT alergeno FROM platos_alergenos WHERE plato_id = ? ORDER BY alergeno')
    .all(platoId)
    .map((f) => f.alergeno);
}
