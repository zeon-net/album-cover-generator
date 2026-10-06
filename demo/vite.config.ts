import { defineConfig } from 'vite';

// The demo generator page: `npm run dev` from the package root, then open the printed address.
export default defineConfig({
  root: 'demo',
  base: './',
  server: { port: 5180 },
  build: { outDir: 'dist', emptyOutDir: true },
});
