const fs = require('fs');
const path = require('path');
const log = require('../utils/log');
const { query } = require('../database/db');

process.on('message', async ({ sourceFile, outputFile, table, move, sourceFileColumn = 'sourceFile' } = {}) => {
  try {
    if (!sourceFile) {
      process.exit(0);
    }

    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(sourceFile)) {
      query(`update ?? set \`hasMoved\` = 1 where \`${sourceFileColumn}\` = ?`, [table, sourceFile])
        .then(() => process.exit(0))
        .catch(log.errorWithExit);
    } else {
      const func = move ? fs.rename : fs.copyFile;

      func(sourceFile, outputFile, (error) => {
        if (error) {
          log.error(sourceFile, error);
          process.exit(1);
        } else {
          query(`update ??
                 set \`hasMoved\` = 1
                 where \`${sourceFileColumn}\` = ?`, [table, sourceFile])
            .then(() => process.exit(0))
            .catch(log.errorWithExit);
        }
      });
    }
  } catch (e) {
    log.error(sourceFile, e);
    process.exit(1);
  }
});
