const log = require('../utils/log');
const { query } = require('../database/db');
const findSimilar = require('../utils/find-similar');
const { outputDir } = require('../config');

exports.command = 'similar-year';
exports.aliases = [];
exports.describe = 'Find images that are similar';

exports.builder = (argv) => {
  return argv
    .option('threshold', {
      alias: 't',
      desc: 'The distance and difference threshold',
      type: 'number',
      default: 0.1
    })
    .option('year', {
      alias: 'y',
      desc: 'The year to run',
      type: 'number',
      demandOption: true
    });
};

exports.handler = async ({ threshold, year }) => {
  try {
    let filesProcessed = 0;

    const [hashRows] = await query(
      'select (sha2(concat(outputFile, comparedOutputFile), 256)) as `nameHash` from `similar`'
    );
    const alreadyProcessed = hashRows.map((r) => r.nameHash);

    const similarLogger = ({ processed, filesCount, file }) => {
      if (processed || file) {
        logCount(filesProcessed++, filesCount, file);
      }
    };

    findSimilar(year, threshold, alreadyProcessed, similarLogger)
      .then(() => {
        log.info('\nFinished!');
        process.exit(0);
      })
      .catch(log.errorWithExit);
  } catch (e) {
    log.errorWithExit(e);
  }
};

function logCount(filesProcessed, filesCount, file) {
  const percent = filesProcessed / filesCount * 100;
  filesProcessed = filesProcessed.toLocaleString();
  filesCount = filesCount.toLocaleString();

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    `${filesProcessed} files of ${filesCount} processed. ${percent.toFixed(2)}% complete.${file || ''}`
  );
}
