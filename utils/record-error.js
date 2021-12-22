const { getDb } = require('../utils/db');

module.exports = async (sourcePath, e) => {
  const { models: { ErrorReports } } = await getDb();

  const original = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const callsites = new Error().stack.slice(1);
  Error.prepareStackTrace = original;
  const callsite = callsites[1];
  const regex = new RegExp(`${process.cwd()}/?`, 'gi');
  const stack = e.stack
    .split('\n')
    .filter((l) => !l.includes('node:internal'))
    .map(l => l.replace(regex, '').trim())
    .join(' ');

  const data = {
    sourcePath,
    filename: callsite.getFileName(),
    functionName: callsite.getFunctionName(),
    lineNumber: callsite.getLineNumber(),
    columnNumber: callsite.getColumnNumber(),
    code: e.code,
    message: e.message,
    stack
  };

  const exists = await ErrorReports.findOne({ attributes: ['sourcePath'], where: { sourcePath } });
  if (!exists) {
    await ErrorReports.create(data);
  } else {
    await ErrorReports.update(data, { where: { sourcePath } });
  }
};
