const fs = require('fs');
const path = require('path');
const { getPool, query } = require('../database/db');
const log = require('../utils/log');
const { varDir } = require('../config');

exports.command = 'fix-is-duplicate';
exports.aliases = [];
exports.describe = '';

exports.builder = (argv) => {
  return argv
    .option('dry-run', {
      alias: 'r',
      desc: 'Write outputFile to a file instead of the database',
      type: 'boolean',
      default: true
    });
};

exports.handler = async ({ dryRun }) => {
  let promises = [];
  const hashes = {};

  const selectQuery = getPool().query('select * from `exifs` where `isDuplicate` = 0');
  selectQuery
    .on('error', (error) => {
      log.error(error);
      process.exit(1);
    })
    .on('result', async (row) => {
      hashes[row.hash] = hashes[row.hash] || [];
      hashes[row.hash].push(row.sourceFile);
    })
    .on('end', () => {
      const filteredHashes = Object.keys(hashes).reduce((acc, current) => {
        if (hashes[current].length > 1) {
          hashes[current].shift();
          acc[current] = hashes[current];
        }

        return acc;
      }, {});

      if (dryRun) {
        fs.writeFileSync(path.join(varDir, 'duplicate-hashes.json'), JSON.stringify(filteredHashes, null, 2));
        log.info('Finished!');
        process.exit(0);
      } else {
        promises = Object.values(filteredHashes).flat().map((sourceFile) => {
          return query('update `exifs` set `isDuplicate` = 1 where `sourceFile` = ?', [sourceFile]);
        });

        end(promises);
      }
    });
};

function end(promises) {
  Promise.all(promises)
    .then(() => {
      log.info('Finished!');
      process.exit(0);
    })
    .catch(log.errorWithExit);
}
