const hasha = require('hasha');
const log = require('../utils/log');

process.on('message', async (file) => {
  try {
    const hash = await hasha.fromFile(file);
    process.send([hash, file]);
    process.exit(0);
  } catch (e) {
    log.error(file, e);
  }
});
