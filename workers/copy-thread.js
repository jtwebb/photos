const path = require('path');
const fs = require('fs');
const { getDb } = require('../utils/db');

module.exports = async function copyThread({ id, sourcePath, outputPath, isSimilar }) {
  const outputDir = path.dirname(outputPath);

  if (isSimilar) {
    outputPath = path.join(outputDir, 'similar', path.basename(outputPath));
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const { models: { PhotoDetails } } = await getDb();
  return fs.promises.copyFile(sourcePath, outputPath)
    .then(() => {
      PhotoDetails.update({ hasMoved: true }, { where: { id } });
      return { success: true, sourcePath, outputPath };
    })
    .catch((e) => {
      console.log(e);
      return { success: false, sourcePath, outputPath };
    });
};
