/**
 * Formatea una fecha en formato español: dd/mm/aaaa
 */
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Devuelve la fecha ISO (YYYY-MM-DD) de hoy.
 */
export function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Suma días a una fecha ISO y devuelve otra fecha ISO.
 */
export function sumarDias(fechaISO: string, dias: number): string {
  const fecha = new Date(fechaISO)
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().split('T')[0]
}

/**
 * Devuelve el año actual como número.
 */
export function anioActual(): number {
  return new Date().getFullYear()
}

/**
 * Formatea fecha ISO a formato español.
 */
export function isoAEspanol(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split('-')
  return `${dia}/${mes}/${anio}`
}

/**
 * Devuelve la fecha LOCAL del equipo en formato AAAA-MM-DD (no UTC).
 * Se usa para el nombre del .zip de exportación (RF-006), evitando el desfase
 * de día que introduciría toISOString() (que usa UTC).
 */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
