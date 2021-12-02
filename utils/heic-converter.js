const fs = require('fs');
const { exiftool } = require('exiftool-vendored');
const heicConverter = require('heic-convert');
const log = require('../utils/log');

module.exports = function convertHeicFileIfFileNotExists(file) {
  const outputPath = file.replace(/heic$/i, 'jpg');

  if (fs.existsSync(file)) {
    return { file, outputPath };
  }

  return exiftool.read(file)
    .then((exifData) => {
      const inputBuffer = fs.readFileSync(file);

      return heicConverter({ buffer: inputBuffer, format: 'JPEG', quality: 1 })
        .then((outputBuffer) => {
          fs.writeFileSync(outputPath, outputBuffer);
          return exiftool.write(outputPath, { FileModifyDate: exifData.FileModifyDate });
        });
    })
    .catch(log.errorWithExit);
};
