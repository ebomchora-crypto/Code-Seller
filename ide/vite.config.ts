import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// "cloud": a IDE publicada no site (em /ide/, com os sites do Code Maker). Padrão: IDE local/instalada.
export default defineConfig(({ mode }) => {
  const cloud = mode === 'cloud';
  return {
    base: cloud ? '/ide/' : '/',
    plugins: [react(), tailwindcss()],
    define: { 'import.meta.env.VITE_IDE_MODE': JSON.stringify(cloud ? 'cloud' : 'local') },
    build: cloud ? { outDir: '../public/ide', emptyOutDir: true } : undefined,
    server: { host: '127.0.0.1', fs: { allow: ['..'] }, watch: { ignored: ['**/.code-makers/**', '**/tests/**'] }, proxy: { '/api': { target: 'http://127.0.0.1:4317', ws: true } } },
    preview: { host: '127.0.0.1', proxy: { '/api': { target: 'http://127.0.0.1:4317', ws: true } } },
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  };
});
