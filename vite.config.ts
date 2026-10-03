import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Pasta com versão: trocar o nome força todo navegador a baixar cópias
    // novas (um arquivo com defeito guardado no navegador some de vez).
    rollupOptions: {
      output: {
        entryFileNames: 'assets/r2/[name]-[hash].js',
        chunkFileNames: 'assets/r2/[name]-[hash].js',
        assetFileNames: 'assets/r2/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
