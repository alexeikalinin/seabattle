import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      input: {
        screen: fileURLToPath(new URL('./screen.html', import.meta.url)),
        controller: fileURLToPath(new URL('./controller.html', import.meta.url)),
        simulator: fileURLToPath(new URL('./simulator.html', import.meta.url)),
      },
      external: ['airconsole'],
    },
  },
});
