import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Suite de integración: PostgreSQL real y efímero (Testcontainers).
// Aquí se prueban el invariante anti-solape y la concurrencia (Principio 3, D1/D7).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/setup/postgres.global.ts'],
    testTimeout: 60_000,
    hookTimeout: 180_000,
    // Un solo proceso: todas las suites comparten la misma base efímera y
    // limpian su estado entre pruebas.
    fileParallelism: false,
    env: {
      TZ: 'UTC',
    },
  },
});
