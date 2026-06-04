import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['meizoLogo.jpeg', 'meizoLogoL.jpeg', 'apple-touch-icon.png'],
      manifest: {
        name: 'meizo',
        short_name: 'meizo',
        description: 'Reinigungsmanagement für Chef und Mitarbeiter',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0F172A',
        orientation: 'portrait',
        lang: 'de',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Cache app shell + static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Inject the push event handler into the generated SW
        importScripts: ['/sw-push.js'],
        // Network-first for API calls, cache-first for assets
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
