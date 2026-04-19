import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Disable service worker in dev mode
    proxy: {
      '/sw.js': {
        target: 'http://localhost:5173',
        rewrite: () => '',
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, _req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end('// SW disabled in dev mode');
          });
        }
      }
    }
  }
})
