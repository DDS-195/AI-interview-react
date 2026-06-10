import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 公网网关地址（生产环境使用，通过环境变量注入）
const CLOUDBASE_GATEWAY = process.env.VITE_CLOUDBASE_GATEWAY || ''
// 本地后端地址（开发环境使用）
const LOCAL_BACKEND = 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: LOCAL_BACKEND,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
