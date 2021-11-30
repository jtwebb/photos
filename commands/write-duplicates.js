const fs = require('fs');
const log = require('../utils/log');
const { getPool } = require('../database/db');

exports.command = 'write-duplicates';
exports.aliases = [];
exports.describe = 'Take hashes from database and group files by hash';

exports.builder = (argv) => {
  return argv;
};

exports.handler = async () => {
  let hashesCount = 0;
  let hashesProcessed = 0;
  const hashGroups = {};

  getPool().query('select count(`id`) as `count`, `sourceFile`, `hash` from `exifs`')
    .on('error', (error) => {
      log.error(error);
      process.exit(1);
    })
    .on('result', (row) => {
      if (!hashesCount) {
        hashesCount = row.count;
      }

      hashGroups[row.hash] = hashGroups[row.hash] || [];
      hashGroups[row.hash].push(row.sourceFile);
      hashGroups[row.hash].sort((a, b) => a.length - b.length);
      hashesProcessed++;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${hashesProcessed} files of ${hashesCount} processed.`);
    })
    .on('end', () => {
      fs.writeFileSync('grouped-hashes.json', JSON.stringify(hashGroups, null, 2));

      log.info('\nFinished!');
      process.exit(0);
    });
};
