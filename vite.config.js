import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',

  define: {
    __APP_VERSION__: JSON.stringify(version),
  },

  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.js'],
    exclude: ['e2e/**', 'node_modules/**'],
  },

  optimizeDeps: {
    include: ['fzstd'],
  },

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      // Incluir los binarios de sql.js y la config de la app que están en public/
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-512.png', 'sql-wasm-browser.js', 'sql-wasm-browser.wasm', 'app-config.json'],

      workbox: {
        // sql-wasm-browser.wasm supera el límite por defecto de 2MB
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,

        // Precachear todos los assets del build incluido el WASM de sql.js
        // → se descargan una sola vez y se sirven desde cache sin red
        globPatterns: ['**/*.{js,css,html,svg,wasm}'],
      },

      manifest: {
        name: 'Engrama',
        short_name: 'Engrama',
        description: 'Flashcards con repetición espaciada y sistema ELO',
        theme_color: '#bd93f9',
        background_color: '#21222c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}))
