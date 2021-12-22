require('dotenv').config();

const fs = require('fs');
const path = require('path');
const log = require('../utils/log');
const { deployDir } = require('../config');

const denyList = [
  'node_modules',
  '.env',
  'var',
  '.idea',
  '.DS_Store'
];

(async () => {
  const promises = copyFiles(process.cwd());

  await Promise.all(promises);

  log.info('Finished!');
  process.exit(0);
})();

function copyFiles(dir, promises = []) {
  const files = fs.readdirSync(dir, { encoding: 'utf8', withFileTypes: true })
    .filter(f => !denyList.includes(f.name) && !f.name.startsWith('.'))
    .map(f => ({ isDirectory: f.isDirectory(), name: f.name, absolutePath: path.join(dir, f.name) }));

  files.forEach(f => {
    const regex = new RegExp(`${process.cwd()}/?`);
    const relativePath = f.absolutePath.replace(regex, '');
    const destPath = path.join(deployDir, relativePath);

    if (f.isDirectory) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
      }
      promises = copyFiles(f.absolutePath, promises);
    } else {
      promises.push(fs.promises.copyFile(f.absolutePath, destPath));
    }
  });

  return promises;
}
