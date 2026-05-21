const { execSync } = require('child_process');
const path = require('path');

const dirs = [
  'C:/Users/86195/Desktop/AI前端模拟面试助手React/backend',
  'C:/Users/86195/Desktop/AI前端模拟面试助手React/ai-interview'
];

for (const dir of dirs) {
  console.log(`Installing dependencies in: ${dir}`);
  execSync('npm install', { cwd: dir, stdio: 'inherit' });
}
console.log('All dependencies installed!');
