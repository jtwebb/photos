const fs = require('fs');
const path = require('path');
const getExifData = require('../utils/exif-data');
const convertHeic = require('../utils/heic-converter');
const getOutputFile = require('../utils/get-output-file');
const { query } = require('../database/db');
const log = require('../utils/log');

process.on('message', async (chunk) => {
  if (!chunk) {
    process.exit(0);
  }

  const promises = [];
  chunk.forEach((file) => {
    const stat = fs.statSync(file);
    if (file && !stat.isDirectory()) {
      if (path.extname(file) === '.heic') {
        const promise = convertHeic(file).then(({ outputPath }) => process.send({ heicOutputPath: outputPath }));
        promises.push(promise);
      }

      const promise = getExifData(file)
        .then((exifData) => {
          exifData.outputFile = getOutputFile(exifData);

          return query('insert ignore into `exifs` set ?', exifData)
            .then(() => process.send({ processed: true }))
            .catch(log.errorWithExit);
        })
        .catch(log.errorWithExit);

      promises.push(promise);
    }
  });

  Promise.all(promises)
    .then(() => process.exit(0))
    .catch(log.errorWithExit);
});
