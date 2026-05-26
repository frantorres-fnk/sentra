import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'sentra-logo.png'],
    manifest: {
      name: 'Sentra ERP',
      short_name: 'Sentra',
      description: 'ERP móvil para tu negocio',
      theme_color: '#0F1F3D',
      background_color: '#0F1F3D',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'favicon.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
        },
        {
          src: 'favicon.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
        },
        {
          src: 'favicon.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    },
  }), cloudflare()],
})