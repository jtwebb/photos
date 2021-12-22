const fs = require('fs');
const path = require('path');
const { parentPort } = require('worker_threads');
const { getDb } = require('../utils/db');

parentPort.on('message', async function copyThread({ id, sourcePath, outputPath, isSimilar }) {
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
      return parentPort.postMessage({ success: true, sourcePath, outputPath, finished: true });
    })
    .catch(e => {
      console.log(e);
      return parentPort.postMessage({ success: false, sourcePath, outputPath, finished: true });
    });
});
