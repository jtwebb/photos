const fs = require('fs');
const path = require('path');
const { getPool, query } = require('../database/db');
const log = require('../utils/log');
const getOutputFile = require('../utils/get-output-file');
const { varDir } = require('../config');
const getExifData = require('../utils/exif-data');

exports.command = 'fix-output-file';
exports.aliases = [];
exports.describe = '';

exports.builder = (argv) => {
  return argv
    .option('dry-run', {
      alias: 'r',
      desc: 'Write outputFile to a file instead of the database',
      type: 'boolean',
      default: true
    })
    .option('update-output', {
      alias: 'u',
      // eslint-disable-next-line max-len
      desc: 'Because I\'m an idiot, I used the wrong variable name for the creation date, this fixes the name, but I still have to move all the files',
      type: 'boolean',
      default: false
    });
};

exports.handler = async ({ dryRun, updateOutput }) => {
  const promises = [];
  const outputFiles = {};
  let filesProcessed = 0;

  const [rows] = await query('select count(`id`) as count from `exifs`');
  const filesCount = rows[0].count;
  const logFileCount = log.countFiles(filesCount);

  const selectQuery = getPool().query('select * from `exifs` order by `id` limit 100');
  selectQuery
    .on('error', (error) => {
      log.error(error);
      process.exit(1);
    })
    .on('result', async (row) => {
      if (updateOutput) {
        const promise = getExifDataAndUpdateOutput(row, dryRun)
          .then(({ modifiedYear, modifiedMonth, modifiedDay, revisedOutputFile }) => {
            outputFiles[row.sourceFile] = {
              original: row.outputFile,
              revisedOutputFile,
              modifiedYear,
              modifiedMonth,
              modifiedDay
            };
            logFileCount(filesProcessed++);
          })
          .catch(log.errorWithExit);

        promises.push(promise);
      } else {
        const outputFile = getOutputFile(row);

        if (dryRun) {
          outputFiles[row.sourceFile] = outputFile;
        } else {
          const column = updateOutput ? 'revisedOutputFile' : 'outputFile';
          promises.push(
            query(`update \`exifs\` set \`${column}\` = ? where \`sourceFile\` = ?`, [outputFile, row.sourceFile])
              .then(() => logFileCount(filesProcessed++))
          );
        }
      }
    })
    .on('end', () => {
      Promise.all(promises)
        .then(() => {
          if (dryRun) {
            fs.writeFileSync(path.join(varDir, 'new-filenames.json'), JSON.stringify(outputFiles, null, 2));
          }

          log.info('Finished!');
          process.exit(0);
        })
        .catch(log.errorWithExit);
    });
};

function getExifDataAndUpdateOutput(row, dryRun) {
  return getExifData(row.sourceFile)
    .then((exifData) => {
      const revisedOutputFile = getOutputFile(exifData);
      const { modifiedYear, modifiedMonth, modifiedDay } = exifData;

      if (dryRun) {
        return {
          revisedOutputFile,
          modifiedYear,
          modifiedMonth,
          modifiedDay
        };
      }

      return query(
        // eslint-disable-next-line max-len
        'update `exifs` set `modifiedYear` = ?, `modifiedMonth` = ?, `modifiedDay` = ?, revisedOutputFile = ? where `sourceFile` = ?',
        [modifiedYear, modifiedMonth, modifiedDay, revisedOutputFile, row.sourceFile]
      )
        .then(() => {
          return {
            revisedOutputFile,
            modifiedYear,
            modifiedMonth,
            modifiedDay
          };
        });
    })
    .catch(log.errorWithExit);
}
