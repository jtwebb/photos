const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length * 3;
const { query } = require('../database/db');
const log = require('../utils/log');

exports.command = 'move-similar';
exports.aliases = [];
exports.describe = '';

exports.builder = (argv) => {
  return argv;
};

exports.handler = async () => {
  let filesProcessed = 0;

  const [rows] = await query('select `outputFile`, `comparedOutputFile` from `similar`');
  const filesSet = new Set();
  rows.forEach((row) => {
    filesSet.add(row.outputFile);
    filesSet.add(row.comparedOutputFile);
  });

  const files = Array.from(filesSet)
    .map((file) => {
      const dir = path.dirname(file);
      const basename = path.basename(file);

      return {
        sourceFile: file,
        outputFile: path.join(dir, 'similar', basename),
        table: 'similar',
        move: true,
        sourceFileColumn: 'outputFile'
      };
    });

  const filesCount = files.size;
  const logFileCount = log.countFiles(filesCount);

  log.info(`Starting to process ${filesCount} files...`);

  cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/move-thread.js') });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    worker.on('error', (error) => {
      log.error(error);
      process.exit(1);
    });

    worker.send(files.shift() || false);
  });

  cluster.on('exit', () => {
    logFileCount(filesProcessed++);

    if (files.length) {
      cluster.fork();
    }

    if (Object.keys(cluster.workers).length === 0) {
      log.info('Finished!');
      process.exit(0);
    }
  });
};
