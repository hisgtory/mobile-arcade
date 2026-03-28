import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/games/crunch3/v1/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
