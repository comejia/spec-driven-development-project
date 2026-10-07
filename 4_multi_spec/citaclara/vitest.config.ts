import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Suite unitaria: dominio puro (sin base de datos ni navegador).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    // Zona horaria del proceso distinta de la de negocio: obliga a que el código
    // use explícitamente Europe/Madrid (D3) y no la zona del host.
    env: {
      TZ: 'UTC',
    },
  },
});
