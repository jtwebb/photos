const log = console.log.bind(null);
log.info = console.log.bind(null, '\x1b[36m%s\x1b[0m');
log.warn = console.log.bind(null, '\x1b[33m%s\x1b[0m');
log.error = console.log.bind(null, '\x1b[31m%s\x1b[0m');

module.exports = log;
