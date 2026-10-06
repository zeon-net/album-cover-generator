import { defineConfig } from 'vitest/config';

// The library build. The demo page has its own config in demo/.
export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'album-cover-generator.js' },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    // The library draws SVG as text, so it needs no DOM; only raster.ts touches the browser.
    environment: 'node',
  },
});
