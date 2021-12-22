const markDuplicates = require('../utils/mark-duplicates');
const log = require('../utils/log');
const { getDb } = require('../utils/db');

exports.command = 'mark-duplicates';
exports.aliases = ['dupes'];
// eslint-disable-next-line max-len
exports.describe = 'Marks duplicates in the photo database. This is done in the init phase, but this is an escape hatch in case that fails';

exports.builder = (argv) => {
  return argv;
};

exports.handler = async () => {
  const { db, models: { PhotoDetails } } = await getDb();

  log.info('\nDe-duping. This may take a minute...');
  const count = await markDuplicates(db, PhotoDetails);

  log.info(`${count} image(s) marked as duplicates`);
  log.info('Finished!');
  process.exit(0);
};
