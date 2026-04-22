import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    // Phaser game engine chunk is inherently large (~1.5 MB); raise the limit to suppress
    // the misleading warning. All game chunks are lazy-loaded so initial load is unaffected.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'vendor-phaser';
          }
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom') ||
            (id.includes('node_modules/react/') && !id.includes('react-dom') && !id.includes('react-router'))
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@stitches')) {
            return 'vendor-stitches';
          }
        },
      },
    },
  },
});
