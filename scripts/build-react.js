const { execSync } = require('child_process');

const projectDir = 'C:/Users/86195/Desktop/AI前端模拟面试助手React/ai-interview';

console.log('=== TypeScript Type Check ===');
try {
  execSync('npx tsc -b', { cwd: projectDir, stdio: 'inherit' });
  console.log('Type check passed!');
} catch (e) {
  console.log('Type check completed with issues');
}

console.log('\n=== Vite Build ===');
try {
  execSync('npx vite build', { cwd: projectDir, stdio: 'inherit' });
  console.log('Build succeeded!');
} catch (e) {
  console.log('Build failed');
}
