const { parentPort } = require('worker_threads');
const { Op } = require('sequelize');
const sharp = require('sharp');
const { getDb } = require('../utils/db');
const pixelMatch = require('../utils/pixel-match');

parentPort.on('message', async ({ year, threshold, diff }) => {
  const { models: { PhotoDetails, Comparisons } } = await getDb();
  const images = {};

  if (!year) {
    return parentPort.postMessage({ finished: true });
  }

  while (year.length) {
    const data = year.shift();

    for (const result of year) {
      let difference = 1;
      let isSimilar = false;
      let distance = 1;

      if (sameRatio(data, result)) {
        distance = getDistance(data.pHash, result.pHash);
        isSimilar = distance < threshold;

        if (diff) {
          images[data.sourcePath] = images[data.sourcePath]
            ? images[data.sourcePath]
            : await sharp(data.sourcePath).ensureAlpha().raw().resize(475, 475).toBuffer();

          images[result.sourcePath] = images[data.sourcePath]
            ? images[result.sourcePath]
            : await sharp(result.sourcePath).ensureAlpha().raw().resize(475, 475).toBuffer();

          const results = await pixelMatch(
            images[data.sourcePath],
            images[result.sourcePath],
            data,
            result,
            threshold
          );
          if (!images[result.sourcePath]) {
            images[result.sourcePath] = results.imageRaw;
          }
          difference = results.difference;
        }
      }

      if (difference <= threshold || distance <= threshold) {
        const exists = await Comparisons.findOne({
          where: {
            [Op.or]: [
              { [Op.and]: { firstImage: data.id, secondImage: result.id } },
              { [Op.and]: { firstImage: result.id, secondImage: data.id } }
            ]
          }
        });

        if (!exists) {
          await Comparisons.create({
            firstImage: data.id,
            secondImage: result.id,
            distance,
            isSimilar
          });
        } else {
          await Comparisons.update({ distance, difference, isSimilar }, { where: { id: exists.id } });
        }

        await PhotoDetails.update({ isSimilar: true }, { where: { id: { [Op.in]: [data.id, result.id] } } });
      }
      parentPort.postMessage({ processed: true });
    }

    await PhotoDetails.update({ hasPHashBeenCompared: true }, { where: { id: data.id } });
    parentPort.postMessage({ success: true });
  }

  parentPort.postMessage({ yearSuccess: true, finished: true });
});

function sameRatio(firstImage, secondImage) {
  return Math.abs(
    (firstImage.imageWidth / secondImage.imageWidth) - (firstImage.imageHeight / secondImage.imageHeight)
  ) < 0.0001;
}

function getDistance(a, b) {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      count++;
    }
  }
  return count / 100;
}
