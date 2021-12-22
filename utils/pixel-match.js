const fs = require('fs');
const sharp = require('sharp');

module.exports = async (firstImageRaw, secondImageRaw, firstImageData, secondImageData, threshold) => {
  return new Promise(resolve => {
    new Promise(r => r(secondImageRaw || fs.promises.readFile(secondImageData.sourcePath)))
      .then(contents => {
        let diffPixels = 0;
        Promise.all([
          sharp(contents).raw().toBuffer(),
          sharp(contents).metadata()
        ])
          .then(([secondImageRaw, metadata]) => {
            if (firstImageRaw.equals(secondImageRaw)) {
              return resolve({ imageRaw: contents, difference: 0 });
            }

            for (let i = 0, len = firstImageRaw.length; i < len; i++) {
              if (metadata.channels === 4 && secondImageRaw[i + 3] === 0 && firstImageRaw[i + 3] === 0) {
                // Skip fully transparent pixels
              } else if (metadata.channels === 4 && (secondImageRaw[i + 3] === 0 || firstImageRaw[i + 3] === 0)) {
                // If one image's pixel is fully transparent, then only compare threshold of alpha channel
                if (Math.abs(secondImageRaw[i + 3] - firstImageRaw[i + 3]) > 255 * threshold) {
                  diffPixels++;
                }
              } else {
                if (
                  Math.abs(secondImageRaw[i] - firstImageRaw[i]) +
                  Math.abs(secondImageRaw[i + 1] - firstImageRaw[i + 1]) +
                  Math.abs(secondImageRaw[i + 2] - firstImageRaw[i + 2]) +
                  Math.abs(secondImageRaw[i + 3] - firstImageRaw[i + 3]) > 255 * threshold
                ) {
                  diffPixels++;
                  if (diffPixels / (firstImageData.imageWidth * firstImageData.imageHeight) > threshold) {
                    break;
                  }
                }
              }
            }

            resolve({
              imageRaw: contents,
              difference: diffPixels / (firstImageData.imageWidth * firstImageData.imageHeight)
            });
          });
    });
  });
};
