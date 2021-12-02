const log = require('../utils/log');
const { query } = require('../database/db');
const cluster = require('cluster');
const path = require('path');
const numCPUs = require('os').cpus().length;

exports.command = 'similar';
exports.aliases = [];
exports.describe = 'Find images that are similar';

exports.builder = (argv) => {
  return argv
    .option('threshold', {
      alias: 't',
      desc: 'The distance and difference threshold',
      type: 'number',
      default: 0.1
    });
};

exports.handler = async ({ threshold }) => {
  try {
    let filesProcessed = 0;
    let allFilesCount = 0;
    const yearsWorkingOn = [];

    const [hashRows] = await query(
      'select (sha2(concat(outputFile, comparedOutputFile), 256)) as `nameHash` from `similar`'
    );
    const alreadyProcessed = hashRows.map((r) => r.nameHash);

    const [rows] = await query(
      `select \`year\` from (
        select \`createdYear\` as \`year\` from \`exifs\` where hasCompared = 0 and pHash is not null
        union
        select \`modifiedYear\` as \`year\` from \`exifs\` where hasCompared = 0 and pHash is not null and createdYear is null
      ) as e
      where \`year\` is not null order by \`year\``
    );
    const years = rows.map((r) => r.year);

    cluster.setupPrimary({ exec: path.resolve(__dirname, '../workers/similar-thread.js') });

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('fork', (worker) => {
      worker.on('message', async ({ filesCount, processed, finished, year }) => {
        if (year && !yearsWorkingOn.includes(year) && !finished) {
          yearsWorkingOn.push(year);
        }

        if (year && finished) {
          const index = yearsWorkingOn.findIndex((y) => y === year);
          if (index > -1) {
            yearsWorkingOn.splice(index, 1);
          }
        }

        if (filesCount) {
          allFilesCount += filesCount;
        } else if (processed) {
          logCount(filesProcessed++, allFilesCount, yearsWorkingOn);
        }
      });

      worker.on('error', log.errorWithExit);

      worker.send({ year: years.shift(), threshold, alreadyProcessed });
    });

    cluster.on('exit', () => {
      if (years.length) {
        cluster.fork();
      }

      if (Object.keys(cluster.workers).length === 0) {
        log.info('Finished!');
        process.exit(0);
      }
    });
  } catch (e) {
    log.errorWithExit(e);
  }
};

function logCount(filesProcessed, filesCount, yearsWorkingOn) {
  const percent = filesProcessed / filesCount * 100;
  filesProcessed = filesProcessed.toLocaleString();
  filesCount = filesCount.toLocaleString();
  const years = `Working on the following years: ${yearsWorkingOn.sort().join(', ')}`;

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${filesProcessed} files of ${filesCount} processed. ${percent.toFixed(2)}% complete. ${years}`);
}
