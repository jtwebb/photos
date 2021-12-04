const fs = require('fs');
const path = require('path');
const { getDb } = require('../utils/db');
const { Op } = require('sequelize');
const log = require('../utils/log');
const Piscina = require('piscina');
const { outputDir } = require('../config');
const { mkdirSync } = require('sharp/lib/libvips');

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

  const { models: { PhotoDetails } } = await getDb();

  const results = (await PhotoDetails.findAll({
    where: {
      [Op.and]: [
        { isDuplicate: false },
        { hasMoved: false }
      ]
    }
  })).map((r) => r.dataValues);

  const filesCount = results.length;
  let filesProcessed = 0;
  let filesFailed = 0;

  if (!filesCount) {
    log.info('Finished!');
    process.exit(0);
  }

  const pool = new Piscina({ filename: path.resolve(__dirname, '../workers/copy-thread.js') });

  while (results.length) {
    const data = results.shift();
    const { success } = await pool.run(data);

    if (!success) {
      filesFailed++;
    }

    log.sameLine(++filesProcessed, filesCount, `${filesFailed} file(s) have failed.`);

    if (!results.length) {
      log.info('\nFinished!');
      process.exit(0);
    }
  }
};
