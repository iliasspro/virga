import { defineConfig } from 'vite';
import { renderHtml } from './src/render.js';

export default defineConfig({
  server: { host: '127.0.0.1', port: 5173 },
  build: { target: 'es2020', assetsInlineLimit: 4096 },
  plugins: [
    {
      name: 'virga-html',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => renderHtml(html),
      },
    },
  ],
});
