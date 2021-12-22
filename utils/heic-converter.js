const fs = require('fs');
const { exiftool } = require('exiftool-vendored');
const heicConverter = require('heic-convert');
const log = require('../utils/log');
const recordError = require('../utils/record-error');

module.exports = async function convertHeicFileIfFileNotExists(file) {
  try {
    const outputPath = file.replace(/heic$/i, 'jpg');

    if (fs.existsSync(file)) {
      return { file, outputPath };
    }

    const exifData = await exiftool.read(file);
    const inputBuffer = fs.readFileSync(file);
    const outputBuffer = await heicConverter({ buffer: inputBuffer, format: 'JPEG', quality: 1 });

    fs.writeFileSync(outputPath, outputBuffer);

    return exiftool.write(outputPath, { FileModifyDate: exifData.FileModifyDate });
  } catch (e) {
    await recordError(file, e);
    log.error(e);
  }
};
