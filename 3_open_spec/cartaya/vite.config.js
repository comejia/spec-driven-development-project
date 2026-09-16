import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build a estáticos servidos por Express desde frontend/dist.
export default defineConfig({
  root: path.join(__dirname, 'frontend'),
  plugins: [react()],
  build: {
    outDir: path.join(__dirname, 'frontend', 'dist'),
    emptyOutDir: true,
  },
  server: {
    // En desarrollo, proxy al backend Express.
    proxy: {
      '/api': 'http://localhost:3000',
      '/fotos': 'http://localhost:3000',
    },
  },
});
