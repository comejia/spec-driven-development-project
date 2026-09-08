// Construcción de la carta pública y del catálogo de administración.
// El precio se almacena en céntimos con IVA incluido y se formatea a euros.

/** Formatea un precio en céntimos a euros con IVA incluido, p. ej. 250 -> "2,50 €". */
export function formatearPrecioEuros(precioCentimos) {
  const euros = precioCentimos / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

function mapearPlato(p, alergenos) {
  const sinAlergenos = Boolean(p.sin_alergenos);
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? null,
    precioCentimos: p.precio_centimos,
    precio: formatearPrecioEuros(p.precio_centimos),
    foto: p.foto_ruta ? `/fotos/${p.foto_ruta}` : null,
    // Alérgenos SIEMPRE presentes: o lista de presentes, o sinAlergenos=true.
    sinAlergenos,
    alergenos: sinAlergenos ? [] : alergenos,
  };
}

/**
 * Devuelve la carta pública como estructura JSON-serializable.
 * No embebe binarios de imagen: la foto es una ruta/URL relativa servida como estático.
 * Regla de la carta pública: se omiten las categorías sin platos activos.
 */
export function construirCarta(db) {
  const categorias = db
    .prepare(
      'SELECT id, nombre, orden FROM categorias WHERE archivada_en IS NULL ORDER BY orden ASC, id ASC'
    )
    .all();

  const platosStmt = db.prepare(
    `SELECT id, nombre, descripcion, precio_centimos, foto_ruta, sin_alergenos, orden
     FROM platos
     WHERE categoria_id = ? AND archivado_en IS NULL
     ORDER BY orden ASC, id ASC`
  );
  const alergenosStmt = db.prepare(
    'SELECT alergeno FROM platos_alergenos WHERE plato_id = ? ORDER BY alergeno ASC'
  );

  const resultado = [];
  for (const cat of categorias) {
    const platos = platosStmt
      .all(cat.id)
      .map((p) => mapearPlato(p, alergenosStmt.all(p.id).map((f) => f.alergeno)));

    // Las categorías sin platos activos no se muestran en la carta pública.
    if (platos.length === 0) continue;

    resultado.push({ id: cat.id, nombre: cat.nombre, platos });
  }

  return { categorias: resultado };
}

/**
 * Devuelve el catálogo completo para la administración: TODAS las categorías
 * no archivadas (tengan platos o no) con sus platos no archivados. A diferencia
 * de la carta pública, NO omite las categorías vacías, para que el dueño pueda
 * añadirles platos.
 */
export function construirCatalogoAdmin(db) {
  const categorias = db
    .prepare(
      'SELECT id, nombre, orden FROM categorias WHERE archivada_en IS NULL ORDER BY orden ASC, id ASC'
    )
    .all();

  const platosStmt = db.prepare(
    `SELECT id, nombre, descripcion, precio_centimos, foto_ruta, sin_alergenos, orden
     FROM platos
     WHERE categoria_id = ? AND archivado_en IS NULL
     ORDER BY orden ASC, id ASC`
  );
  const alergenosStmt = db.prepare(
    'SELECT alergeno FROM platos_alergenos WHERE plato_id = ? ORDER BY alergeno ASC'
  );

  const resultado = categorias.map((cat) => ({
    id: cat.id,
    nombre: cat.nombre,
    orden: cat.orden,
    platos: platosStmt
      .all(cat.id)
      .map((p) => mapearPlato(p, alergenosStmt.all(p.id).map((f) => f.alergeno))),
  }));

  return { categorias: resultado };
}
