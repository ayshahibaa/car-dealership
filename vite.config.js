import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // cars.json (~840 kB, ~100 kB gzipped) is loaded as its own chunk on demand
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    open: false,
  },
});
