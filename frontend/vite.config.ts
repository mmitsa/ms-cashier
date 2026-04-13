import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Increase the warning threshold to a sensible level for an admin app.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Manual chunk splitting: keep the runtime chunk small by isolating
        // heavy/independent libraries into their own files. Browsers can then
        // cache them separately and load them on demand.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', 'axios', 'zustand'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast', 'clsx', 'tailwind-merge'],
          'charts-vendor': ['chart.js'],
        },
      },
    },
  },
});
