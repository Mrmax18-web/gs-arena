/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');
          if (normalizedId.includes('node_modules/xlsx')) {
            return 'vendor-xlsx';
          }
          if (
            normalizedId.includes('node_modules/firebase') ||
            normalizedId.includes('node_modules/@firebase')
          ) {
            return 'firebase';
          }
          if (
            normalizedId.includes('node_modules/react') ||
            normalizedId.includes('node_modules/react-dom') ||
            normalizedId.includes('node_modules/react-router') ||
            normalizedId.includes('node_modules/scheduler')
          ) {
            return 'react';
          }
          if (normalizedId.includes('node_modules/lucide-react')) {
            return 'lucide-react';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
