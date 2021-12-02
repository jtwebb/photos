const log = require('../utils/log');
const findSimilar = require('../utils/find-similar');

process.on('message', async ({ year, threshold, alreadyProcessed }) => {
  if (!year) {
    process.exit(0);
  }

  try {
    findSimilar(year, threshold, alreadyProcessed, process.send)
      .then(() => {
        process.send({ finished: true, year });
        process.exit(0);
      })
      .catch(log.errorWithExit);
  } catch (e) {
    log.errorWithExit(e);
  }
});
