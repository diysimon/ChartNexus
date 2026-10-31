import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        playground: resolve(import.meta.dirname, 'index.html'),
        openui: resolve(import.meta.dirname, 'openui.html'),
        cosui: resolve(import.meta.dirname, 'cosui.html'),
        marklang: resolve(import.meta.dirname, 'marklang.html'),
        a2ui: resolve(import.meta.dirname, 'a2ui.html'),
      },
    },
  },
});
