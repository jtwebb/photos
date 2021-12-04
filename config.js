const path = require('path');
const log = require('./utils/log');

const imageExt = ['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tiff', '.tif', '.heic', '.ai', '.psd'];
const rawExt = ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.xmp'];
const videoExt = ['.mov', '.mp4', '.mpg', '.3gp', '.avi'];
const zipExt = ['.zip'];
const allowedExts = [
  ...imageExt,
  ...rawExt,
  ...videoExt,
  ...zipExt
];
const exceptions = ['wp_E_20130501.pdf'].map((f) => f.toLowerCase());

const dbOptions = (process.env.DB_OPTIONS || '')
  .split(',')
  .filter(Boolean)
  .reduce((acc, current) => {
    const [key, value] = current.split(':');
    acc[key] = value;
    return acc;
  }, {});

module.exports = {
  originalDir: process.env.ORIGINAL_DIR,
  outputDir: process.env.OUTPUT_DIR,
  varDir: path.resolve(__dirname, 'var'),
  workerDir: path.resolve(__dirname, 'workers'),
  allowedExts,
  imageExt,
  rawExt,
  videoExt,
  zipExt,
  pHashSupportedTypes: ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.gif'],
  exceptions,
  dbConfig: {
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    storage: process.env.DB_STORAGE,
    options: {
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: process.env.DB_LOGGING !== 'false' ? log.sql : false,
      multipleStatements: true,
      pool: {
        max: 50,
        min: 0
      },
      ...dbOptions
    }
  }
};
