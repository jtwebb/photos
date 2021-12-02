const { query } = require('../database/db');
const log = require('../utils/log');
const { createHash } = require('crypto');
const Jimp = require('jimp');

module.exports = async function processYear(year, threshold, alreadyProcessed, cb) {
  let image1;
  let image2;

  try {
    const [files] = await query(
      `select \`pHash\`,
              \`outputFile\`,
              \`imageHeight\` as \`height\`,
              \`imageWidth\`  as \`width\`,
              \`fileType\`,
              \`fileSize\`,
              \`modifiedYear\`,
              \`createdYear\`
       from \`exifs\`
       where pHash is not null
       and (case when \`createdYear\` is null then \`modifiedYear\` else \`createdYear\` end) = ?
       and \`outputFile\` in ((select \`outputFile\` from \`exifs\` where \`hasCompared\` = 0))`,
      [year]
    );
    const filesCount = files.length * (files.length - 1) / 2;
    cb({ filesCount, year });
    const images = {};

    log.info(`Processing ${filesCount} files for ${year}...`);

    for (let i = 0; i < files.length; i++) {
      cb({ filesCount, year, file: files[i].outputFile });
      for (let j = i + 1; j < files.length; j++) {
        if (files[i] === files[j]) {
          continue;
        }

        image1 = files[i];
        image2 = files[j];
        image1.year = image1.createdYear || image1.modifiedYear;
        image2.year = image2.createdYear || image2.modifiedYear;

        const nameHash = createHash('sha256').update(`${image1.outputFile}${image2.outputFile}`).digest('hex');
        if (alreadyProcessed.includes(nameHash)) {
          cb({ filesCount, year, processed: true });
          continue;
        }

        const distance = Jimp.compareHashes(image1.pHash, image2.pHash);

        if (!sameRatio(image1, image2) || image1.year !== image2.year || distance > 2 / 64) {
          cb({ filesCount, year, processed: true });
          continue;
        }

        const jimpImage1 = await Promise.resolve(images[image1.outputFile] || Jimp.read(image1.outputFile));
        images[image1.outputFile] = jimpImage1;
        const jimpImage2 = await Promise.resolve(images[image2.outputFile] || Jimp.read(image2.outputFile));
        images[image2.outputFile] = jimpImage2;

        const differencePercent = Jimp.diff(jimpImage1, jimpImage2, threshold).percent;
        await insertIntoDb({ image1, image2, threshold, distance, differencePercent });
        cb({ filesCount, year, processed: true });
      }
      await query('update `exifs` set `hasCompared` = 1 where `outputFile` = ?', [files[i].outputFile]);
    }
  } catch (e) {
    log.errorWithExit((image1 || {}).outputFile, (image2 || {}).outputFile, e);
  }
};

async function insertIntoDb({ image1, image2, distance = 1, differencePercent = 1, threshold = 0.1 }) {
  const isSimilar = distance < threshold || differencePercent < threshold;
  if (!isSimilar) {
    return;
  }

  differencePercent = differencePercent * 100;

  await query(`
    insert into \`similar\`
      (\`comparedOutputFile\`, \`outputFile\`, \`distance\`, \`differencePercent\`, \`isSimilar\`)
    values
      (?, ?, ?, ?, ?)
    on duplicate key update
      \`comparedOutputFile\` = ?,
      \`outputFile\` = ?,
      \`distance\` = ?,
      \`differencePercent\` = ?,
      \`isSimilar\` = ?
    `,
    [
      image2.outputFile,
      image1.outputFile,
      distance,
      differencePercent,
      isSimilar,
      image2.outputFile,
      image1.outputFile,
      distance,
      differencePercent,
      isSimilar
    ]);
}

function sameRatio(i1, i2) {
  return Math.abs((i1.width / i2.width) - (i1.height / i2.height)) < 0.0001;
}
