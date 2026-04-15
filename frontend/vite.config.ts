import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Propellex – HNI Real Estate',
        short_name: 'Propellex',
        description: 'Premium real estate investment platform for HNI investors',
        theme_color: '#1E3A5F',
        background_color: '#0F2040',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // API responses — network-first, 24 h cache
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          // Map tiles — cache-first, 7 days
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('tile.openstreetmap.org') ||
              url.hostname.includes('maps.googleapis.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          // Google Fonts
          {
            urlPattern: ({ url }) =>
              url.hostname === 'fonts.googleapis.com' ||
              url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Images from API / CDN
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
