const { Sequelize, Op } = require('sequelize');
const { dbConfig, pHashSupportedTypes } = require('../config');
const log = require('./log');
const setupModels = require('../models');

let db;
let models;
async function getDb() {
  if (!db) {
    const { database, options, password, storage, user } = dbConfig;
    if (options.dialect === 'sqlite') {
      db = new Sequelize({ dialect: 'sqlite', storage });
    } else {
      db = new Sequelize(database, user, password, options);
    }

    models = models || await setupModels(db);
  }

  await db
    .authenticate()
    .catch(log.errorWithExit);

  return { db, models };
}

async function getAllToCompare() {
  const { models: { PhotoDetails } } = await getDb();

  return PhotoDetails.findAll({
    where: {
      [Op.and]: [
        { hasPHashBeenCompared: false },
        { isDuplicate: false },
        { fileTypeExtension: { [Op.in]: pHashSupportedTypes.map(ext => ext.slice(1)) } }
      ]
    }
  });
}

async function getAllToCopy() {
  const { models: { PhotoDetails } } = await getDb();

  return PhotoDetails.findAll({
    where: { [Op.and]: [ { isDuplicate: false }, { hasMoved: false } ] }
  });
}

async function getAlreadyProcessed() {
  const { models: { PhotoDetails } } = await getDb();

  return PhotoDetails.findAll({ where: { hash: { [Op.not]: null } }, attributes: ['sourcePath'] });
}

module.exports = {
  getDb,
  getAllToCompare,
  getAllToCopy,
  getAlreadyProcessed
};
