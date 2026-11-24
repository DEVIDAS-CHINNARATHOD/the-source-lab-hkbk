import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  publicDir: 'site',
  plugins: [tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: {
    outDir: 'dist/client',
    cssCodeSplit: false,
    rollupOptions: {
      input: 'hero.tsx',
      output: {
        entryFileNames: 'assets/ui/hero.js',
        assetFileNames: asset => asset.names.some(name => name.endsWith('.css')) ? 'assets/ui/hero.css' : 'assets/ui/[name]-[hash][extname]'
      }
    }
  }
});
