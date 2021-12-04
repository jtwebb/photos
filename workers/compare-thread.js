const getDistance = require('sharp-phash/distance');
const { getDb } = require('../utils/db');
const { Op } = require('sequelize');

module.exports = async ({ data, results, threshold }) => {
  const { models: { PhotoDetails, Comparisons } } = await getDb();

  for (const result of results) {
    const distance = getDistance(data.pHash, result.pHash);
    const isSimilar = distance < threshold;

    const exists = await Comparisons.findOne({
      where: {
        [Op.or]: [
          {
            [Op.and]: {
              firstImage: data.id,
              secondImage: result.id
            }
          },
          {
            [Op.and]: {
              firstImage: result.id,
              secondImage: data.id
            }
          }
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
      await Comparisons.update({ distance, isSimilar }, { where: { id: exists.id } });
    }
  }

  await PhotoDetails.update({ hasPHashBeenCompared: true }, { where: { id: data.id } });
};
