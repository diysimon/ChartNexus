import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        quickstart: resolve(import.meta.dirname, 'quickstart.html'),
        performance: resolve(import.meta.dirname, 'performance.html'),
        expansion: resolve(import.meta.dirname, 'expansion.html'),
        quality: resolve(import.meta.dirname, 'quality.html'),
        playground: resolve(import.meta.dirname, 'index.html'),
        core02: resolve(import.meta.dirname, 'core-02.html'),
        chat: resolve(import.meta.dirname, 'chat.html'),
        openui: resolve(import.meta.dirname, 'openui.html'),
        cosui: resolve(import.meta.dirname, 'cosui.html'),
        marklang: resolve(import.meta.dirname, 'marklang.html'),
        a2ui: resolve(import.meta.dirname, 'a2ui.html'),
        a2uiOrdered: resolve(import.meta.dirname, 'a2ui-ordered.html'),
        orderedProtocols: resolve(
          import.meta.dirname,
          'ordered-protocols.html',
        ),
      },
    },
  },
});
