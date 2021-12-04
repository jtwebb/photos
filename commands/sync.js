const log = require('../utils/log');
const { getDb } = require('../utils/db');

exports.command = 'sync';
exports.aliases = [];
exports.describe = 'Sync your database changes';

exports.builder = (argv) => {
  return argv
    .option('force', {
      alias: 'f',
      desc: 'Creates the table, dropping it first if it already existed',
      type: 'boolean',
      conflicts: ['alter']
    })
    .option('alter', {
      alias: 'a',
      desc: 'Performs the necessary changes in the table to make it match the model',
      type: 'boolean',
      conflicts: ['force']
    })
    .option('log', {
      alias: 'l',
      desc: 'Log sql queries',
      type: 'boolean',
      default: false
    })
    .option('alter-drop', {
      alias: 'd',
      desc: 'Prevents any drop statements while altering a table when set to false',
      type: 'boolean',
      default: false
    });
};

exports.handler = async ({ force, alter, log: logging, alterDrop }) => {
  log.info(`Syncing db with${force ? '' : 'out'} force and with${alter ? '' : 'out'} alter`);

  const args = { logging: logging ? log.sql : false };

  if (force) {
    args.force = force;
  }

  if (alter) {
    args.alter = { alterDrop };
  }

  try {
    const { db } = await getDb();
    await db.sync(args);
  } catch (e) {
    log.error(e);
    process.exit(1);
  }

  log.info('Finished!');
  process.exit(0);
};
