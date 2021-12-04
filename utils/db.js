const { Sequelize } = require('sequelize');
const { dbConfig } = require('../config');
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

module.exports = { getDb };
