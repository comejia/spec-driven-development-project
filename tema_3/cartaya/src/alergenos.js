// Catálogo cerrado de los 14 alérgenos de declaración obligatoria (normativa UE,
// Reglamento (UE) 1169/2011). Se identifican por un código estable en español.
export const ALERGENOS_UE = Object.freeze([
  'gluten',
  'crustaceos',
  'huevos',
  'pescado',
  'cacahuetes',
  'soja',
  'lacteos',
  'frutos_de_cascara',
  'apio',
  'mostaza',
  'granos_de_sesamo',
  'sulfitos',
  'altramuces',
  'moluscos',
]);

const CATALOGO = new Set(ALERGENOS_UE);

export function esAlergenoValido(codigo) {
  return CATALOGO.has(codigo);
}

/**
 * Valida la declaración de alérgenos de un plato.
 *
 * Estados válidos:
 *  - sin_alergenos = true  y  lista vacía  ("sin alérgenos" declarado)
 *  - sin_alergenos = false y  >=1 alérgeno del catálogo UE
 *
 * Estado inválido (rechazado): "sin información" (ni declaración explícita
 * de ausencia ni lista de alérgenos).
 *
 * @param {{ sinAlergenos: boolean, alergenos?: string[] }} declaracion
 * @returns {{ ok: boolean, error?: string }}
 */
export function validarDeclaracionAlergenos({ sinAlergenos, alergenos = [] } = {}) {
  const lista = Array.isArray(alergenos) ? alergenos : [];

  if (sinAlergenos === true) {
    if (lista.length > 0) {
      return {
        ok: false,
        error: 'Un plato "sin alérgenos" no puede tener alérgenos declarados.',
      };
    }
    return { ok: true };
  }

  if (sinAlergenos === false) {
    if (lista.length === 0) {
      return {
        ok: false,
        error:
          'Debe declarar al menos un alérgeno o marcar el plato como "sin alérgenos".',
      };
    }
    const invalidos = lista.filter((a) => !esAlergenoValido(a));
    if (invalidos.length > 0) {
      return {
        ok: false,
        error: `Alérgenos no reconocidos: ${invalidos.join(', ')}.`,
      };
    }
    // Duplicados
    if (new Set(lista).size !== lista.length) {
      return { ok: false, error: 'Hay alérgenos duplicados en la declaración.' };
    }
    return { ok: true };
  }

  // Estado "sin información": no se declaró ni ausencia ni presencia.
  return {
    ok: false,
    error:
      'Falta la información de alérgenos: declare los alérgenos o marque "sin alérgenos".',
  };
}
