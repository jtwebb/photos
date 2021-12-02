const fs = require('fs');
const path = require('path');
const { exiftool } = require('exiftool-vendored');
const { outputDir } = require('../config');
const log = require('../utils/log');

exports.command = 'exif';
exports.aliases = [];
exports.describe = 'Get exif data from single file';

exports.builder = (argv) => {
  return argv
    .option('file', {
      alias: 'f',
      desc: 'The absolute or relative to output dir file path to the image you want exif data for',
      type: 'string',
      demandOption: true
    });
};

exports.handler = async ({ file }) => {
  file = path.isAbsolute(file) ? file : path.join(outputDir, file);

  if (!fs.existsSync(file)) {
    log.errorWithExit(`"${file}" does not exist.`);
  }

  const exifData = await exiftool.read(file);
  console.dir(exifData);

  process.exit(0);
};
