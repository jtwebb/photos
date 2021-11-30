const fs = require('fs');
const path = require('path');
const getExifData = require('../utils/exif-data');
const convertHeic = require('../utils/heic-converter');
const { query } = require('../database/db');
const { videoExt, rawExt, outputDir } = require('../config');
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
          exifData.newFileName = getNewRelativeFilename(exifData);

          return query('insert ignore into `exifs` set ?', exifData)
            .then(() => process.send({ processed: true }))
            .catch(handleError);
        })
        .catch(handleError);

      promises.push(promise);
    }
  });

  Promise.all(promises)
    .then(() => process.exit(0))
    .catch(handleError);
});

function getNewRelativeFilename(exifData) {
  const { fileName, modifiedYear, modifiedMonth, modifiedDay, createYear, createMonth, createDay } = exifData;

  let year = modifiedYear;
  let month = modifiedMonth;
  let day = modifiedDay;

  if (createYear !== null && createYear < year) {
    year = createYear;
    month = createMonth;
    day = createDay;
  }

  let newFilename = fileName.toLowerCase();
  if (year !== null && !/^\d{4}-\d{2}-\d{2}/.test(fileName)) {
    newFilename = `${year}-${month}-${day}_${fileName}`;
  }

  let newDir = path.join(outputDir, `${year}`);
  const ext = path.extname(fileName);

  if (['.ai', '.psd'].includes(ext)) {
    newDir = path.join(outputDir, ext.slice(1));
  }

  if (videoExt.has(ext)) {
    newDir = path.join(newDir, 'videos');
  }

  if (rawExt.has(ext)) {
    newDir = path.join(newDir, 'raw');
  }

  return path.join(newDir, newFilename);
}

function handleError(e) {
  log.error(e);
  process.exit(1);
}
