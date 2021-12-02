const { exiftool } = require('exiftool-vendored');
const log = require('../utils/log');

module.exports = async function getExifData(file) {
  return exiftool
    .read(file)
    .then((data) => {
      const { year, month, day } = data.FileModifyDate;
      data.CreateDate = data.CreateDate || { year: null, month: null, day: null };
      data.ModifyDate = data.ModifyDate || { year, month, day };

      return {
        sourceFile: data.SourceFile,
        imageHeight: data.ImageHeight,
        imageWidth: data.ImageWidth,
        fileType: data.FileType,
        fileTypeExtension: data.FileTypeExtension,
        mimeType: data.MIMEType,
        fileName: data.FileName,
        fileSize: data.FileSize,
        modifiedYear: data.ModifyDate.year,
        modifiedMonth: data.ModifyDate.month,
        modifiedDay: data.ModifyDate.day,
        createdYear: data.CreateDate.year,
        createdMonth: data.CreateDate.month,
        createdDay: data.CreateDate.day
      };
    })
    .catch(log.errorWithExit);
};
