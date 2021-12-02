const path = require('path');
const { outputDir, rawExt, videoExt } = require('../config');

module.exports = function getOutputFile(exifData) {
  const { fileName, modifiedYear, modifiedMonth, modifiedDay, createdYear, createdMonth, createdDay } = exifData;

  let year = modifiedYear;
  let month = modifiedMonth;
  let day = modifiedDay;

  if (createdYear !== null && createdYear < year) {
    year = createdYear;
    month = createdMonth;
    day = createdDay;
  }

  let outputFile = fileName.toLowerCase();
  const dateMatch = outputFile.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const parts = dateMatch[1].split('-');
    year = parts[0];
    month = parts[1];
    day = parts[2];
  }

  if (year !== null && !/^\d{4}-\d{2}-\d{2}/.test(outputFile)) {
    outputFile = `${year}-${month}-${day}_${outputFile}`;
  }

  let newDir = path.join(outputDir, `${year}`);
  const ext = path.extname(outputFile);

  if (['.ai', '.psd'].includes(ext)) {
    newDir = path.join(outputDir, ext.slice(1));
  }

  if (videoExt.has(ext)) {
    newDir = path.join(newDir, 'videos');
  }

  if (rawExt.has(ext)) {
    newDir = path.join(newDir, 'raw');
  }

  return path.join(newDir, outputFile);
};
