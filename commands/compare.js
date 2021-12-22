const path = require('path');
const { getAllToCompare, getDb } = require('../utils/db');
const log = require('../utils/log');
const WorkerPool = require('../utils/worker-pool');
const os = require('os');

exports.command = 'compare';
exports.aliases = [];
exports.describe = 'Compare the images perceptual hashes that were collected in the `init` step';

exports.builder = (argv) => {
  return argv
    .option('threshold', {
      alias: 't',
      desc: 'The threshold for comparing images (a number between 0 and 1 with zero being a perfect match)',
      type: 'number',
      default: 0.12
    })
    .option('diff', {
      alias: 'd',
      desc: 'Run a pixel match',
      type: 'boolean',
      default: false
    })
    .option('truncate', {
      alias: 'T',
      desc: 'Truncate the photoDetails table before starting',
      type: 'boolean',
      default: false
    });
};

exports.handler = async ({ threshold, diff, truncate }) => {
  const { models: { Comparisons, PhotoDetails } } = await getDb();
  if (truncate) {
    await Comparisons.destroy({ truncate: true });
    await PhotoDetails.update({ hasPHashBeenCompared: false }, { where: { hasPHashBeenCompared: true } });
  }

  const results = (await getAllToCompare()).map(r => r.dataValues);

  if (!results.length) {
    log.info('Finished!');
    process.exit(0);
  }

  const yearGroups = results.reduce((acc, current) => {
    acc[current.year] = acc[current.year] || [];
    acc[current.year].push(current);
    return acc;
  }, {});

  const years = Object.values(yearGroups);
  const filesCount = results.length.toLocaleString();
  const logger = setupTrackers(filesCount, years);

  const pool = new WorkerPool(os.cpus().length, path.join(process.cwd(), 'workers/compare-thread.js'));
  const promises = [];

  while (years.length) {
    const year = years.shift();
    const promise = new Promise((resolve, reject) => {
      pool.runTask({ year, threshold, diff }, (err, result) => {
        if (err) {
          return reject(err);
        }

        logger(result);

        if (!result.yearSuccess) {
          // hack to let us post messages more often than the number of years
          return new Promise(r => r());
        }

        resolve();
      });
    });

    promises.push(promise);
  }

  await Promise.all(promises);

  log.info('\nFinished!');
  process.exit(0);
};

function setupTrackers(filesCount, years) {
  let filesProcessed = 0;
  let errorsCount = 0;
  let comparesProcessed = 0;
  let yearsProcessed = 0;
  const yearCount = years.length;

  const compareCount = years.reduce((acc, current) => {
    acc += current.length * (current.length - 1) / 2;
    return acc;
  }, 0).toLocaleString();

  return ({ success, processed, yearSuccess, error }) => {
    if (success) {
      filesProcessed++;
    }

    if (error) {
      errorsCount++;
    }

    if (processed) {
      comparesProcessed++;
    }

    if (yearSuccess) {
      yearsProcessed++;
    }

    log.sameLine(
      filesProcessed,
      filesCount,
      [
        `Years: ${yearsProcessed} of ${yearCount}.`,
        `Errors: ${errorsCount}.`,
        `Comparisons: ${comparesProcessed.toLocaleString()} of ${compareCount}.`
      ].join(' ')
    );
  };
}
