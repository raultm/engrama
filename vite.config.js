import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  test: {
    environment: 'node',
    globals: true,
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
}))
