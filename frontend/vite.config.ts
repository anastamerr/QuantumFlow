import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
          if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux';
          if (id.includes('@chakra-ui') || id.includes('@emotion') || id.includes('framer-motion')) return 'vendor-chakra';
          if (id.includes('react-dnd')) return 'vendor-dnd';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('d3')) return 'vendor-d3';
          if (id.includes('react-syntax-highlighter') || id.includes('refractor') || id.includes('lowlight') || id.includes('highlight.js')) {
            return 'vendor-syntax';
          }

          return 'vendor';
        },
      },
    },
  },
})
