import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const localProxy = {
  '/api': {
    target: 'http://127.0.0.1:3001',
    changeOrigin: true
  }
}

export default defineConfig({
  plugins: [react()],
  build: { manifest: true },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: localProxy
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    proxy: localProxy
  }
})
