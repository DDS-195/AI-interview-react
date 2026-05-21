const { execSync } = require('child_process');
const path = require('path');

const dirs = [
  path.join(__dirname, 'backend'),
  path.join(__dirname, 'ai-interview')
];

for (const dir of dirs) {
  console.log(`Installing dependencies in: ${dir}`);
  execSync('npm install', { cwd: dir, stdio: 'inherit' });
}
console.log('All dependencies installed!');
