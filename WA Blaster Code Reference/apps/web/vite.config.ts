import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Listen on all interfaces and accept the ngrok hostname so the dev server can be
    // reached from other machines via a tunnel. Vite 5.4+ blocks unknown Host headers
    // ("This host is not allowed") unless they're listed here. The proxy keeps /api
    // same-origin (the SPA calls a relative /api), so no CORS/cookie changes are needed.
    host: true,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
