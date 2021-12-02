const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const log = require('../utils/log');
const { jimpSupportedTypes } = require('../config');
const { query } = require('../database/db');

exports.command = 'phash';
exports.aliases = [];
exports.describe = 'PHash file contents to be able to find similar images';

exports.builder = (argv) => {
  return argv
    .option('force', {
      alias: 'f',
      desc: 'Force update of all columns instead of columns missing pHashes',
      type: 'boolean',
      default: false
    });
};

// https://github.com/oliver-moran/jimp/tree/master/packages/jimp#comparing-images
exports.handler = async ({ force }) => {
  let filesProcessed = 0;

  const conditions = [
    '`hasMoved` = 1',
    `\`fileTypeExtension\` in (${jimpSupportedTypes.map((t) => `'${t}'`).join(', ')})`
  ];
  if (!force) {
    conditions.push('`pHash` is null');
  }

  const [files] = await query(`select \`sourceFile\`, \`outputFile\` from \`exifs\` where ${conditions.join(' and ')}`);
  const filesCount = files.length;
  const logFileCount = log.countFiles(filesCount);

  log.info(`Starting to process ${filesCount} files...`);

  cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/phash-thread.js') });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    worker.on('message', async (processed) => {
      if (processed) {
        logFileCount(filesProcessed++);
      }
    });

    worker.on('error', (error) => {
      log.error(error);
      process.exit(1);
    });

    worker.send(files.shift() || false);
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
