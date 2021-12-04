const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const getExifData = require('../utils/exif-data');
const convertHeic = require('../utils/heic-converter');
const getOutputFile = require('../utils/get-output-file');
const log = require('../utils/log');
const { allowedExts, exceptions, zipExt, pHashSupportedTypes } = require('../config');
const unzipper = require('unzipper');
const { getDb } = require('../utils/db');
const sharp = require('sharp');
const sharpPHash = require('sharp-phash');

module.exports = async ({ file, fullFileHash, includePHash }) => {
  const returnData = { processed: true };
  if (!file) {
    return {};
  }

  const stat = fs.statSync(file);
  if (stat.isDirectory()) {
    return { newDir: file };
  }

  const ext = path.extname(file).toLowerCase();
  const basename = path.basename(file);
  if (!allowedExts.includes(ext) && !exceptions.includes(basename.toLowerCase())) {
    return returnData;
  }

  if (ext === '.heic') {
    const { outputPath } = await convertHeic(file);
    returnData.heicOutputPath = outputPath;
  }

  if (zipExt.includes(ext)) {
    return new Promise((resolve, reject) => {
      const output = path.join(path.dirname(file), basename.replace(ext, ''));
      if (fs.existsSync(output)) {
        log.warn(`\n"${file}" could not be extracted because "${output}" already exists\n`);
        return resolve(returnData);
      }

      fs.createReadStream(file)
        .pipe(unzipper.Extract({ path: output }))
        .on('error', reject)
        .on('close', () => {
          return resolve({ ...returnData, newDir: output, processed: false });
        });
    });
  }

  const exifData = await getExifData(file);
  const { outputPath, outputFilename } = getOutputFile(exifData);
  exifData.outputFilename = outputFilename;
  exifData.outputPath = outputPath;

  exifData.hash = await hashFile(file, stat, fullFileHash);

  if (includePHash && pHashSupportedTypes.includes(ext)) {
    const buffer = await sharp(exifData.sourcePath)
      .resize(32, 32)
      .withMetadata()
      .toBuffer();
    exifData.pHash = await sharpPHash(buffer);
  }

  // maybe change this to bulk updates? https://sequelize.org/master/manual/model-querying-basics.html#creating-in-bulk
  const { models: { PhotoDetails } } = await getDb();
  const exists = await PhotoDetails.findOne({ attributes: ['id'], where: { sourcePath: exifData.sourcePath } });
  if (!exists) {
    await PhotoDetails.create(exifData);
  } else {
    await PhotoDetails.update(exifData, { where: { id: exists.id } });
  }

  return returnData;
};

/**
 * This is for speed. Reading the entire file into memory just takes far too long, although you can override that
 * @param file
 * @param stat
 * @param {boolean} fullFileHash Hash the entire file
 * @returns {Promise<string>}
 */
async function hashFile(file, stat, fullFileHash) {
  const end = fullFileHash ? stat.size : 512;

  const chunks = [];
  for await (const chunk of fs.createReadStream(file, { start: 0, end })) {
    chunks.push(chunk);
  }

  if (!fullFileHash) {
    for await (const chunk of fs.createReadStream(file, { start: stat.size - 512, end: stat.size })) {
      chunks.push(chunk);
    }
  }

  const buffer = Buffer.concat(chunks);
  const hashSum = createHash('sha512');
  hashSum.update(buffer);
  return hashSum.digest('hex');
}
