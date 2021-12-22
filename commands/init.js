const path = require('path');
const os = require('os');
const log = require('../utils/log');
const readDir = require('../utils/read-dir');
const { originalDir } = require('../config');
const { getDb, getAlreadyProcessed } = require('../utils/db');
const msToTime = require('../utils/to-time');
const markDuplicates = require('../utils/mark-duplicates');
const WorkerPool = require('../utils/worker-pool');

exports.command = 'init';
exports.aliases = [];
exports.describe = 'Start here after syncing the database `cli sync`';

exports.builder = (argv) => {
  return argv
    .option('truncate', {
      alias: 't',
      desc: 'Truncate the photoDetails table before starting',
      type: 'boolean',
      default: false
    })
    .option('full-file-hash', {
      alias: 'h',
      desc: 'Hash the entire file instead of just the first and last 512 bytes',
      type: 'boolean',
      default: false
    })
    .option('include-pHash', {
      alias: 'p',
      desc: 'Include perceptual hashes to compare similar images',
      type: 'boolean',
      default: false
    });
};

exports.handler = async ({ truncate, fullFileHash, includePHash }) => {
  const start = Number(process.hrtime.bigint());
  const { db, models: { PhotoDetails } } = await getDb();

  if (truncate) {
    await PhotoDetails.destroy({ truncate: true });
  }

  const alreadyProcessed = (await getAlreadyProcessed()).map(r => r.sourcePath);
  const contents = readDir(originalDir, f => !alreadyProcessed.includes(f));

  const logger = setupTrackers(start, contents.length);

  const pool = new WorkerPool(os.cpus().length, path.join(process.cwd(), 'workers/init-thread.js'));

  await taskRunner({ pool, contents, logger, fullFileHash, includePHash, alreadyProcessed });

  log.info('\nDe-duping. This may take a minute...');
  const count = await markDuplicates(db, PhotoDetails);

  log.info(`${count} image(s) marked as duplicates`);
  log.info('Finished!');
  process.exit(0);
};

function taskRunner(args) {
  const { pool, logger, fullFileHash, includePHash, alreadyProcessed } = args;
  let contents = args.contents;
  const promises = [];

  while (contents.length) {
    const file = contents.shift();
    const promise = new Promise(resolve => {
      pool.runTask({ file, fullFileHash, includePHash }, (error, result) => {
        if (error) {
          log.error(file, error);
          return resolve(error);
        }

        const { heicOutputPath, newDir } = result;

        if (heicOutputPath) {
          contents.push(heicOutputPath);
        }

        logger({ processed: true });

        if (newDir) {
          const newFiles = readDir(newDir, f => !alreadyProcessed.includes(f));

          contents = [...contents, ...newFiles];
          logger({ newFilesCount: newFiles.length });

          return resolve(taskRunner({ ...args, contents }));
        }

        resolve();
      });
    });

    promises.push(promise);
  }

  return Promise.all(promises);
}

function setupTrackers(start, filesCount) {
  let filesProcessed = 0;

  return ({ processed, newFilesCount }) => {
    if (processed) {
      ++filesProcessed;
    }

    if (newFilesCount) {
      filesCount += newFilesCount;
    }

    const end = Number(process.hrtime.bigint()) / 1e+6 - start / 1e+6;
    const average = end / filesProcessed;
    const timeLeft = (filesCount - filesProcessed) * average;
    const timeText = `Time: ${msToTime(end)}. Average: ${msToTime(average)}. Time Left: ${msToTime(timeLeft)}`;

    log.sameLine(filesProcessed, filesCount, timeText);
  };
}
