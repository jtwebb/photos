const fs = require('fs');
const path = require('path');
const { getAllToCopy } = require('../utils/db');
const { Op } = require('sequelize');
const log = require('../utils/log');
const { outputDir } = require('../config');
const { mkdirSync } = require('sharp/lib/libvips');
const WorkerPool = require('../utils/worker-pool');
const os = require('os');

exports.command = 'copy';
exports.aliases = [];
exports.describe = 'Copy files from source to output';

exports.builder = (argv) => {
  return argv;
};

exports.handler = async () => {
  if (!fs.existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const photoDetails = (await getAllToCopy()).map(r => r.dataValues);

  const logger = setupTrackers(photoDetails.length);

  if (!photoDetails.length) {
    log.info('Finished!');
    process.exit(0);
  }

  const pool = new WorkerPool(os.cpus().length, path.join(process.cwd(), 'workers/copy-thread.js'));
  const promises = [];

  while (photoDetails.length) {
    const data = photoDetails.shift();
    const promise = new Promise((resolve, reject) => {
      pool.runTask(data, (error, results) => {
        if (error) {
          return reject(error);
        }

        logger(results);

        resolve();
      });
    });

    promises.push(promise);
  }

  await Promise.all(promises);

  log.info('\nFinished!');
  process.exit(0);
};

function setupTrackers(filesCount) {
  let filesProcessed = 0;
  let filesFailed = 0;

  return ({ success }) => {
    if (!success) {
      filesFailed++;
    }

    log.sameLine(++filesProcessed, filesCount, `${filesFailed} file(s) have failed.`);
  };
}
