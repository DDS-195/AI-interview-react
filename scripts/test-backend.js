const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const backendDir = 'C:/Users/86195/Desktop/AI前端模拟面试助手React/backend';

console.log('Starting backend server...');
const server = spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'pipe',
  env: { ...process.env }
});

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('[server]', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.error('[stderr]', data.toString().trim());
});

// Wait 2 seconds then check health
setTimeout(() => {
  console.log('\n=== Testing health endpoint ===');
  http.get('http://localhost:3001/api/health', (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Health check response:', body);
      try {
        const data = JSON.parse(body);
        if (data.status === 'healthy') {
          console.log('Backend is working correctly!');
        }
      } catch (e) {
        console.error('Failed to parse health check response');
      }

      // Test API key configuration
      console.log('\n=== Checking .env configuration ===');
      const dotenv = require('dotenv');
      const envPath = path.join(backendDir, '.env');
      const result = dotenv.config({ path: envPath });
      if (result.parsed && result.parsed.AI_API_KEY) {
        const key = result.parsed.AI_API_KEY;
        console.log('API Key configured:', key.substring(0, 10) + '...' + key.substring(key.length - 4));
      }

      server.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Health check failed:', err.message);
    server.kill();
    process.exit(1);
  });
}, 3000);

setTimeout(() => {
  console.error('Backend startup timeout');
  server.kill();
  process.exit(1);
}, 10000);
