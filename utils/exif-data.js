const { exiftool } = require('exiftool-vendored');
const log = require('../utils/log');
const { getDb } = require('../utils/db');
const recordError = require('../utils/record-error');

module.exports = async function getExifData(file) {
  try {
    const data = await exiftool.read(file);

    data.CreateDate = data.CreateDate || { year: null, month: null, day: null };
    data.ModifyDate = data.ModifyDate || { year: null, month: null, day: null };

    const year = data.CreateDate.year || data.ModifyDate.year || data.FileModifyDate.year;
    const month = data.CreateDate.month || data.ModifyDate.month || data.FileModifyDate.month;
    const day = data.CreateDate.day || data.ModifyDate.day || data.FileModifyDate.day;

    return {
      sourcePath: data.SourceFile,
      imageHeight: data.ImageHeight,
      imageWidth: data.ImageWidth,
      fileType: data.FileType,
      fileTypeExtension: data.FileTypeExtension,
      sourceFilename: data.FileName,
      fileSize: data.FileSize,
      year,
      month,
      day
    };
  } catch (e) {
    await recordError(file, e);
    log.error(e);
  }
};
