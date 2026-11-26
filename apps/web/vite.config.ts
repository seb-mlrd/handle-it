import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { landingRoute } from './landing-route';

// Les tests E2E lancent leur propre API sur un autre port.
const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';
const proxy = { '/api': { target: API_URL, ws: true } };

export default defineConfig({
  // Un cache à part évite de perturber un `pnpm dev` déjà lancé.
  cacheDir: process.env['VITE_CACHE_DIRECTORY'] ?? 'node_modules/.vite',
  plugins: [react(), tailwindcss(), landingRoute()],
  // Chargé à la demande : sans cette déclaration, Vite l'optimiserait à la première ouverture d'un
  // board et rechargerait la page en mode développement.
  optimizeDeps: { include: ['socket.io-client'] },
  server: { port: 5173, strictPort: true, proxy },
  preview: { strictPort: true, proxy },
});
