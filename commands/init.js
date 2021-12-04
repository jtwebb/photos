const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Piscina = require('piscina');
const log = require('../utils/log');
const { originalDir } = require('../config');
const { getDb } = require('../utils/db');
const msToTime = require('../utils/to-time');
const dedupe = require('../utils/dedupe');

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

  const alreadyProcessed = (await PhotoDetails.findAll({
    where: { hash: { [Op.not]: null } },
    attributes: ['sourcePath']
  }))
    .map((r) => r.sourcePath);

  let filesProcessed = 0;
  let files = fs.readdirSync(originalDir, 'utf8')
    .map((f) => path.join(originalDir, f))
    .filter((f) => !alreadyProcessed.includes(f));
  let filesCount = files.length;
  const pool = new Piscina({ filename: path.resolve(__dirname, '../workers/init-thread.js') });

  while (files.length) {
    const file = files.shift();
    const { heicOutputPath, newDir } = await pool.run({ file, fullFileHash, includePHash });

    if (heicOutputPath) {
      files.push(heicOutputPath);
    }

    if (newDir) {
      const newFiles = fs.readdirSync(newDir, 'utf8')
        .map((f) => path.join(newDir, f))
        .filter((f) => !alreadyProcessed.includes(f));
      files = [...files, ...newFiles];
      filesCount += newFiles.length;
    }

    filesProcessed++;
    const end = Number(process.hrtime.bigint()) / 1e+6 - start / 1e+6;
    const average = end / filesProcessed;
    const timeLeft = (filesCount - filesProcessed) * average;
    const timeText = `Time: ${msToTime(end)}. Average: ${msToTime(average)}. Time Left: ${msToTime(timeLeft)}`;

    log.sameLine(filesProcessed, filesCount, timeText);

    if (!files.length) {
      log.info('\nDe-duping...');
      const markedAsDupes = await dedupe({ db, PhotoDetails });
      log.info(`${markedAsDupes} image(s) marked as duplicates`);
      log.info('Finished!');
      process.exit(0);
    }
  }
};
