import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `pg` y `bcryptjs` son dependencias de servidor: no deben empaquetarse para el cliente.
  serverExternalPackages: ['pg', 'bcryptjs'],
};

export default nextConfig;
