const path = require('path');
const { outputDir, rawExt, videoExt } = require('../config');

module.exports = function getOutputFile(exifData = {}) {
  // eslint-disable-next-line prefer-const
  let { sourceFilename, year, month, day } = exifData;

  let outputFilename = sourceFilename.toLowerCase();
  const dateMatch = outputFilename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const parts = dateMatch[1].split('-');
    year = parts[0];
    month = parts[1];
    day = parts[2];
  }

  outputFilename = outputFilename.replace(/[$!~{}']/g, '');

  if (year !== null && !/^\d{4}-\d{2}-\d{2}/.test(outputFilename)) {
    outputFilename = `${year}-${month}-${day}_${outputFilename}`;
  }

  let newDir = path.join(outputDir, `${year}`);
  const ext = path.extname(outputFilename);

  if (['.ai', '.psd'].includes(ext)) {
    newDir = path.join(newDir, ext.slice(1));
  }

  if (videoExt.includes(ext)) {
    newDir = path.join(newDir, 'videos');
  }

  if (rawExt.includes(ext)) {
    newDir = path.join(newDir, 'raw');
  }

  return { outputPath: path.join(newDir, outputFilename), outputFilename };
};
