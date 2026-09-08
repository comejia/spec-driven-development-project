import React, { useEffect, useMemo, useState } from 'react';

// Etiquetas legibles de los 14 alérgenos UE (compartidas con la carta pública).
const ETIQUETAS_ALERGENOS = {
  gluten: 'Gluten',
  crustaceos: 'Crustáceos',
  huevos: 'Huevos',
  pescado: 'Pescado',
  cacahuetes: 'Cacahuetes',
  soja: 'Soja',
  lacteos: 'Lácteos',
  frutos_de_cascara: 'Frutos de cáscara',
  apio: 'Apio',
  mostaza: 'Mostaza',
  granos_de_sesamo: 'Granos de sésamo',
  sulfitos: 'Sulfitos',
  altramuces: 'Altramuces',
  moluscos: 'Moluscos',
};

const MAX_NOTA = 140;

function Alergenos({ sinAlergenos, alergenos }) {
  if (sinAlergenos) return <p className="alergenos alergenos--sin">Sin alérgenos</p>;
  return (
    <p className="alergenos">
      <span className="alergenos__etiqueta">Contiene:</span>{' '}
      {alergenos.map((a) => ETIQUETAS_ALERGENOS[a] ?? a).join(', ')}
    </p>
  );
}

// Un plato de la carta con controles para añadirlo al pedido: cantidad (entero > 0)
// y nota opcional con contador y tope de 140 caracteres.
function PlatoPedible({ plato, enPedido, onAgregar, onCambiarCantidad, onCambiarNota, onQuitar }) {
  const nota = enPedido?.nota ?? '';
  return (
    <li className="plato">
      {plato.foto && (
        <img className="plato__foto" src={plato.foto} alt={plato.nombre} loading="lazy" />
      )}
      <div className="plato__cuerpo">
        <div className="plato__cabecera">
          <h3 className="plato__nombre">{plato.nombre}</h3>
          <span className="plato__precio">{plato.precio}</span>
        </div>
        {plato.descripcion && <p className="plato__descripcion">{plato.descripcion}</p>}
        <Alergenos sinAlergenos={plato.sinAlergenos} alergenos={plato.alergenos} />

        {!enPedido ? (
          <button type="button" onClick={() => onAgregar(plato)}>
            Añadir al pedido
          </button>
        ) : (
          <div className="pedido-controles">
            <label htmlFor={`cant-${plato.id}`}>Cantidad</label>
            <input
              id={`cant-${plato.id}`}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={enPedido.cantidad}
              onChange={(e) => onCambiarCantidad(plato.id, e.target.value)}
            />
            <label htmlFor={`nota-${plato.id}`}>Nota (opcional)</label>
            <textarea
              id={`nota-${plato.id}`}
              maxLength={MAX_NOTA}
              placeholder="p. ej. sin cebolla"
              value={nota}
              onChange={(e) => onCambiarNota(plato.id, e.target.value)}
            />
            <p className="pedido-contador" aria-live="polite">
              {nota.length}/{MAX_NOTA}
            </p>
            <button type="button" className="secundario" onClick={() => onQuitar(plato.id)}>
              Quitar del pedido
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function Pedido({ token }) {
  const [carta, setCarta] = useState(null);
  const [mesa, setMesa] = useState(null);
  const [error, setError] = useState(null);
  const [mesaInvalida, setMesaInvalida] = useState(false);

  // Estado del "carrito" en el cliente: platoId -> { cantidad, nota }.
  const [seleccion, setSeleccion] = useState({});
  const [vista, setVista] = useState('carta'); // 'carta' | 'resumen' | 'confirmado'
  const [resumen, setResumen] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);

  // Resuelve la mesa por su token y carga la carta.
  useEffect(() => {
    fetch(`/api/mesa/${encodeURIComponent(token)}`)
      .then((r) => {
        if (r.status === 404) {
          setMesaInvalida(true);
          return null;
        }
        return r.json();
      })
      .then((m) => m && setMesa(m))
      .catch(() => setError('No se pudo identificar la mesa.'));

    fetch('/api/carta')
      .then((r) => r.json())
      .then(setCarta)
      .catch(() => setError('No se pudo cargar la carta.'));
  }, [token]);

  const lineas = useMemo(
    () =>
      Object.entries(seleccion).map(([platoId, l]) => ({
        platoId: Number(platoId),
        cantidad: Number(l.cantidad),
        nota: l.nota || undefined,
      })),
    [seleccion]
  );

  function agregar(plato) {
    setSeleccion((s) => ({ ...s, [plato.id]: { cantidad: 1, nota: '' } }));
  }
  function cambiarCantidad(platoId, valor) {
    // Solo enteros > 0; se ignora cualquier otro valor (la UI impide 0/negativo).
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) return;
    setSeleccion((s) => ({ ...s, [platoId]: { ...s[platoId], cantidad: n } }));
  }
  function cambiarNota(platoId, valor) {
    const nota = valor.slice(0, MAX_NOTA);
    setSeleccion((s) => ({ ...s, [platoId]: { ...s[platoId], nota } }));
  }
  function quitar(platoId) {
    setSeleccion((s) => {
      const copia = { ...s };
      delete copia[platoId];
      return copia;
    });
  }

  async function irAlResumen() {
    setError(null);
    const res = await fetch('/api/pedidos/preparar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lineas }),
    });
    if (!res.ok) {
      setError('No se pudo preparar el resumen del pedido.');
      return;
    }
    setResumen(await res.json());
    setVista('resumen');
  }

  async function confirmar() {
    setError(null);
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, lineas }),
    });
    if (!res.ok) {
      const cuerpo = await res.json().catch(() => ({}));
      setError(cuerpo.error ?? 'No se pudo confirmar el pedido.');
      return;
    }
    setConfirmacion(await res.json());
    setSeleccion({});
    setVista('confirmado');
  }

  if (mesaInvalida) {
    return (
      <main className="carta">
        <p role="alert">Esta mesa no es válida. Escanea de nuevo el código QR de tu mesa.</p>
      </main>
    );
  }
  if (error && !carta) return <main className="carta"><p role="alert">{error}</p></main>;
  if (!carta) return <main className="carta"><p>Cargando la carta…</p></main>;

  // Pantalla final: número de pedido y estado (sin datos personales).
  if (vista === 'confirmado' && confirmacion) {
    return (
      <main className="carta">
        <header className="carta__cabecera">
          <h1>La Estación</h1>
          <p className="carta__subtitulo">Pedido enviado</p>
        </header>
        <section className="pedido-confirmado" aria-live="polite">
          <p className="pedido-numero">
            Tu número de pedido es <strong>#{confirmacion.numeroPedido}</strong>
          </p>
          <p className="pedido-estado">Estado: <strong>{confirmacion.estado}</strong></p>
          <p>Total: <strong>{confirmacion.total}</strong></p>
          {confirmacion.lineasRetiradas?.length > 0 && (
            <p role="alert">
              Se retiraron {confirmacion.lineasRetiradas.length} plato(s) que ya no están
              disponibles.
            </p>
          )}
          <p>Se paga en caja. ¡Gracias!</p>
          <button type="button" onClick={() => setVista('carta')}>
            Hacer otro pedido
          </button>
        </section>
      </main>
    );
  }

  // Pantalla de resumen antes de enviar.
  if (vista === 'resumen' && resumen) {
    return (
      <main className="carta">
        <header className="carta__cabecera">
          <h1>La Estación</h1>
          <p className="carta__subtitulo">
            Resumen del pedido{mesa ? ` · Mesa ${mesa.numero}` : ''}
          </p>
        </header>
        {resumen.lineasRetiradas.length > 0 && (
          <p role="alert" className="pedido-aviso">
            Algún plato ha dejado de estar disponible y se ha retirado del pedido.
          </p>
        )}
        <ul className="categoria__platos">
          {resumen.lineas.map((l) => (
            <li key={l.platoId} className="plato">
              <div className="plato__cuerpo">
                <div className="plato__cabecera">
                  <h3 className="plato__nombre">{l.cantidad} × {l.nombre}</h3>
                  <span className="plato__precio">{l.subtotal}</span>
                </div>
                {l.nota && <p className="plato__descripcion">Nota: {l.nota}</p>}
              </div>
            </li>
          ))}
        </ul>
        <p className="pedido-total"><strong>Total: {resumen.total}</strong></p>
        {error && <p role="alert">{error}</p>}
        <button type="button" onClick={confirmar} disabled={resumen.lineas.length === 0}>
          Confirmar pedido
        </button>
        <button type="button" className="secundario" onClick={() => setVista('carta')}>
          Volver a la carta
        </button>
      </main>
    );
  }

  // Vista de carta en "modo pedido".
  const hayLineas = lineas.length > 0;
  return (
    <main className="carta">
      <header className="carta__cabecera">
        <h1>La Estación</h1>
        <p className="carta__subtitulo">
          {mesa ? `Pedido · Mesa ${mesa.numero}` : 'Pedido'}
        </p>
      </header>
      {carta.categorias.length === 0 && <p>La carta aún no tiene platos.</p>}
      {carta.categorias.map((cat) => (
        <section key={cat.id} className="categoria" aria-labelledby={`cat-${cat.id}`}>
          <h2 id={`cat-${cat.id}`} className="categoria__nombre">{cat.nombre}</h2>
          <ul className="categoria__platos">
            {cat.platos.map((p) => (
              <PlatoPedible
                key={p.id}
                plato={p}
                enPedido={seleccion[p.id]}
                onAgregar={agregar}
                onCambiarCantidad={cambiarCantidad}
                onCambiarNota={cambiarNota}
                onQuitar={quitar}
              />
            ))}
          </ul>
        </section>
      ))}
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={irAlResumen} disabled={!hayLineas}>
        Ver resumen ({lineas.length})
      </button>
    </main>
  );
}
