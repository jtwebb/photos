const { exiftool } = require('exiftool-vendored');
const log = require('../utils/log');

module.exports = async function getExifData(file) {
  return exiftool
    .read(file)
    .then((data) => {
      // noinspection JSValidateTypess - ExifDateTime
      data.CreateDate = data.CreateDate || { year: null, month: null, day: null };

      return {
        sourceFile: data.SourceFile,
        imageHeight: data.ImageHeight,
        imageWidth: data.ImageWidth,
        fileType: data.FileType,
        fileTypeExtension: data.FileTypeExtension,
        mimeType: data.MIMEType,
        fileName: data.FileName,
        fileSize: data.FileSize,
        modifiedYear: data.FileModifyDate.year,
        modifiedMonth: data.FileModifyDate.month,
        modifiedDay: data.FileModifyDate.day,
        createdYear: data.CreateDate.year,
        createdMonth: data.CreateDate.month,
        createdDay: data.CreateDate.day
      };
    })
    .catch((e) => {
      log.error(e);
      process.exit(1);
    });
};
