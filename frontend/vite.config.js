// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <--- BU SATIR ÇOK ÖNEMLİ (Ağa açar)
    port: 5173, // Port sabit kalsın
    // Proxy ayarı yerel çalışmada kalsın ama arkadaşın bağlanırken işe yaramayacak
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})