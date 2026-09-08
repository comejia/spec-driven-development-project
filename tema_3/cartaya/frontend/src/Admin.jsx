import React, { useEffect, useState, useCallback } from 'react';

const ALERGENOS = [
  ['gluten', 'Gluten'],
  ['crustaceos', 'Crustáceos'],
  ['huevos', 'Huevos'],
  ['pescado', 'Pescado'],
  ['cacahuetes', 'Cacahuetes'],
  ['soja', 'Soja'],
  ['lacteos', 'Lácteos'],
  ['frutos_de_cascara', 'Frutos de cáscara'],
  ['apio', 'Apio'],
  ['mostaza', 'Mostaza'],
  ['granos_de_sesamo', 'Granos de sésamo'],
  ['sulfitos', 'Sulfitos'],
  ['altramuces', 'Altramuces'],
  ['moluscos', 'Moluscos'],
];

async function api(metodo, ruta, cuerpo) {
  const opts = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(cuerpo);
  }
  const res = await fetch(ruta, opts);
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error ?? 'Error en la operación.');
  return datos;
}

// Reordena moviendo el elemento en `indice` una posición en `dir` (-1 arriba, +1 abajo).
function mover(ids, indice, dir) {
  const destino = indice + dir;
  if (destino < 0 || destino >= ids.length) return null;
  const copia = [...ids];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}

function Login({ onEntrar }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  async function enviar(e) {
    e.preventDefault();
    try {
      await api('POST', '/api/login', { password });
      onEntrar();
    } catch {
      setError('Contraseña incorrecta.');
    }
  }
  return (
    <main className="admin">
      <h1 className="admin__titulo">Administración</h1>
      <form onSubmit={enviar}>
        <label htmlFor="pass">Contraseña de establecimiento</label>
        <input
          id="pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p role="alert">{error}</p>}
        <p><button type="submit">Entrar</button></p>
      </form>
    </main>
  );
}

// Formulario de crear o editar plato. Si recibe `plato`, actúa en modo edición.
function FormularioPlato({ categoriaId, plato, onGuardado, onCancelar, onSubirFoto }) {
  const esEdicion = !!plato;
  const [nombre, setNombre] = useState(plato?.nombre ?? '');
  const [precio, setPrecio] = useState(
    plato ? (plato.precioCentimos / 100).toFixed(2).replace('.', ',') : ''
  );
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? '');
  const [sinAlergenos, setSinAlergenos] = useState(plato?.sinAlergenos ?? false);
  const [seleccion, setSeleccion] = useState(
    () => Object.fromEntries((plato?.alergenos ?? []).map((a) => [a, true]))
  );
  const [error, setError] = useState(null);

  async function guardar(e) {
    e.preventDefault();
    setError(null);
    const alergenos = Object.entries(seleccion).filter(([, v]) => v).map(([k]) => k);
    const cuerpo = {
      nombre,
      precioCentimos: Math.round(parseFloat(precio.replace(',', '.')) * 100),
      descripcion: descripcion || null,
      sinAlergenos,
      alergenos: sinAlergenos ? [] : alergenos,
    };
    try {
      if (esEdicion) {
        await api('PUT', `/api/admin/platos/${plato.id}`, cuerpo);
      } else {
        await api('POST', '/api/admin/platos', { categoriaId, ...cuerpo });
        setNombre(''); setPrecio(''); setDescripcion(''); setSinAlergenos(false); setSeleccion({});
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={guardar} className="admin__form-plato">
      <label>Nombre del plato
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </label>
      <label>Precio (€, IVA incluido)
        <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" required />
      </label>
      <label>Descripción (opcional, máx. 200)
        <textarea maxLength={200} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={sinAlergenos} onChange={(e) => setSinAlergenos(e.target.checked)} style={{ width: 'auto', minHeight: 'auto' }} />
        {' '}Sin alérgenos
      </label>
      {!sinAlergenos && (
        <fieldset>
          <legend>Alérgenos que contiene</legend>
          {ALERGENOS.map(([codigo, etiqueta]) => (
            <label key={codigo} style={{ fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={!!seleccion[codigo]}
                onChange={(e) => setSeleccion((s) => ({ ...s, [codigo]: e.target.checked }))}
                style={{ width: 'auto', minHeight: 'auto' }}
              />{' '}{etiqueta}
            </label>
          ))}
        </fieldset>
      )}
      {error && <p role="alert">{error}</p>}
      {esEdicion && (
        <label>
          {plato.foto ? 'Cambiar foto' : 'Subir foto'} (JPG, PNG o WebP, máx. 5 MB)
          {plato.foto && <img className="plato__foto" src={plato.foto} alt={plato.nombre} />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onSubirFoto(plato.id, f);
              e.target.value = '';
            }}
          />
        </label>
      )}
      <button type="submit">{esEdicion ? 'Guardar cambios' : 'Añadir plato'}</button>
      {esEdicion && (
        <button type="button" className="secundario" onClick={onCancelar}>Cancelar</button>
      )}
    </form>
  );
}

// Nombre de categoría editable en línea.
function NombreCategoria({ categoria, onGuardado }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(categoria.nombre);
  const [error, setError] = useState(null);

  async function guardar(e) {
    e.preventDefault();
    setError(null);
    try {
      await api('PUT', `/api/admin/categorias/${categoria.id}`, { nombre });
      setEditando(false);
      onGuardado();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!editando) {
    return (
      <>
        {categoria.nombre}{' '}
        <button className="secundario" type="button" onClick={() => setEditando(true)}>Editar</button>
      </>
    );
  }
  return (
    <form onSubmit={guardar} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: 'auto' }} />
      <button type="submit">Guardar</button>
      <button type="button" className="secundario" onClick={() => { setNombre(categoria.nombre); setEditando(false); }}>Cancelar</button>
      {error && <span role="alert">{error}</span>}
    </form>
  );
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [carta, setCarta] = useState(null);
  const [nuevaCat, setNuevaCat] = useState('');
  const [error, setError] = useState(null);
  const [editandoPlato, setEditandoPlato] = useState(null); // id del plato en edición

  const recargar = useCallback(() => {
    // El admin consume el catálogo completo (incluye categorías sin platos),
    // no la carta pública (que oculta las categorías vacías).
    fetch('/api/admin/catalogo')
      .then((r) => r.json())
      .then(setCarta)
      .catch(() => setError('No se pudo cargar el catálogo.'));
  }, []);

  useEffect(() => {
    if (autenticado) recargar();
  }, [autenticado, recargar]);

  if (!autenticado) return <Login onEntrar={() => setAutenticado(true)} />;

  async function crearCategoria(e) {
    e.preventDefault();
    setError(null);
    try {
      await api('POST', '/api/admin/categorias', { nombre: nuevaCat });
      setNuevaCat('');
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function archivarPlato(id) {
    await api('POST', `/api/admin/platos/${id}/archivar`);
    recargar();
  }
  async function archivarCategoria(id) {
    await api('POST', `/api/admin/categorias/${id}/archivar`);
    recargar();
  }

  async function reordenarCategorias(indice, dir) {
    const ids = carta.categorias.map((c) => c.id);
    const nuevo = mover(ids, indice, dir);
    if (!nuevo) return;
    await api('POST', '/api/admin/categorias/reordenar', { ids: nuevo });
    recargar();
  }

  async function reordenarPlatos(categoriaId, platos, indice, dir) {
    const ids = platos.map((p) => p.id);
    const nuevo = mover(ids, indice, dir);
    if (!nuevo) return;
    await api('POST', '/api/admin/platos/reordenar', { categoriaId, ids: nuevo });
    recargar();
  }

  async function subirFoto(platoId, fichero) {
    setError(null);
    const form = new FormData();
    form.append('foto', fichero);
    const res = await fetch(`/api/admin/platos/${platoId}/foto`, { method: 'POST', body: form });
    if (!res.ok) {
      const datos = await res.json().catch(() => ({}));
      setError(datos.error ?? 'No se pudo subir la foto.');
      return;
    }
    recargar();
  }

  return (
    <main className="admin">
      <h1 className="admin__titulo">Administración de la carta</h1>

      <section>
        <h2>Nueva categoría</h2>
        <form onSubmit={crearCategoria}>
          <label htmlFor="nueva-cat">Nombre</label>
          <input id="nueva-cat" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} required />
          {error && <p role="alert">{error}</p>}
          <p><button type="submit">Crear categoría</button></p>
        </form>
      </section>

      {carta?.categorias.map((cat, ci) => (
        <section key={cat.id}>
          <h2>
            <NombreCategoria categoria={cat} onGuardado={recargar} />{' '}
            <button className="secundario" type="button" onClick={() => reordenarCategorias(ci, -1)} disabled={ci === 0} aria-label={`Subir categoría ${cat.nombre}`}>↑</button>
            <button className="secundario" type="button" onClick={() => reordenarCategorias(ci, +1)} disabled={ci === carta.categorias.length - 1} aria-label={`Bajar categoría ${cat.nombre}`}>↓</button>{' '}
            <button className="secundario" type="button" onClick={() => archivarCategoria(cat.id)}>
              Archivar categoría
            </button>
          </h2>
          <ul className="categoria__platos">
            {cat.platos.map((p, pi) => (
              <li key={p.id} className="plato">
                {p.foto && (
                  <img className="plato__foto" src={p.foto} alt={p.nombre} />
                )}
                <div className="plato__cuerpo">
                  <div className="plato__cabecera">
                    <span className="plato__nombre">{p.nombre}</span>
                    <span className="plato__precio">{p.precio}</span>
                  </div>

                  {editandoPlato === p.id ? (
                    <FormularioPlato
                      plato={p}
                      onGuardado={() => { setEditandoPlato(null); recargar(); }}
                      onCancelar={() => setEditandoPlato(null)}
                      onSubirFoto={subirFoto}
                    />
                  ) : (
                    <div className="plato__acciones">
                      <button type="button" onClick={() => setEditandoPlato(p.id)}>Editar</button>
                      <button className="secundario" type="button" onClick={() => reordenarPlatos(cat.id, cat.platos, pi, -1)} disabled={pi === 0} aria-label={`Subir plato ${p.nombre}`}>↑</button>
                      <button className="secundario" type="button" onClick={() => reordenarPlatos(cat.id, cat.platos, pi, +1)} disabled={pi === cat.platos.length - 1} aria-label={`Bajar plato ${p.nombre}`}>↓</button>
                      <button className="secundario" type="button" onClick={() => archivarPlato(p.id)}>
                        Archivar plato
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <h3>Añadir plato a {cat.nombre}</h3>
          <FormularioPlato categoriaId={cat.id} onGuardado={recargar} />
        </section>
      ))}
    </main>
  );
}
