import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    watch: {
      // Ignore screenshot/test artefacts so HMR doesn't reload when PNGs are saved
      ignored: ['**/*.png', '**/*.jpg', '**/.playwright-mcp/**'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        screen: fileURLToPath(new URL('./screen.html', import.meta.url)),
        controller: fileURLToPath(new URL('./controller.html', import.meta.url)),
        simulator: fileURLToPath(new URL('./simulator.html', import.meta.url)),
      },
      external: ['airconsole'],
    },
  },
});
