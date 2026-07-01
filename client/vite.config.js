import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas a los assets ('./assets/...') para que la app funcione
  // aunque se sirva desde un subdirectorio (p. ej. .../lienzo/app/mark-dit/)
  // y no solo desde la raiz del dominio.
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
