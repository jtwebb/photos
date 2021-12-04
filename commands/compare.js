const path = require('path');
const { Op } = require('sequelize');
const Piscina = require('piscina');
const { getDb } = require('../utils/db');
const log = require('../utils/log');
const { pHashSupportedTypes } = require('../config');

exports.command = 'compare';
exports.aliases = [];
exports.describe = 'Compare the images perceptual hashes that were collected in the `init` step';

exports.builder = (argv) => {
  return argv
    .option('year', {
      alias: 'y',
      desc: 'The year to compare (comparing all images to all other images is far too much)',
      type: 'string',
      demandOption: true
    })
    .option('threshold', {
      alias: 't',
      desc: 'The threshold for comparing images (a number between 0 and 1 with zero being a perfect match)',
      type: 'number',
      default: 0.12
    });
};

exports.handler = async ({ year, threshold }) => {
  const { models: { PhotoDetails } } = await getDb();

  const results = (await PhotoDetails.findAll({
    where: {
      [Op.and]: {
        hasPHashBeenCompared: false,
        year,
        isDuplicate: false,
        fileTypeExtension: {
          [Op.in]: pHashSupportedTypes.map((ext) => ext.slice(1))
        }
      }
    }
  }))
    .map((r) => r.dataValues);

  const filesCount = results.length;
  let filesProcessed = 0;
  const comparisonsCount = filesCount * (filesCount - 1) / 2;
  let comparisonsProcessed = 0;

  if (!filesCount) {
    log.info('Finished!');
    process.exit(0);
  }

  const pool = new Piscina({ filename: path.resolve(__dirname, '../workers/compare-thread.js') });

  while (results.length) {
    const data = results.shift();
    await pool.run({ data, results, threshold });

    log.sameLine(
      ++filesProcessed,
      filesCount,
      // eslint-disable-next-line max-len
      getComparisonMessage(++comparisonsProcessed, comparisonsCount)
    );

    if (!results.length) {
      log.info('\nFinished!');
      process.exit(0);
    }
  }
};

function getComparisonMessage(comparisonsProcessed, comparisonsCount) {
  comparisonsProcessed = comparisonsProcessed * (comparisonsProcessed - 1) / 2;
  const percent = comparisonsProcessed / comparisonsCount * 100;

  return [
    `${comparisonsProcessed.toLocaleString()} comparisons of ${comparisonsCount.toLocaleString()} processed.`,
    `${percent.toFixed(2)}%`
  ].join(' ');
}
