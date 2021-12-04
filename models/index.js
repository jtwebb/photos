const photoDetails = require('./photo-detail');
const badImages = require('./bad-image');
const comparisons = require('./comparison');

async function setupModels(db) {
  return {
    PhotoDetails: photoDetails(db),
    BadImages: badImages(db),
    Comparisons: comparisons(db)
  };
}

module.exports = setupModels;
