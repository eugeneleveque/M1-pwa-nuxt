// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pages: true,

  runtimeConfig: {
    public: {
      chatServerUrl: process.env.NUXT_PUBLIC_CHAT_SERVER || '',
      chatSocketPath: process.env.NUXT_PUBLIC_CHAT_SOCKET_PATH || '/socket.io',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
    },
  },

  vite: {
    server: {
      proxy: {
        // ✅ Proxy Socket.IO vers l'API distante (évite le CORS + corrige ERR_CONTENT_DECODING_FAILED)
        "/socket.io": {
          target: "https://api.tools.gavago.fr",
          changeOrigin: true,
          ws: true,
          secure: true,

          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              // Empêche gzip/br côté upstream (source fréquente de ERR_CONTENT_DECODING_FAILED via proxy)
              proxyReq.setHeader("accept-encoding", "identity");
            });
          },
        },

        // (optionnel) garde ton proxy local si tu en as encore besoin
        "/ws/socket.io": {
          target: "http://localhost:4001",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },


  /* ✅ (Optionnel) Empêche Nuxt/SSR de tenter de router le chemin du socket */
  routeRules: {
    // ✅ désactive SSR pour le chemin proxifié Socket.IO
    "/socket.io/**": { ssr: false },
    "/ws/**": { ssr: false },
  },

  pwa: {
    registerType: 'autoUpdate',
    devOptions: { enabled: true, suppressWarnings: true },
    manifest: {
      name: 'Nuxt PWA',
      short_name: 'Nuxt PWA',
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#f4f4f4',
      theme_color: '#ccd8bf',
      icons: [
        { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
          handler: 'CacheFirst', // ou 'NetworkOnly' si tu préfères laisser Nuxt servir les pages
          options: {
            cacheName: 'pages-cache',
            expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^\/_nuxt\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'nuxt-assets',
            expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
            sameOrigin && url.pathname.startsWith('/icons/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-assets',
            expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  },
})
