const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const log = require('../utils/log');
const { query } = require('../database/db');

exports.command = 'move';
exports.aliases = [];
exports.describe = 'Moves files to the output directory';

exports.builder = (argv) => {
  return argv
    .option('redo', {
      alias: 'r',
      desc: 'Re-copy images that were not copied correctly'
    })
    .option('fix', {
      alias: 'f',
      desc: 'Fix mistake that put 5,000 photos in the wrong folder'
    });
};

exports.handler = async ({ redo, fix }) => {
  let filesProcessed = 0;

  let selectQuery = 'select `sourceFile`, `outputFile` from `exifs` where `isDuplicate` = 0 and `hasMoved` = 0';
  if (redo) {
    selectQuery = 'select `sourceFile`, `outputFile` from `badImages` where `hasMoved` = 0';
  } else if (fix) {
    // eslint-disable-next-line max-len
    selectQuery = 'select `outputFile` as `sourceFile`, `revisedOutputFile` as `outputFile` from `exifs` e where `isDuplicate` = 0 and e.`revisedOutputFile` != e.`outputFile`';
  }

  const [files] = await query(selectQuery);
  const filesCount = files.length;
  const logFileCount = log.countFiles(filesCount);

  log.info(`Starting to process ${filesCount} files...`);

  cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/move-thread.js') });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    const { sourceFile, outputFile } = files.shift();

    worker.on('error', (error) => {
      log.error(sourceFile, error);
      process.exit(1);
    });

    worker.send({ sourceFile, outputFile, table: redo ? 'badImages' : 'exifs', move: fix });
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
