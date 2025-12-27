import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    // IMPORTANT:
    // Vite по умолчанию кладет статику в `dist/assets`, что конфликтует с нашим роутом `/assets`.
    // Из-за этого nginx делает редирект на `/assets/` и формирует абсолютный URL с `http://...:3000`,
    // что ломает HTTPS (Mixed Content). Переносим статику в другую папку.
    assetsDir: 'static',
    sourcemap: false,
  }
})

