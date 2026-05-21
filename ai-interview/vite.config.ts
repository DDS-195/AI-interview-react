import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 公网网关地址（生产环境使用）
const CLOUDBASE_GATEWAY = 'https://dds-dev-d7gavk8f1a829c17d-1408042328.ap-shanghai.app.tcloudbase.com'
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
