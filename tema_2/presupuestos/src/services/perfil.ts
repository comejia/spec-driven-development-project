import type { Perfil } from '../types'
import { getItem, setItem } from '../storage/storage'

const STORAGE_KEY = 'perfil'

export function cargarPerfil(): Perfil | null {
  return getItem<Perfil>(STORAGE_KEY)
}

export function guardarPerfil(perfil: Perfil): void {
  setItem(STORAGE_KEY, perfil)
}

export function esPerfilCompleto(perfil: Perfil | null): boolean {
  if (!perfil) return false
  return (
    perfil.nombre.trim() !== '' &&
    perfil.nif.trim() !== '' &&
    perfil.direccion.trim() !== '' &&
    perfil.telefono.trim() !== '' &&
    perfil.email.trim() !== '' &&
    perfil.logo.trim() !== ''
  )
}

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

export function validarLogo(file: File): Promise<{ valido: boolean; error?: string; dataUrl?: string }> {
  return new Promise((resolve) => {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      resolve({ valido: false, error: 'El logo debe ser PNG o JPG' })
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      resolve({ valido: false, error: 'El logo no debe superar 2MB' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      resolve({ valido: true, dataUrl: reader.result as string })
    }
    reader.onerror = () => {
      resolve({ valido: false, error: 'Error al leer el archivo' })
    }
    reader.readAsDataURL(file)
  })
}
