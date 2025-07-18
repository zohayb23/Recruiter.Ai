import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'popper.js': '@popperjs/core',
    },
  },
  optimizeDeps: {
    include: ['bootstrap', 'jquery', '@popperjs/core'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['bootstrap', 'jquery', '@popperjs/core'],
        },
      },
    },
  },
});
