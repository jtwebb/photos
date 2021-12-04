const { Op } = require('sequelize');
const { getDb } = require('../utils/db');
const log = require('../utils/log');

exports.command = 'dedupe';
exports.aliases = [];
exports.describe = 'Marks images as duplicates in the database';

exports.builder = (argv) => {
  return argv;
};

exports.handler = async () => {
  const { db, models: { PhotoDetails } } = await getDb();

  // Find everything that has a duplicated hash
  const results = await PhotoDetails.findAll({
    where: {
      hash: {
        [Op.in]: db.literal(`(select \`hash\` from photoDetails group by \`hash\` having count(id) > 1)`)
      }
    }
  });

  // Group them by their hash
  const grouped = results.reduce((acc, current) => {
    acc[current.hash] = acc[current.hash] || [];
    acc[current.hash].push(current);
    return acc;
  }, {});

  let markedAsDupes = 0;
  for (const group in grouped) {
    const items = grouped[group];

    // We keep the shortest name since it's most likely to be the original (e.g. image.jpg, image-1.jpg, ...)
    items.sort((a, b) => a.sourceFilename - b.sourceFilename).shift();

    for (const item of items) {
      await item.update({ isDuplicate: true, hasHashBeenCompared: true }, { where: { id: item.id } });
      markedAsDupes++;
    }
  }

  log.info(`${markedAsDupes} image(s) marked as duplicates`);
  log.info('\nFinished!');
  process.exit(0);
};
