const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(() => {
  const files = fs.readdirSync(process.cwd(), 'utf8')
    .filter(f => f.startsWith('isolate-0x'))
    .map(f => path.join(process.cwd(), f));

  for (let i = 0; i < files.length; i++) {
    execSync(`node --prof-process ${files[i]} > ${path.join(process.cwd(), `processed-${i}.txt`)}`);
  }
})();
