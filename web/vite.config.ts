import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DSK Stockers',
        short_name: 'Stockers',
        lang: 'ja',
        display: 'standalone',
        start_url: '/',
        theme_color: '#111111',
        background_color: '#ffffff',
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      // ブラウザは 5173 だけを開き、/api を Compose 内の api へ転送する。
      '/api': {
        target: 'http://api:3000',
      },
    },
  },
})
