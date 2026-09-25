import type { ProveedorEnlaceAcceso } from './proveedor-enlace';

/**
 * Stub del proveedor de enlace de acceso (D4, T025), para usar MIENTRAS 005 no esté integrada.
 *
 * 005 es la propietaria del enlace `/p/[token]`: emite y valida el token estable por paciente.
 * Este stub NO emite un token real; construye un enlace determinista y reproducible a partir
 * de la URL base y el `pacienteId`, suficiente para validar ventana/idempotencia/.eml. Cuando
 * 005 se integre, se sustituye por su proveedor real sin tocar el proceso.
 */
export class ProveedorEnlaceStub implements ProveedorEnlaceAcceso {
  constructor(private readonly urlBaseAcceso: string) {}

  enlaceDeAcceso(pacienteId: string): Promise<string> {
    const base = this.urlBaseAcceso.replace(/\/+$/, '');
    // Token de marcador (no criptográfico): 005 lo reemplazará por su token real.
    return Promise.resolve(`${base}/${pacienteId}`);
  }
}
