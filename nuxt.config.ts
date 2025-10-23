// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pages: true,
  runtimeConfig: {
    public: {
      // chatServerUrl: process.env.NUXT_PUBLIC_CHAT_SERVER || "",
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true,
      suppressWarnings: true,
    },
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
          // navigations (pages HTML)
          // typage explicite du paramètre pour éviter TS7031
          urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
          // Remarque: pour une app Nuxt SSR, 'NetworkOnly' est souvent plus sûr.
          handler: 'CacheFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 7 * 24 * 60 * 60,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // assets Nuxt (_nuxt)
          urlPattern: /^\/_nuxt\//, // regex → pas de paramètre, pas d’avertissement TS
          handler: 'CacheFirst',
          options: {
            cacheName: 'nuxt-assets',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 7 * 24 * 60 * 60,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // fichiers du dossier public (icônes, favicon...)
          // on utilise 'sameOrigin' pour éviter d'accéder à 'self'
          urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
            sameOrigin && url.pathname.startsWith('/icons/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-assets',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  },
})
