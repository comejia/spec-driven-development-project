import React, { useEffect, useState } from 'react';

// Etiquetas legibles en español para los 14 alérgenos UE.
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

function Alergenos({ sinAlergenos, alergenos }) {
  // Los alérgenos SIEMPRE se muestran de forma visible (obligación legal).
  if (sinAlergenos) {
    return <p className="alergenos alergenos--sin">Sin alérgenos</p>;
  }
  return (
    <p className="alergenos">
      <span className="alergenos__etiqueta">Contiene:</span>{' '}
      {alergenos.map((a) => ETIQUETAS_ALERGENOS[a] ?? a).join(', ')}
    </p>
  );
}

function Plato({ plato }) {
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
      </div>
    </li>
  );
}

export default function Carta() {
  const [carta, setCarta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/carta')
      .then((r) => r.json())
      .then(setCarta)
      .catch(() => setError('No se pudo cargar la carta.'));
  }, []);

  if (error) return <main className="carta"><p role="alert">{error}</p></main>;
  if (!carta) return <main className="carta"><p>Cargando la carta…</p></main>;

  return (
    <main className="carta">
      <header className="carta__cabecera">
        <h1>La Estación</h1>
        <p className="carta__subtitulo">Nuestra carta</p>
      </header>
      {carta.categorias.length === 0 && <p>La carta aún no tiene platos.</p>}
      {carta.categorias.map((cat) => (
        <section key={cat.id} className="categoria" aria-labelledby={`cat-${cat.id}`}>
          <h2 id={`cat-${cat.id}`} className="categoria__nombre">{cat.nombre}</h2>
          <ul className="categoria__platos">
            {cat.platos.map((p) => (
              <Plato key={p.id} plato={p} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
