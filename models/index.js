const photoDetails = require('./photo-detail');
const errorReport = require('./error-report');
const comparisons = require('./comparison');

async function setupModels(db) {
  return {
    PhotoDetails: photoDetails(db),
    ErrorReports: errorReport(db),
    Comparisons: comparisons(db)
  };
}

module.exports = setupModels;
