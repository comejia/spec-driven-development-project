/**
 * Catálogo de la clínica de demostración (Principio 5, FR-021, D6).
 *
 * Estos datos son la referencia que specs, ejemplos y pruebas pueden citar: la semilla y
 * las pruebas de integración usan exactamente el mismo catálogo.
 */

export const CLINICA_DEMO = {
  nombre: 'Clínica Eleva',
  /** Clave de panel por defecto de la demostración; se guarda siempre hasheada (D5). */
  clavePorDefecto: 'eleva2026',
  /** Teléfono de contacto que se muestra al paciente dentro de la ventana (005 FR-008). */
  telefono: '910 123 456',
} as const;

export const PROFESIONALES_DEMO = [
  { nombre: 'María Ferrer', especialidad: 'Fisioterapia' },
  { nombre: 'Jorge Nieto', especialidad: 'Fisioterapia' },
  { nombre: 'Lucía Prados', especialidad: 'Nutrición' },
] as const;

/**
 * Importes en céntimos: nunca coma flotante para dinero (D2, FR-019).
 * Catálogo literal de la spec (sección "Datos de demostración"): 40,00 €, 50,00 €,
 * 35,00 € y 45,00 €.
 */
export const SERVICIOS_DEMO = [
  { nombre: 'Sesión de fisioterapia', duracionMin: 45, precioCentimos: 4000 },
  { nombre: 'Primera visita de fisioterapia', duracionMin: 60, precioCentimos: 5000 },
  { nombre: 'Consulta de nutrición', duracionMin: 30, precioCentimos: 3500 },
  { nombre: 'Primera visita de nutrición', duracionMin: 45, precioCentimos: 4500 },
] as const;

/** Servicios que presta cada especialidad. */
export const SERVICIOS_POR_ESPECIALIDAD: Record<string, string[]> = {
  Fisioterapia: ['Sesión de fisioterapia', 'Primera visita de fisioterapia'],
  Nutrición: ['Consulta de nutrición', 'Primera visita de nutrición'],
};

/** Nombres y apellidos españoles para generar pacientes de demostración (Principio 8). */
export const NOMBRES_DEMO = [
  'Lucía',
  'Martín',
  'Sofía',
  'Hugo',
  'Carmen',
  'Mateo',
  'Paula',
  'Diego',
  'Alba',
  'Pablo',
  'Elena',
  'Álvaro',
  'Marta',
  'Adrián',
  'Nerea',
  'Sergio',
  'Irene',
  'Javier',
  'Claudia',
  'Rubén',
] as const;

export const APELLIDOS_DEMO = [
  'García',
  'Fernández',
  'Rodríguez',
  'López',
  'Martínez',
  'Sánchez',
  'Pérez',
  'Gómez',
  'Ruiz',
  'Díaz',
  'Moreno',
  'Álvarez',
  'Romero',
  'Navarro',
  'Torres',
  'Domínguez',
  'Vázquez',
  'Ramos',
  'Gil',
  'Serrano',
] as const;
