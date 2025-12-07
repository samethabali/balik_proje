// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // BURASI ÇOK ÖNEMLİ: Proxy Ayarı
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend adresi
        changeOrigin: true,
        secure: false,
      },
    },
  },
})