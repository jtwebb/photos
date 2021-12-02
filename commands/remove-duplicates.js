const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { query } = require('../database/db');
const log = require('../utils/log');

exports.command = 'remove-duplicates';
exports.aliases = [];
exports.describe = '';

exports.builder = (argv) => {
  return argv;
};

exports.handler = async () => {
  let filesProcessed = 0;
  const promises = [];
  const [rows] = await query(
    'select `outputFile` from `exifs` where `hasMoved` = 1 and `isDuplicate` = 1'
  );
  const files = rows.map((r) => r.outputFile);
  const filesCount = files.length;
  const logFileCount = log.countFiles(filesCount);

  log.info(`Starting to remove ${filesCount} files...`);

  cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/remove-duplicates-thread.js') });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    worker.on('message', async (file) => {
      const promise = query('update `exifs` set `hasMoved` = 0 where `outputFile` = ?', [file])
        .then(() => logFileCount(filesProcessed++))
        .catch(log.errorWithExit);
      promises.push(promise);
    });

    worker.on('error', (error) => {
      log.error(error);
    });

    worker.send(files.shift() || false);
  });

  cluster.on('exit', () => {
    if (files.length) {
      cluster.fork();
    }

    if (Object.keys(cluster.workers).length === 0) {
      Promise.all(promises)
        .then(() => {
          log.info('Finished!');
          process.exit(0);
        })
        .catch(log.errorWithExit);
    }
  });
};
