import { defineConfig } from 'vitest/config'

// Configuración de tests aislada de vite.config.ts para evitar el desajuste de
// tipos entre vite (v8) y la copia de vite que trae vitest (v7). Vitest carga
// automáticamente los plugins de vite.config.ts en tiempo de ejecución.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
