const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length * 3;
const log = require('../utils/log');
const { query } = require('../database/db');
const { originalDir } = require('../config');

exports.command = 'hash';
exports.aliases = [];
exports.describe = 'Hash file contents to be able to find duplicates';

exports.builder = (argv) => {
  return argv
    .option('force', {
      alias: 'f',
      desc: 'Force update of all columns instead of columns missing hashes',
      type: 'boolean',
      default: false
    });
};

exports.handler = async ({ force }) => {
  let filesProcessed = 0;
  let alreadyProcessed = [];

  if (!force) {
    const [rows] = await query('select `sourceFile` from `exifs` where `hash` is not null');
    alreadyProcessed = (rows || []).map((r) => r.sourceFile);
  }

  const files = fs.readdirSync(originalDir, { encoding: 'utf8', withFileTypes: true })
    .filter((f) => !f.isDirectory() && !alreadyProcessed.includes(path.join(originalDir, f.name)))
    .map((f) => path.join(originalDir, f.name));

  const filesCount = files.length;
  const logFileCount = log.countFiles(filesCount);
  alreadyProcessed = null;

  log.info(`Starting to process ${filesCount} files...`);

  cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/hash-thread.js') });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    const currentFile = files.shift();

    worker.on('message', async ([hash, file]) => {
      await query('update `exifs` set `hash` = ? where `sourceFile` = ?', [hash, file]);
      logFileCount(filesProcessed++);
    });

    worker.on('error', (error) => {
      log.error(currentFile, error);
      process.exit(1);
    });

    worker.send(currentFile || false);
  });

  cluster.on('exit', () => {
    if (files.length) {
      cluster.fork();
    }

    if (Object.keys(cluster.workers).length === 0) {
      log.info('Finished!');
      process.exit(0);
    }
  });
};
