const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length * 3;
const log = require('../utils/log');
const { originalDir } = require('../config');
const { query } = require('../database/db');
const { exiftool } = require('exiftool-vendored');

exports.command = 'init';
exports.aliases = [];
// eslint-disable-next-line max-len
exports.describe = 'Start here after the manual work of moving all files into one directory, unzipping all zipped files, rotating images';

exports.builder = (argv) => {
  return argv
    .option('truncate', {
      alias: 't',
      desc: 'Truncate the exifs table before starting',
      type: 'boolean',
      default: false
    })
    .option('create-table', {
      alias: 'c',
      desc: 'Create the exifs table if it does not exist',
      type: 'boolean',
      default: false
    });
};

exports.handler = async ({ truncate, createTable }) => {
  if (createTable) {
    await createDbExifTableIfNotExists();
  }

  if (truncate) {
    await query('truncate `exifs`');
  }

  const files = fs.readdirSync(originalDir, 'utf8')
    .map((f) => path.join(originalDir, f));
  const filesCount = files.length;
  const logFileCount = log.countFiles(filesCount);
  let filesProcessed = 0;

  const chunks = [];
  for (let i = 0; i < filesCount; i += 400) {
    chunks.push(files.slice(i, i + 400));
  }

  cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/init-thread.js') });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    const chunk = chunks.shift();

    worker.on('message', async ({ heicOutputPath, processed }) => {
      if (heicOutputPath) {
        files.push(heicOutputPath);
      }

      if (processed) {
        logFileCount(filesProcessed++);
      }
    });

    worker.on('error', (error) => {
      log.error(error);
      process.exit(1);
    });

    worker.send(chunk || false);
  });

  cluster.on('exit', () => {
    if (chunks.length) {
      cluster.fork();
    }

    if (Object.keys(cluster.workers).length === 0) {
      exiftool.end()
        .then(() => {
          log.info('Finished!');
          process.exit(0);
        })
        .catch(log.errorWithExit);
    }
  });
};

async function createDbExifTableIfNotExists() {
  const sql = fs.readFileSync(path.resolve(__dirname, '../database/2021-11-29_init.sql'), 'utf8');
  await query(sql);
}
