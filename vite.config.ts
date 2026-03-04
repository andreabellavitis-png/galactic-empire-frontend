// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxying REST calls to backend in dev (evita CORS)
      '/auth':      'http://localhost:4000',
      '/empires':   'http://localhost:4000',
      '/systems':   'http://localhost:4000',
      '/planets':   'http://localhost:4000',
      '/fleets':    'http://localhost:4000',
      '/diplomacy': 'http://localhost:4000',
      '/control':   'http://localhost:4000',
      // WebSocket proxy
      '/socket.io': {
        target:    'http://localhost:4000',
        ws:        true,
        changeOrigin: true,
      },
    },
  },
  define: {
    // Con il proxy non servono le variabili VITE_API_URL/WS_URL in dev
    // Ma le teniamo per deploy separato
  },
});
