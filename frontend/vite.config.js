import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  envPrefix: ['VITE_', 'ADOBE_'],

  server: {
    host: '0.0.0.0',
    port: 8080,
    headers: {
      "Content-Security-Policy": "script-src 'self' 'unsafe-inline' https://*.adobe.com https://*.adobe.io"
    }
  }
})
