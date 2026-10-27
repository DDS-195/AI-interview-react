// 统一管理前后端子进程，任一服务退出或按 Ctrl+C 时一并停止。
const { spawn } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const services = [
  { name: '后端', cwd: path.join(root, 'backend'), entry: 'server.js' },
  { name: '前端', cwd: path.join(root, 'ai-interview'), entry: 'node_modules/vite/bin/vite.js' }
]

if (
  !existsSync(path.join(root, 'backend/node_modules/express')) ||
  !existsSync(path.join(root, 'backend/node_modules/mysql2')) ||
  !existsSync(path.join(root, 'ai-interview/node_modules/vite/bin/vite.js'))
) {
  console.error('请先在项目根目录运行 npm run setup 安装依赖。')
  process.exit(1)
}

const children = new Set()
let stopping = false

function stop(code) {
  if (stopping) {
    return
  }
  stopping = true
  process.exitCode = code
  for (const child of children) {
    child.kill()
  }
}

for (const service of services) {
  const child = spawn(process.execPath, [service.entry], {
    cwd: service.cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development', PORT: '3001' }
  })
  children.add(child)
  child.on('error', (error) => {
    console.error(`${service.name}启动失败：${error.message}`)
    stop(1)
  })
  child.on('close', (code) => {
    children.delete(child)
    if (!stopping) {
      console.error(`${service.name}已停止。`)
      stop(code || 1)
    }
  })
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
console.log('开发页面：http://127.0.0.1:5173，按 Ctrl+C 同时停止前后端。')
