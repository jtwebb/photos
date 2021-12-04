const log = console.log.bind(null);
log.info = console.log.bind(null, '\x1b[36m%s\x1b[0m');
log.warn = console.log.bind(null, '\x1b[33m%s\x1b[0m');
log.error = console.log.bind(null, '\x1b[31m%s\x1b[0m');
log.sql = console.log.bind(null, '\x1b[35m%s\x1b[0m');

log.countFiles = (filesCount) => {
  return (filesProcessed) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${filesProcessed} files of ${filesCount} processed.`);
  };
};

log.sameLine = (filesProcessed, filesCount, extra = '') => {
  const length = process.stdout.columns;
  let text = `${filesProcessed.toLocaleString()} files of ${filesCount.toLocaleString()} processed. ${extra}`.trim();
  if (length < text) {
    text = `${text.slice(0, length - 4)}...`;
  }
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(text);
};

log.errorWithExit = (...args) => {
  log.error(...args);
  process.exit(1);
};

module.exports = log;
