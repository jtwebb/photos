const fs = require('fs');
const log = require('../utils/log');

process.on('message', async (file) => {
  if (!fs.existsSync(file)) {
    process.send(file);
    process.exit(0);
  }

  fs.unlink(file, (error) => {
    if (error) {
      log.error(file, error);
      process.send(file);
      process.exit(0);
    }

    process.send(file);
    process.exit(0);
  });
});
