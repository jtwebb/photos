const Jimp = require('jimp');
const { query } = require('../database/db');
const log = require('../utils/log');

process.on('message', async ({ sourceFile, outputFile }) => {
  if (!outputFile) {
    process.send(false);
    process.exit(0);
  }

  Jimp.read(outputFile)
    .then((image) => {
      const pHash = image.pHash();
      query('update `exifs` set `pHash` = ? where `outputFile` = ?', [pHash, outputFile])
        .then(() => {
          process.send(true);
          process.exit(0);
        })
        .catch(log.errorWithExit);
    })
    .catch((e) => {
      query('insert ignore into `badImages` set ?', { sourceFile, outputFile, error: e.message })
        .then(() => {
          process.send(true);
          process.exit(1);
        })
        .catch(log.errorWithExit);
    });
});
