import { defineConfig } from 'vite';
import { ollamaProxy } from './ollama-proxy.mjs';

export default defineConfig({
  plugins: [ollamaProxy()],
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
});
